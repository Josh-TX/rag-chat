import { FastifyInstance, } from "fastify";
import mistralClient from "../mistral-client"
import textContent from '../prompts/summary.prompt'
import  * as db from '../db'
import {createBroadcaster, tryGetBroadcaster, removeBroadcaster} from "../services/chat-broadcaster"

interface PersonBody {
    name: string;
    age: number;
}
interface ChatRequest {
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
}

// A route module is just an async function that receives the Fastify instance
export default async function chatRoutes(fastify: FastifyInstance) {

    fastify.post<{ Body: PersonBody }>("/test", async (request, reply) => {
        var id = db.createConversation("myconvo", JSON.stringify({name: "name"}));
        var obj = db.getConversationById(id);
        return obj;
    });

    fastify.get<{ Body: ChatRequest }>('/', async (request, reply) => {
        let completeResponse = '';
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
        try {
            const stream = await mistralClient.chat.stream({
                model: 'mistral-small-2506',
                messages: request.body.messages,
            });

            for await (const chunk of stream) {
                if (chunk.data.choices[0]?.delta?.content) {
                    const content = chunk.data.choices[0].delta.content;
                    completeResponse += content;
                    reply.raw.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
            }
            reply.raw.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            reply.raw.end();
            await storeToDatabase(completeResponse);

        } catch (error) {
            reply.raw.write(`data: ${JSON.stringify({
                type: 'error',
                error: error
            })}\n\n`);
            reply.raw.end();
        }
    });



    fastify.post<{ Body: ChatRequest }>('/chat2', async (request, reply) => {
        const stream = await mistralClient.chat.stream({
            model: 'mistral-small-2506',
            messages: request.body.messages,
        });
        var arr = []
        for await (const chunk of stream) {
            arr.push(chunk)
            if (chunk.data.choices[0]?.delta?.content) {
                reply.sse({ data: chunk.data.choices[0].delta.content.toString() });
            }
        }
        reply.sse({ event: 'done', data: JSON.stringify(arr) });
    });


    fastify.post<{ Body: ChatRequest }>('/chat3', async (request, reply) => {
        const broadcaster = createBroadcaster("1");
        (async () => {
            const stream = await mistralClient.chat.stream({
                model: 'mistral-small-2506',
                messages: request.body.messages,
            });
            for await (const chunk of stream) {
                if (chunk.data.choices[0]?.delta?.content) {
                    broadcaster.emit(chunk.data.choices[0].delta.content.toString());
                }
            }
            removeBroadcaster("1");
        })()
        reply.send({ conversationId: "1" });
    });
    fastify.get("/chat3/:id", (req, reply) => {
        const { id } = req.params as { id: string };
        const broadcaster = tryGetBroadcaster(id);
        if (!broadcaster){
            reply.raw.end();
            return;
        }
        reply.sse({ data: "connected" });

        const unsubscribe = broadcaster.addClient({
            onData: (event) => reply.sse(event),
            onClose: () => {
                reply.raw.end()
            },
        });
        req.raw.on("close", () => {
            unsubscribe()
        });
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