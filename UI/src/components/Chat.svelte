<script lang="ts">
  import type { Chat, ChatRequest, ChatResponse } from "@models";
  import Message from "./Message.svelte";
  import { startStream } from "../helpers";
  let chat = $state<Chat>({
    chatId: "1",
    currentMessageIds: [],
    messages: [],
    inProgress: false,
  });
  let currentMessages = $derived(
    chat.currentMessageIds
      .map((id) => chat.messages.find((z) => z.id == id))
      .filter((z) => !!z),
  );

  async function onSubmit(content: string) {
    var request: ChatRequest = {
      chatId: chat.chatId,
      currentMessageIds: chat.currentMessageIds,
      existingMessages: chat.messages,
      newMessage: { content: content },
    };
    var response: ChatResponse = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }).then((z) => z.json());

    startStream(response.chatId, (data) => {
      if ("chat" in data) {
        chat.currentMessageIds = data.chat.currentMessageIds;
        chat.messages = data.chat.messages;
        chat.inProgress = data.chat.inProgress;
        chat.chatId = data.chat.chatId;
      } else if ("contextList" in data) {
        console.log(data.id, data.contextList);
      } else if ("append" in data) {
        var message = chat.messages.find((z) => z.id == data.id);
        if (message) {
          message.content += data.append;
        }
      } else if ("end" in data) {
        chat.inProgress = false;
      }
    });
  }
</script>

<div class="container" style="max-width: 1000px; padding: 0 2px;">
  <h2>Welcome to Rag Chat</h2>
  {#each currentMessages as message (message.id)}
    <Message
      text={message.content}
      isEditing={false}
      {onSubmit}
      role={message.role}
    ></Message>
  {/each}
  {#if !chat.inProgress}
    <Message text={""} isEditing={true} {onSubmit} role="user"></Message>
  {/if}
</div>
