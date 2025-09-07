
import { Chat, SimpleMessage, ChatRequest, Message, Role } from '../models'



type TranslatedChatRequest = {
    userMessage: Message,
    responseMessage: Message,
    currentMessages: SimpleMessage[],
    chat: Chat
}

export function validateAndTranslateChatRequest(chatRequest: ChatRequest): TranslatedChatRequest {
    var messages: Message[] = [];
    if (!chatRequest.newMessage || !chatRequest.newMessage.content) {
        throw `newMessage is missing or has no content`;
    }
    var existingMessages = chatRequest.existingMessages || [];
    var currentMessageIds = chatRequest.currentMessageIds || [];
    for (var id of (chatRequest.currentMessageIds || [])) {
        var currentMessage = existingMessages.find(z => z.id == id);
        if (!currentMessage) {
            throw `currentMessageId ${id} not found among existingMessages`;
        }
        if (currentMessage.role != "assistant" && currentMessage.role != "user") {
            throw `message ${id} has invalid role`;
        }
        if (!currentMessage.content) {
            throw `message ${id} has no content`;
        }
        var prevMessage = messages.length ? messages[messages.length - 1] : null;
        if (prevMessage == null && currentMessage.role != "user") {
            throw "first currentMessage must be role 'user'";
        }
        if (prevMessage != null && prevMessage.role == currentMessage.role) {
            throw `chat cannot contain consecutive currentMessages by the same role`;
        }
        messages.push(currentMessage);
    }
    if (currentMessage && currentMessage.role != "assistant") {
        throw "last currentMessage must be role 'assistant'";
    }

    var currentMessages = messages.map(m => ({
        role: m.role,
        content: m.content
    }))
    currentMessages.push({
        role: "user",
        content: chatRequest.newMessage.content
    });
    var userMessageId = Math.max(...existingMessages.map(z => z.id), 0) + 1;
    var responseMessageId = userMessageId + 1;
    var userMessageParentId = currentMessageIds.length ? currentMessageIds[currentMessageIds.length - 1] : undefined;
    var date = new Date();
    var userMessage: Message = {
        id: userMessageId,
        parentId: userMessageParentId,
        role: "user",
        content: chatRequest.newMessage.content,
        date: date,
        contextList: chatRequest.newMessage.contextList,
    };
    var responseMessage: Message = {
        id: responseMessageId,
        parentId: userMessageId,
        role: "assistant",
        content: "",
        date: date
    };
    messages.push(userMessage, responseMessage);
    return {
        userMessage: userMessage,
        responseMessage: responseMessage,
        currentMessages: currentMessages,
        chat: {
            chatId: chatRequest.chatId || "",
            messages: messages,
            currentMessageIds: [...currentMessageIds, userMessageId, responseMessageId],
            inProgress: true,
        }
    };
}