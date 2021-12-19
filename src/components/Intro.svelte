<script>
  import { mode } from "../stores";
</script>

<div class="flex flex-col items-center gap-10 py-10">
  <div
    class="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10"
  >
    <h1 class="font-medium text-gray-800 text-3xl text-center">
      Let's play a game. It's called
    </h1>
    <div class="bg-white py-8 px-10 md:py-4 md:px-8 transform -skew-x-12">
      <div class="skew-x-12">
        <h1 class="font-semibold text-gray-800 text-4xl whitespace-nowrap">
          Higher Lower
        </h1>
      </div>
    </div>
  </div>
  <div>
    <h2 class="text-gray-800 text-xl font-bold mb-5">The rules are simple.</h2>
    <div class="flow-root">
      <ul role="list" class="-mb-8 text-md md:text-lg">
        <li>
          <div class="relative pb-8">
            <span
              class="absolute top-4 left-2.5 -ml-px h-full w-0.5 bg-gray-200"
              aria-hidden="true"
            />
            <div class="relative flex items-center space-x-3">
              <div>
                <span
                  class="h-5 w-5 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white"
                >
                  <!-- Heroicon name: solid/user -->
                  <svg
                    class="h-3 w-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </span>
              </div>
              <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                <div>
                  <p class="text-md text-gray-900">
                    To start with, you'll be given two statements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </li>
        <li>
          <div class="relative pb-8">
            <span
              class="absolute top-4 left-2.5 -ml-px h-full w-0.5 bg-gray-200"
              aria-hidden="true"
            />
            <div class="relative flex items-center space-x-3">
              <div>
                <span
                  class="h-5 w-5 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white"
                >
                  <!-- Heroicon name: solid/user -->
                  <svg
                    class="h-3 w-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </span>
              </div>
              <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                <div>
                  <p class="text-md text-gray-900">
                    Select and remember a statement to begin the game.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </li>
        <li>
          <div class="relative pb-8">
            <div class="relative flex items-center space-x-3">
              <div>
                <span
                  class="h-5 w-5 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white"
                >
                  <!-- Heroicon name: solid/user -->
                  <svg
                    class="h-3 w-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </span>
              </div>
              <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                <div>
                  <p class="text-md text-gray-900">
                    Decided if subsequent statements are higher or lower.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
  <button
    on:click={() => {
      $mode = "GAME_MODE";
    }}
    class="px-5 py-2 bg-gray-100 text-gray-900 text-lg font-semibold shadow-lg rounded-sm">Let's GO!</button
  >
</div>
