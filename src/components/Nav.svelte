<script>
  import {mode} from '../stores'
</script>
<nav class="py-4 px-3 {$mode==="GAME_MODE"?'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400':''}">
  <a href="/">
    <div class="max-w-min h-full flex items-center text-sm whitespace-nowrap tracking-widest leading-6 font-semibold border-b-2  uppercase md:font-bold md:text-lg {$mode==="GAME_MODE"?'text-gray-200 border-gray-700':'border-yellow-400 text-gray-900'}">
        Higher Lower
    </div>
</a>
</nav>
