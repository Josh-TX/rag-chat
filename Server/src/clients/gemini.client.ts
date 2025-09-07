import { GoogleGenAI, Content } from '@google/genai';
import { IChatClientInterface } from './chat-clients-interface';
import { SimpleMessage } from '../models';
import { IEmbedClientInterface } from './embed-clients-interface';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });

export var geminiChatClient: IChatClientInterface = {
    submitChatWithStreaming: async function* (messages: SimpleMessage[]) {
        let translatedMessages: Content[] = messages.map(z => ({
            role: z.role == "user" ? "user" : "model",
            parts: [{ text: z.content }]
        }));
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.0-flash-001',
            contents: translatedMessages,
        });
        for await (const chunk of response) {
            if (chunk.text) {
                yield chunk.text;
            }
        }
    }
}

export var geminiEmbedClient: IEmbedClientInterface = {
    embed: async function (messages: string[]) {
        if (!messages.length) {
            return "input messages cannot be empty";
        }
        const response = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: messages,
        });
        if (!response.embeddings) {
            return "no embeddings generated"
        }
        var vectors = response.embeddings.map(z => z.values);
        if (vectors.some(z => !z)) {
            return "resulting embeddings vector list included undefined"
        }
        return <number[][]>vectors;
    }
}
