<!-- Message.svelte -->
<script lang="ts">
  import type { Snippet } from "@models";

  let {
    snippets,
  }: {
    snippets: Snippet[];
  } = $props();
</script>

<div style="display: flex; justify-content: end;">
  <article>
    {#each snippets as snippet, index}
      <small class="context-msg">context</small>
      <details name="snippet-{index}">
        <summary style="text-align: right;"
          >{snippet.source} &nbsp;<small>{snippet.sectionName}</small></summary
        >
        <p>{snippet.content}</p>
      </details>
    {/each}
  </article>
</div>

<style>
  article {
    border: 1px solid var(--pico-primary-border);
    position: relative;
  }
  .context-msg {
    position: absolute;
    left: 2px;
    top: 2px;
    z-index: 1;
    pointer-events: none;
    font-size: 0.6em;
    line-height: 0.6em;
  }
</style>
