export type Role = "user" | 'assistant'

export type Message = {
    id: number,
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


export type Chat = {
    chatId: string,
    messages: Message[],
    currentMessageIds: string[],
    inProgress: boolean
}

export type ChatRequest = {
    chatId: string | undefined
    messages: Message[],
    currentMessageIds: string[]
}

export type ChatResponse = {
    chatId: string
}

export type StreamChatSSEData = { chat: Chat } 
| { id: number, contextList: Context[] | undefined } 
| { id: number, append: string } 

export type MistralMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
}