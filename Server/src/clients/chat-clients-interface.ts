import { SimpleMessage } from "../models";

export interface IChatClientInterface {
    submitChatWithStreaming(messages: SimpleMessage[]): AsyncIterable<string>;
}