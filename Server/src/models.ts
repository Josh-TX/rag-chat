export type Role = "user" | 'assistant'

export type Message = {
    id: string,
    parentId?: string | undefined,
    role: Role,
    content: string,
    date: Date,
    contextList?: Context[] | undefined
}

export type Context = {
    source: string,
    content: string,
}


export type Conversation = {
    id: string,
    messages: Message[],
    currentMessageIds: string[]
}

export type MistralMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
}