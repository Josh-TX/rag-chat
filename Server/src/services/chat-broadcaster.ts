type SSEClient = {
    onData: (event: { data: string }) => void;
    onClose: () => void;
};


export class ChatBroadcaster {
    private clients: Set<SSEClient> = new Set();
    private buffer: string[] = [];
    private closed = false;

    constructor() { }

    addClient(client: SSEClient) {
        this.clients.add(client);

        // Immediately replay buffered messages
        this.buffer.forEach((msg) => client.onData({ data: msg }));

        return () => {
            this.clients.delete(client);
        };
    }

    emit(chunk: string) {
        if (this.closed) return;
        this.buffer.push(chunk);
        for (const client of this.clients.values()) {
            client.onData({ data: chunk });
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

export function createBroadcaster(id: string): ChatBroadcaster {
    let chatBroadcaster = chatBroadcasters.get(id);
    if (chatBroadcaster) {
        throw `broadcaster with id ${id} already exists`;
    }
    chatBroadcaster = new ChatBroadcaster();
    chatBroadcasters.set(id, chatBroadcaster);
    return chatBroadcaster;
}

export function tryGetBroadcaster(id: string): ChatBroadcaster | undefined {
    let chatBroadcaster = chatBroadcasters.get(id);
    return chatBroadcaster;
}

export function removeBroadcaster(id: string): void {
    let chatBroadcaster = chatBroadcasters.get(id);
    if (chatBroadcaster){
        chatBroadcaster.close();
    }
    chatBroadcasters.delete(id);
}
