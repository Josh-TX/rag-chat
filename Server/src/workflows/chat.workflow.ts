import  * as db from '../db'
import mistralClient from '../mistral-client';
import { Conversation, Message, MistralMessage } from '../models'

export async function postChat(conversation: Conversation){

}

export function getChat(){

}

function convertToMistralMessages(conversation: Conversation): MistralMessage[] {
    var messages: Message[] = [];
    if (!conversation.currentMessageIds || !conversation.currentMessageIds.length){
        throw `conversation has no currentMessageIds`;
    }
    for(var id of conversation.currentMessageIds){
        var currentMessage = conversation.messages.find(z => z.id == id);
        if (!currentMessage){
            throw `currentMessageId ${id} not found`;
        }
        if (currentMessage.role != "assistant" && currentMessage.role != "user"){
            throw `message ${id} has invalid role`;
        }
        if (!currentMessage.content){
            throw `message ${id} has no content`;
        }
        var prevMessage = messages.length ? messages[messages.length - 1] : null;
        if (prevMessage == null && currentMessage.role != "user"){
            throw "first message must be role user";
        }
        if (prevMessage != null && prevMessage.role == currentMessage.role){
            throw `conversation cannot contain consecutive messages by the same role`;
        }
        messages.push(currentMessage);
    }
    if (currentMessage!.role != "user"){
        throw "last message must be role user";
    }
    var mistralMessages: MistralMessage[] = messages.map(m => {
        if (m.role == "assistant" || !m.contextList || !m.contextList.length){
            return {
                role: m.role,
                content: m.content
            };
        } 
        throw "not implemented";
    })
    return mistralMessages;
}