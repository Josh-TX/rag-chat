import { FastifyInstance, } from "fastify";
import chatClient from "../clients/chat-clients";
import summaryPromptTemplate from '../prompts/summary.prompt';
import rerankPromptTemplate from '../prompts/rerank.prompt';
import finalPromptTemplate from '../prompts/final.prompt';
import { createBroadcaster, tryGetBroadcaster } from "../services/chat-broadcaster"
import { ChatRequest, ChatResponse, SimpleMessage, Snippet, StreamChatSSEData } from "../models";
import { validateAndTranslateChatRequest } from "../helpers/translate";
import * as helpers from "../helpers/helpers";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { Chunk, SemanticSearchResult, sementicSearch } from "../services/source-service"

type ParsedSummaryResult = {
    standalonePrompt: string;
    queryType: "normal" | "advanced" | string; // refine as needed
    sourceIds: number[];
    hypotheticals: string[];
}

type ParsedRerankResult = {
    groupedSnippetIds: number[],
    groupExplanation: string,
    snippets: Array<{ id: number, score: number, explanation: string }>
}

// A route module is just an async function that receives the Fastify instance
export default async function chatRoutes(fastify: FastifyInstance) {

    fastify.post<{ Body: ChatRequest; Reply: ChatResponse }>('/', async (request, reply) => {
        let translatedRequest = validateAndTranslateChatRequest(request.body);
        const broadcaster = createBroadcaster(translatedRequest.chat.chatId);
        let sourceList = "1: Holy Bible (KJV)";
        broadcaster.emit({ status: "preparing for semantic search" });
        let summaryPrompt = summaryPromptTemplate.replace("{{{sourceList}}}", sourceList).replace("{{{prompt}}}", translatedRequest.userMessage.content);
        let summaryMessages: SimpleMessage[] = [...translatedRequest.currentMessages, { content: summaryPrompt, role: "user" }];
        broadcaster.emit({ chat: translatedRequest.chat });
        (async () => {
            let summaryResult = await chatClient.submitChat(summaryMessages)
            let parsedSummary = parseSummaryResult(summaryResult)
            if (parsedSummary.queryType == "simple") {
                const stream = await chatClient.submitChatWithStreaming([...translatedRequest.currentMessages, translatedRequest.userMessage]);
                for await (const chunk of stream) {
                    broadcaster.emit({ id: translatedRequest.responseMessage.id, append: chunk });
                }
            } else if (parsedSummary.queryType == "normal") {
                broadcaster.emit({ status: "performing semantic search" });
                let searchResults = await sementicSearch(parsedSummary.hypotheticals);
                broadcaster.emit({ status: "reranking found sources" });
                let summarizedLatestPrompt = translatedRequest.currentMessages.length ? parsedSummary.standalonePrompt : translatedRequest.userMessage.content;
                let rerankResult = await rerank(searchResults, summarizedLatestPrompt);
                broadcaster.emit({ id: translatedRequest.userMessage.id, snippets: rerankResult.snippets });
                broadcaster.emit({ id: translatedRequest.userMessage.id, debug: rerankResult.debug });
                let finalMessages = [...translatedRequest.currentMessages, translatedRequest.userMessage];
                if (rerankResult.snippets.length) {
                    let sourcesStr = rerankResult.snippets.map(snippet => "<source>\n" + snippet.content + "\n</source>\n").join()
                    let finalPrompt = finalPromptTemplate.replace("{{{sources}}}", sourcesStr).replace("{{{prompt}}}", translatedRequest.userMessage.content);
                    finalMessages[finalMessages.length - 1].content = finalPrompt;
                }
                let stream = await chatClient.submitChatWithStreaming(finalMessages);
                for await (let chunk of stream) {
                    broadcaster.emit({ id: translatedRequest.responseMessage.id, append: chunk });
                }
            } else {
                throw "unknown query type";
            }
            broadcaster.close();
        })();
        reply.send({ chatId: translatedRequest.chat.chatId });
    });



    fastify.get<{ Querystring: { chatId: string } }>("/stream", (req, reply) => {
        const { chatId } = req.query
        const broadcaster = tryGetBroadcaster(chatId);
        if (!broadcaster) {
            console.log("no broadcaster")
            reply.raw.end();
            return;
        }

        let isCleanedUp = false;
        const cleanup = () => {
            if (isCleanedUp) return;
            isCleanedUp = true;
            console.log("cleaning up connection");
            unsubscribe();
        };
        const unsubscribe = broadcaster.addClient({
            onData: (data) => {
                if (!isCleanedUp) {
                    reply.sse({ data: JSON.stringify(data) });
                }
            },
            onClose: () => {
                if (!isCleanedUp) {
                    const endMessage: StreamChatSSEData = { end: true };
                    reply.sse({ data: JSON.stringify(endMessage) });
                    setTimeout(() => {
                        if (!isCleanedUp) {
                            reply.raw.end();
                            cleanup();
                        }
                    }, 5)
                }
            },
        });
        req.raw.on("close", cleanup);
    });
}


function parseSummaryResult(xml: string): ParsedSummaryResult {
    const parser = new XMLParser({
        isArray: (name) => name === "hypothetical",
        ignoreAttributes: false,
    });

    // Wrap in a root element since XMLParser requires one
    const wrapped = `<root>${xml}</root>`;
    const parsed = parser.parse(wrapped).root;

    return {
        standalonePrompt: parsed["standalone-prompt"] ?? "",
        queryType: parsed["query-type"] ?? "normal",
        sourceIds: parsed["source-ids"]
            ? parsed["source-ids"].toString()
                .split(",")
                .map((id: string) => parseInt(id.trim(), 10))
            : [],
        hypotheticals: parsed.hypothetical ?? [],
    };
}

type RerankResult = {
    snippets: Snippet[],
    debug: ParsedRerankResult
}

async function rerank(semanticSearchResult: SemanticSearchResult[], summarizedPrompt: string): Promise<RerankResult> {
    let chunks = semanticSearchResult.map(z => z.chunks).flat();
    var chunkGroups = helpers.groupBy(chunks, z => ({ source: z.source, section: z.sectionName }));
    let mergedChunks = chunkGroups.map(g => {
        if (g.items.length == 1) {
            return g.items;
        }
        const mergedChunks: Chunk[] = [];
        const sorted = [...g.items].sort((a, b) => a.startIndex - b.startIndex);
        let current = { ...sorted[0] };
        for (let i = 1; i < sorted.length; i++) {
            const next = sorted[i];
            if (next.startIndex <= current.endIndex + 1) {
                current.endIndex = Math.max(current.endIndex, next.endIndex);
                if (next.startIndex == current.endIndex + 1) {
                    current.content += " " + next.content;
                } else {
                    current.content = mergeSentences(current.content, next.content)
                }
            } else {
                mergedChunks.push(current);
                current = { ...next };
            }
        }
        mergedChunks.push(current);
        return mergedChunks;
    }).flat();
    let snippetData = mergedChunks.map((chunk, index) => ({
        id: (index + 1),
        source: chunk.source,
        author: chunk.author,
        sectionName: chunk.sectionName,
        content: chunk.content
    }));
    const snippetsXmlData = snippetData.map((snippet) => ({
        snippet: {
            '@_id': snippet.id.toString(),
            source: snippet.source,
            author: snippet.author,
            'section-title': snippet.sectionName,
            content: snippet.content
        }
    }));
    const xmlBuilder = new XMLBuilder({ ignoreAttributes: false, format: true, attributeNamePrefix: '@_' });
    const snippetsXmlString = snippetsXmlData.map(s => xmlBuilder.build(s)).join('\n');
    let rerankPrompt = rerankPromptTemplate.replace("{{{prompt}}}", summarizedPrompt).replace("{{{snippets}}}", snippetsXmlString);
    let rerankResultXmlStr = await chatClient.submitChat([{ content: rerankPrompt, role: "user" }]);
    let rerankResult = parseRerankResult(rerankResultXmlStr);
    function parseRerankResult(xml: string): ParsedRerankResult {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            textNodeName: "explanation"
        });

        const wrapped = `<root>${xml}</root>`;
        const parsed = parser.parse(wrapped).root;
        const snippets = Array.isArray(parsed.snippet)
            ? parsed.snippet
            : [parsed.snippet];

        return {
            groupedSnippetIds: parsed["snippet-group"].csv
                .split(",")
                .map((n: string) => parseInt(n, 10)),
            groupExplanation: parsed["snippet-group"].explanation,
            snippets: snippets.map((s: any) => ({
                id: parseInt(s.id, 10),
                score: parseInt(s.score, 10),
                explanation: s.explanation
            }))
        };
    }
    let selectedSnippets = rerankResult.groupedSnippetIds
        .map(id => snippetData.find((snippet) => snippet.id == id))
        .filter(z => !!z)
        .map(z => ({
            source: z.source,
            sectionName: z.sectionName,
            content: z.content
        }));
    return {
        snippets: selectedSnippets,
        debug: rerankResult
    };
}

function mergeSentences(str1: string, str2: string): string {
    str1 = str1.trim();
    str2 = str2.trim();
    let maxOverlap = 0;
    const minLen = Math.min(str1.length, str2.length);

    for (let len = 1; len <= minLen; len++) {
        const endOfStr1 = str1.slice(-len);
        const startOfStr2 = str2.slice(0, len);

        if (endOfStr1 === startOfStr2) {
            maxOverlap = len;
        }
    }
    if (maxOverlap === 0) {
        throw new Error("No overlap found between the two strings.");
    }
    return str1 + str2.slice(maxOverlap);
}