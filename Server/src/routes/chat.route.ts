import { FastifyInstance, } from "fastify";
import chatClient from "../clients/chat-clients"
import textContent from '../prompts/summary.prompt'
import * as db from '../db'
import { createBroadcaster, tryGetBroadcaster } from "../services/chat-broadcaster"
import { ChatRequest, ChatResponse, StreamChatSSEData } from "../models";
import { validateAndTranslateChatRequest } from "../helpers/helpers";

interface PersonBody {
    name: string;
    age: number;
}

// A route module is just an async function that receives the Fastify instance
export default async function chatRoutes(fastify: FastifyInstance) {

    fastify.post<{ Body: ChatRequest; Reply: ChatResponse }>('/', async (request, reply) => {
        var translatedRequest = validateAndTranslateChatRequest(request.body);

        const broadcaster = createBroadcaster(translatedRequest.chat.chatId);
        broadcaster.emit({ chat: translatedRequest.chat });
        (async () => {
            const stream = await chatClient.submitChatWithStreaming(translatedRequest.currentMessages);
            for await (const chunk of stream) {
                broadcaster.emit({ id: translatedRequest.responseMessage.id, append: chunk });
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

    // const chatResponse = await client.chat.complete({
    //   model: 'mistral-small-2506',
    //   messages: [{role: 'user', content: 'Whats the best programming language?'}],
    // });
}

async function storeToDatabase(response: string): Promise<void> {
    // Your database storage logic here
    console.log('Storing to database:', response);
}