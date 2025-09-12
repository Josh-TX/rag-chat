import { Mistral } from '@mistralai/mistralai';
import { SimpleMessage } from '../models';
import { IChatClientInterface } from './chat-clients-interface';
const apiKey = process.env.MISTRAL_API_KEY;
const mistral = new Mistral({ apiKey: apiKey });

var client: IChatClientInterface = {
    submitChat: async function (messages: SimpleMessage[]) {
        let result = await mistral.chat.complete({
            model: 'mistral-small-2506',
            messages: messages,
        });
        let content = result.choices[0].message.content;
        if (typeof content != "string") {
            throw "mistral chat complete did not return string content";
        }
        return content;
    },
    submitChatWithStreaming: async function* (messages: SimpleMessage[]) {
        const stream = await mistral.chat.stream({
            model: 'mistral-small-2506',
            messages: messages,
        });
        for await (const chunk of stream) {
            let content = chunk.data.choices[0]?.delta?.content;
            if (content && typeof content == "string") {
                yield content;
            }
        }
    }
}
export default client;