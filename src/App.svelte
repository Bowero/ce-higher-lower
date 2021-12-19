<script>
  import Nav from "./components/Nav.svelte";
  import Intro from "./components/Intro.svelte";
  import Game from "./components/Game.svelte";
  import { mode } from "./stores";
</script>

<Nav />

<main
  class="min-h-screen px-10 {$mode === 'GAME_MODE'
    ? 'bg-gray-100'
    : 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400'}"
>
  {#if $mode === "INTRODUCTION_MODE"}
    <Intro />
  {:else if $mode === "GAME_MODE"}
    <Game />
  {/if}
</main>
