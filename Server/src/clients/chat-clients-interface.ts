import { SimpleMessage } from "../models";

export interface IChatClientInterface {
    submitChat(messages: SimpleMessage[]): Promise<string>;
    submitChatWithStreaming(messages: SimpleMessage[]): AsyncIterable<string>;
}