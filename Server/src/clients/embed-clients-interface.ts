import { SimpleMessage } from "../models";

export interface IEmbedClientInterface {
    embed(items: string[]): Promise<number[][] | string>;
}