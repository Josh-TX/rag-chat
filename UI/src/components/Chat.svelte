<script lang="ts">
  import type { ChatRequest, ChatResponse, StreamChatSSEData } from '@models';
  import Markdown from 'svelte-exmarkdown';
  let textAreaValue = $state("hello");
  let responseText = $state("");
  let eventSource: EventSource | null = null;

  function onclick(){
    fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { content: textAreaValue,
            role: "user"
           }]
      }),
    })
  }
  async function startStream() {
    responseText = "";
    var request: ChatRequest = {
      newMessage: {content: textAreaValue}
    }
    var response: ChatResponse = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }).then(z => z.json())
    
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    eventSource = new EventSource("/chat/stream?chatId=" + response.chatId);

    eventSource.onmessage = (event: MessageEvent<string>) => {
      var data = JSON.parse(event.data);
      if ("chat" in data) {
          console.log(data.chat);
        } else if ("contextList" in data) {
          console.log(data.id, data.contextList);
        } else if ("append" in data) {
          responseText += data.append;
          console.log(data.id, data.append);
        } else if ("end" in data) {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        }
    };

    eventSource.onerror = (err: Event) => {
      console.error("SSE error:", err);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }
</script>

<h1>this is the chat section</h1>
<textarea bind:value={textAreaValue}></textarea>
<button onclick={startStream}>enter</button>
<Markdown md={responseText} />