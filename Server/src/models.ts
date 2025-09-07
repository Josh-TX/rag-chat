export type Role = "user" | 'assistant'

export type Message = {
    id: number,
    parentId?: number | undefined,
    role: Role,
    content: string,
    date: Date,
    contextList?: Context[] | undefined
}

export type SimpleMessage = {
    content: string,
    role: Role
}

export type Context = {
    source: string,
    content: string,
}

export type NewUserMessage = {
    content: string,
    contextList?: Context[] | undefined
}

export type Chat = {
    chatId: string,
    messages: Message[],
    currentMessageIds: number[],
    inProgress: boolean
}

export type ChatRequest = {
    chatId?: string,
    existingMessages?: Message[],
    newMessage: NewUserMessage,
    currentMessageIds?: number[]
}

export type ChatResponse = {
    chatId: string
}

export type StreamChatSSEData = { chat: Chat }
    | { id: number, contextList: Context[] | null }
    | { id: number, append: string }
    | { end: true }

export type MistralMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
}