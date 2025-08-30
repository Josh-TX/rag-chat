import { StreamChatSSEData } from "../models";

type SSEClient = {
    onData: (data: StreamChatSSEData) => void;
    onClose: () => void;
};

interface ChatReceiver {
    addClient(client: SSEClient): () => void
}
interface ChatSender {
    emit(data: StreamChatSSEData): void,
    close(): void
}

class ChatBroadcaster {
    private clients: Set<SSEClient> = new Set();
    private buffer: StreamChatSSEData[] = [];
    private closed = false;

    constructor() { }

    addClient(client: SSEClient): () => void {
        this.clients.add(client);
        this.buffer.forEach((msg) => client.onData(msg));
        return () => {
            this.clients.delete(client);
        };
    }

    emit(data: StreamChatSSEData): void {
        if (this.closed) return;
        this.buffer.push(data);
        for (const client of this.clients.values()) {
            client.onData(data);
        }
    }

    close() {
        if (this.closed) return;
        this.closed = true;
        for (const client of this.clients.values()) {
            client.onClose();
        }
        this.clients.clear();
    }
}

const chatBroadcasters = new Map<string, ChatBroadcaster>();

export function createBroadcaster(id: string): ChatSender {
    let chatBroadcaster = chatBroadcasters.get(id);
    if (chatBroadcaster) {
        throw `broadcaster with id ${id} already exists`;
    }
    chatBroadcaster = new ChatBroadcaster();
    chatBroadcasters.set(id, chatBroadcaster);
    return {
        emit: (data: StreamChatSSEData) => chatBroadcaster.emit(data),
        close: () => {
            chatBroadcaster.close();
            chatBroadcasters.delete(id);
        }
    };
}

export function tryGetBroadcaster(id: string): ChatReceiver | undefined {
    let chatBroadcaster = chatBroadcasters.get(id);
    if (chatBroadcaster){
        return {
            addClient: (client: SSEClient) => chatBroadcaster.addClient(client)
        }
    }
    return undefined;
}
