import type { StreamChatSSEData } from "@models";

export async function startStream(chatId: string, onMessage: (data: StreamChatSSEData) => void) {
    let eventSource = new EventSource("/chat/stream?chatId=" + chatId);
    eventSource.onmessage = (event: MessageEvent<string>) => {
        var data: StreamChatSSEData = JSON.parse(event.data);
        if ("end" in data) {
            if (data.end && eventSource) {
                eventSource.close();
            }
        }
        onMessage(data);
    };
    eventSource.onerror = (err: Event) => {
        console.error(err)
        if (eventSource) {
            eventSource.close();
        }
    };
}