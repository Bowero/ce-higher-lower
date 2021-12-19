<script>
    import {score} from "../stores";
    import {statements} from "../statements";

    let gameStatus = "START";
    let previousNumber = 0;
    let statement = {};
    let firstStatement = {};
    let secondStatement = {};
    let gameOverMessage = "";
    let gameOver = false;
    let gameStaments = statements;
    $: if (gameStatus === "START") {
        firstStatement = getStatement();
        secondStatement = getStatement();
    } else {
        statement = getStatement();
    }

    function getStatement() {
        let i = Math.floor(Math.random() * gameStaments.length + 0);
        const statement = gameStaments[i];
        if (gameStaments.indexOf(gameStaments[i]) > -1) {
            gameStaments.splice(gameStaments.indexOf(gameStaments[i]), 1);
        }
        return statement;
    }

    function checkAnswer(choice) {
        if (gameStaments <= 0) {
            $score += 1;
            gameOver = true;
            gameOverMessage = "You Won!"
            return;
        }
        if (
            (choice === "Higher" && previousNumber < statement.number) ||
            (choice === "Lower" && previousNumber > statement.number)
        ) {
            previousNumber = statement.number;
            $score += 1;
            statement = getStatement();
            return;
        } else {
            gameOver = true;
            gameOverMessage = "Hey, better luck next time."
        }
    }
</script>

<div
        class="flex flex-col justify-center items-center max-w h-full py-24 mx-auto "
>
    {#if gameOver}
        <h1 class="text-gray-900 text-xl font-semibold">Game Over! {gameOverMessage}</h1>
        <h1 class="text-lg font-medium text-yellow-700">You scored: {$score}</h1>
        <div class="px-6 py-4 flex items-center gap-20">
            <button
                    type="button"
                    on:click={() => {
          location.reload()
        }}
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
                Home
            </button>
        </div>
    {:else if gameStatus === "START"}
        <h1 class="text-gray-900 font-bold text-2xl mb-5">
            Choose a statement to start.
        </h1>
        <div
                class="text-yellow-700 py-2 flex items-center text-lg gap-3 font-semibold whitespace-nowrap"
        >
            {firstStatement.statement}
            <button
                    type="button"
                    on:click={() => {
          gameStatus = "ACTIVE";
          previousNumber = firstStatement.number;
        }}
                    class="px-4 py-3 uppercase rounded-sm text-sm font-semibold text-gray-100 bg-yellow-600"
            >Highest
            </button
            >
        </div>

        <div
                class="text-yellow-700 py-2 flex items-center text-lg gap-3 font-semibold whitespace-nowrap"
        >
            {secondStatement.statement}
            <span class="ml-3 text-2xl text-gray-800 font-bold"
            >
            <button
                    type="button"
                    on:click={() => {
          gameStatus = "ACTIVE";
          previousNumber = secondStatement.number;
        }}
                    class="px-4 py-3 uppercase rounded-sm text-sm font-semibold text-gray-100 bg-yellow-600"
            >Highest
            </button
            >
        </div>
    {:else if gameStatus === "ACTIVE"}
        <div
                class="text-yellow-700 py-2 flex items-center text-lg gap-3 font-semibold whitespace-nowrap"
        >
            {statement.statement}<br>
            <span class="text-gray-400">(Previous: {previousNumber.toLocaleString('en')})</span>
        </div>
        <div class="px-6 py-4 flex items-center gap-20">
            <button
                    type="button"
                    on:click={() => {
          checkAnswer("Higher");
        }}
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
                <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="-ml-1 mr-2 h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                >
                    <path
                            fill-rule="evenodd"
                            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                            clip-rule="evenodd"
                    />
                </svg>
                Higher
            </button>

            <button
                    type="button"
                    on:click={() => {
          checkAnswer("Lower");
        }}
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
                <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="-ml-1 mr-2 h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                >
                    <path
                            fill-rule="evenodd"
                            d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                    />
                </svg>
                Lower
            </button>
        </div>
    {/if}
</div>
