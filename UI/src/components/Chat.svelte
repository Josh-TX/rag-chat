<script lang="ts">
  let count: number = $state(0)
  const increment = () => {
    count += 1
  }
  let textAreaValue = $state("hello");
  let messages = $state<string[]>([]);
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
    var response = await fetch("/chat/chat3", {
      method: "POST", // Specify method
      headers: {
        "Content-Type": "application/json" // Tell the server you're sending JSON
      },
      body: JSON.stringify({messages: [{role: "user", content: textAreaValue}]}) // Convert JS object to JSON string
    }).then(z => z.json())
    

    // Close existing connection if any
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    // Initialize SSE
    eventSource = new EventSource("/chat/chat3/" + response.conversationId);

    // Listen for messages
    eventSource.onmessage = (event: MessageEvent<string>) => {
      messages = [...messages, event.data];
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
<ul>
  {#each messages as msg}
    <li>{msg}</li>
  {/each}
</ul>