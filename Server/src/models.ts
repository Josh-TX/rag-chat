export type Role = "user" | 'assistant'

export type Message = {
    id: number,
    parentId?: number | null,
    role: Role,
    content: string,
    date: Date,
    snippets?: Snippet[] | null
}

export type SimpleMessage = {
    content: string,
    role: Role
}

export type Snippet = {
    source: string,
    sectionName: string
    content: string,
}

export type NewUserMessage = {
    content: string,
    snippets?: Snippet[] | null
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

export type SSEDebugData = { [key: string]: any }

export type StreamChatSSEData =
    { chat: Chat }
    | { status: string }
    | { id: number, debug: SSEDebugData }
    | { id: number, snippets: Snippet[] | null }
    | { id: number, append: string }
    | { end: true }

export type MistralMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
}