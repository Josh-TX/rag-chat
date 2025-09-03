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
      textarea.style.height = textarea.scrollHeight + 2 + "px";
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
  <form onsubmit={handleSubmit} class="input-container">
    <textarea
      class="input"
      bind:this={textarea}
      bind:value={text}
      rows="1"
      oninput={autoResize}
      onkeydown={handleKeydown}
      placeholder="Type a message..."
    ></textarea>
    <div class="input-footer">
      <button type="submit" class="btn-sm" style="margin: 0;">send</button>
    </div>
  </form>
{:else if role == "user"}
  <div class="message-container">
    <div class="message">
      {text}
    </div>
  </div>
{:else}
  <article>
    <Markdown md={text} />
  </article>
{/if}

<style>
  .message-container {
    display: flex;
    justify-content: end;
    margin-bottom: 8px;
  }
  .message {
    --pico-background-color: var(--pico-form-element-background-color);
    --pico-border-color: var(--pico-form-element-border-color);
    --pico-color: var(--pico-form-element-color);
    border: var(--pico-border-width) solid var(--pico-border-color);
    background-color: var(--pico-background-color);
    color: var(--pico-color);
    border-radius: 12px;
    padding: 12px;
  }

  .input-container {
    position: relative;
  }
  .input-footer {
    position: absolute;
    bottom: 0;
    right: 0;
    margin: 2px 2px;
  }

  .btn-sm {
    padding: 3px 10px;
    font-size: 0.8em;
    border-radius: 10px;
  }

  .input {
    min-height: 44px; /* comfortable single-line height */
    max-height: 60vh; /* cap growth */
    resize: none; /* JS will auto-grow */
    padding: 12px 12px 34px 12px;
    border-radius: 12px;
    line-height: 1.4;
  }
</style>
