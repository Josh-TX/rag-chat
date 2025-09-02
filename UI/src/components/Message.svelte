<!-- Message.svelte -->
<script lang="ts">
  import type { Role } from "@models";
  import { onMount } from "svelte";
  import Markdown from "svelte-exmarkdown";

  let {
    text = $bindable(""),
    isEditing = true,
    role,
    onSubmit,
  }: {
    text: string;
    isEditing: boolean;
    role: Role;
    onSubmit: (text: string) => void;
  } = $props();

  let textarea: HTMLTextAreaElement;

  // Adjust height to fit content
  function autoResize() {
    if (textarea) {
      textarea.style.height = "auto"; // reset
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (text.trim() === "") return;
    isEditing = false;
    onSubmit(text.trim());
  }

  onMount(() => {
    autoResize();
  });
</script>

{#if isEditing}
  <form onsubmit={handleSubmit} class="chat-input-container">
    <textarea
      class="chat-input"
      bind:this={textarea}
      bind:value={text}
      rows="1"
      oninput={autoResize}
      onkeydown={handleKeydown}
      placeholder="Type a message..."
    ></textarea>
    <button class="chat-submit" type="submit">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3.4 20.6 22 12 3.4 3.4 5.6 11H14v2H5.6l-2.2 7.6Z"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
      </svg>
      <span>Send</span>
    </button>
  </form>
{:else if role == "user"}
  <div class="message-container user">
    <div class="message">
      <Markdown md={text} />
    </div>
  </div>
{:else}
  <div class="message-container">
    <div class="message">
      <Markdown md={text} />
    </div>
  </div>
{/if}

<style>
  .message-container {
    display: flex;
    justify-content: start;
    margin-bottom: 4px;
  }
  .message-container.user {
    display: flex;
    justify-content: end;
  }
  .message {
    background: #383838;
    border: 1px solid var(--muted);
    border-radius: 16px;
    padding: 8px;
  }

  .chat-input-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end; /* align button with textarea baseline */
    background: #383838;
    border: 1px solid var(--muted);
    border-radius: 16px;
    padding: 8px;
    transition:
      box-shadow 0.15s ease,
      border-color 0.15s ease;
    max-width: 900px;
    margin: 0 auto; /* center horizontally */
  }

  .chat-input {
    flex: 1 1 auto;
    min-height: 44px; /* comfortable single-line height */
    max-height: 60vh; /* cap growth */
    width: 100%;
    resize: none; /* JS will auto-grow */
    border: 0;
    outline: none;
    background: var(--panel-2);
    color: var(--text);
    padding: 12px 14px;
    border-radius: 12px;
    line-height: 1.4;
  }

  .chat-submit {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 44px;
    padding: 0 14px 0 12px;
    border-radius: 12px;
    border: 1px solid color-mix(in oklab, var(--btn) 35%, var(--muted));
    background: linear-gradient(
      180deg,
      color-mix(in oklab, var(--btn) 85%, #fff),
      var(--btn)
    );
    color: var(--btn-text);
    font-weight: 600;
    cursor: pointer;
    outline: none;
    transition:
      transform 0.04s ease,
      filter 0.15s ease,
      opacity 0.15s ease;
  }
</style>
