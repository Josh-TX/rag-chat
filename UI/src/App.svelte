<script lang="ts">
  import Chat from './components/Chat.svelte'
  import Sidebar from './components/Sidebar.svelte'
</script>

  <div style="display: flex;">
    <div style="width: 300px;"><Sidebar></Sidebar></div>
    <div style="flex: 1"><Chat></Chat></div>
  </div>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
