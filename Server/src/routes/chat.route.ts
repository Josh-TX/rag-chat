import { FastifyInstance, } from "fastify";
import chatClient from "../clients/chat-clients";
import summaryPromptTemplate from '../prompts/summary.prompt';
import rerankPromptTemplate from '../prompts/rerank.prompt';
import finalPromptTemplate from '../prompts/final.prompt';
import * as db from '../db'
import { createBroadcaster, tryGetBroadcaster } from "../services/chat-broadcaster"
import { ChatRequest, ChatResponse, SimpleMessage, StreamChatSSEData } from "../models";
import { validateAndTranslateChatRequest } from "../helpers/helpers";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import vdbClient from "../qdrant-client";
import embedClient from "../clients/embed-clients"
import { sementicSearch } from "../services/source-service"

type ParsedSummaryResult = {
    standalonePrompt: string;
    queryType: "normal" | "advanced" | string; // refine as needed
    sourceIds: number[];
    hypotheticals: string[];
}

type ParsedRerankResult = {
    groupdSnippetIds: number[],
    groupExplanation: string,
    snippets: Array<{ id: number, score: number, explanation: string }>
}

// A route module is just an async function that receives the Fastify instance
export default async function chatRoutes(fastify: FastifyInstance) {

    fastify.post<{ Body: ChatRequest; Reply: ChatResponse }>('/', async (request, reply) => {
        let translatedRequest = validateAndTranslateChatRequest(request.body);
        const broadcaster = createBroadcaster(translatedRequest.chat.chatId);
        let sourceList = "1: Holy Bible (KJV)";
        let summaryPrompt = summaryPromptTemplate.replace("{{{sourceList}}}", sourceList).replace("{{{prompt}}}", translatedRequest.userMessage.content);
        let summaryMessages: SimpleMessage[] = [...translatedRequest.currentMessages, { content: summaryPrompt, role: "user" }];
        broadcaster.emit({ chat: translatedRequest.chat });
        (async () => {
            let summaryResult = await chatClient.submitChat(summaryMessages)
            //todo: make this parse to camel case
            const xmlParser = new XMLParser({ isArray: (name) => name === "hypothetical" });
            let parsedSummary: ParsedSummaryResult = xmlParser.parse(summaryResult);
            if (parsedSummary.queryType == "simple") {
                const stream = await chatClient.submitChatWithStreaming([...translatedRequest.currentMessages, translatedRequest.userMessage]);
                for await (const chunk of stream) {
                    broadcaster.emit({ id: translatedRequest.responseMessage.id, append: chunk });
                }
            } else if (parsedSummary.queryType == "normal") {
                let searchResults = await sementicSearch(parsedSummary.hypotheticals);
                const snippetsXmlData = searchResults.map(z => z.snippets).flat().map((snippet, index) => ({
                    snippet: {
                        '@_id': (index + 1).toString(),
                        source: snippet.source,
                        author: snippet.author,
                        'section-title': snippet.sectionName,
                        content: snippet.content
                    }
                }));
                const xmlBuilder = new XMLBuilder({ ignoreAttributes: false, format: true, attributeNamePrefix: '@_' });
                const snippetsXmlString = snippetsXmlData.map(s => xmlBuilder.build(s)).join('\n');
                let summarizedLatestPrompt = translatedRequest.currentMessages.length ? parsedSummary.standalonePrompt : translatedRequest.userMessage.content;
                let rerankPrompt = rerankPromptTemplate.replace("{{{prompt}}}", summarizedLatestPrompt).replace("{{{snippets}}}", snippetsXmlString);
                let rerankResultXmlStr = await chatClient.submitChat([{ content: rerankPrompt, role: "user" }]);
                let rerankResult = parseRerankResult(rerankResultXmlStr);
                let selectedSnippets = rerankResult.groupdSnippetIds.map(id => {
                    return searchResults.map(z => z.snippets).flat().find((_, index) => index + 1 == id);
                }).filter(z => !!z);
                let finalMessages = [...translatedRequest.currentMessages, translatedRequest.userMessage];
                if (selectedSnippets.length) {
                    let sourcesStr = selectedSnippets.map(snippet => "<source>\n" + snippet.content + "\n</source>\n").join()
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
        groupdSnippetIds: parsed["snippet-group"].csv
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