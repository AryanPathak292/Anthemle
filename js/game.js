const playbutton = document.getElementById("playButton");
const guessButton = document.getElementById("guessButton");
const roundStatus = document.getElementById("roundStatus");
const guessInput = document.getElementById("guessInput");
const message = document.getElementById("message");
const guessHistory = document.getElementById("guessHistory");
const attemptsRemaining = document.getElementById("attemptsRemaining");
const scoreValue = document.getElementById("scoreValue");


const game = {
    currentCountry: null,
    audio: null,
    attempts: 6,
    status: "playing",
    guesses: [],
    score: 0
};


// Render guess history
function renderGuessHistory() {

    guessHistory.innerHTML = "";

    game.guesses.forEach(function (guess, index) {

        const guessElement = document.createElement("div");

        const result = guess.correct ? "✓" : "❌";

        guessElement.textContent =
            `Attempt ${index + 1}: ${guess.country} ${result}`;

        guessElement.classList.add("guess");

        guessHistory.appendChild(guessElement);
    });
}


// Start a new round
function newRound() {

    const randomIndex =
        Math.floor(Math.random() * countries.length);

    game.currentCountry = countries[randomIndex];

    game.audio = new Audio(game.currentCountry.audio);

    game.audio.addEventListener("ended", function () {
        playbutton.textContent = "▶ Play Anthem";
    });


    // Reset round-specific state
    game.attempts = 6;
    attemptsRemaining.textContent = game.attempts;

    game.status = "playing";
    game.guesses = [];


    renderGuessHistory();


    // Reset UI
    message.textContent = "";
    guessInput.value = "";

    guessButton.disabled = false;
    guessInput.disabled = false;
    playbutton.disabled = false;

    playbutton.textContent = "▶ Play Anthem";

    roundStatus.textContent = "🎵 New round!";

    guessInput.focus();
}


// Play / pause anthem
playbutton.addEventListener("click", function () {

    if (game.status !== "playing") {
        return;
    }

    if (game.audio.paused) {

        game.audio.play();

        playbutton.textContent = "⏸ Pause Anthem";

    } else {

        game.audio.pause();

        playbutton.textContent = "▶ Play Anthem";
    }
});


// Submit guess
function submitGuess() {

    if (game.status !== "playing") {
        return;
    }


    const guess = guessInput.value.trim();


    // Ignore empty guesses
    if (guess === "") {
        return;
    }


    // Clear input
    guessInput.value = "";


    // Check duplicate guesses
    if (game.guesses.some(function (previousGuess) {

        return previousGuess.country.toLowerCase() ===
               guess.toLowerCase();

    })) {

        message.textContent = "⚠️ You already guessed that!";

        return;
    }


    // Check answer
   const normalizedGuess = guess.toLowerCase();

const isCorrect =
    normalizedGuess === game.currentCountry.name.toLowerCase() ||
    (game.currentCountry.aliases &&
     game.currentCountry.aliases.some(function (alias) {
         return normalizedGuess === alias.toLowerCase();
     }));
    // Store guess
    game.guesses.push({
        country: guess,
        correct: isCorrect
    });


    // Update history
    renderGuessHistory();


    // Stop anthem after guessing
    game.audio.pause();
    game.audio.currentTime = 0;

    playbutton.textContent = "▶ Play Anthem";


    // -------------------------
    // CORRECT GUESS
    // -------------------------

    if (isCorrect) {

        const scoreByAttempt =
            [100, 80, 60, 40, 20, 10];

        const attemptNumber =
            game.guesses.length;

        game.score +=
            scoreByAttempt[attemptNumber - 1];

        scoreValue.textContent =
            game.score;


        game.status = "won";

        roundStatus.textContent = "🎉 Correct!";

        message.textContent = "You got it!";


        // Disable controls
        guessButton.disabled = true;
        guessInput.disabled = true;
        playbutton.disabled = true;


        // Start next round
        setTimeout(newRound, 1000);
    }


    // -------------------------
    // WRONG GUESS
    // -------------------------

    else {

        game.attempts--;

        attemptsRemaining.textContent =
            game.attempts;


        // Player has no attempts left
        if (game.attempts === 0) {

            game.status = "lost";

            roundStatus.textContent =
                "💀 Round over!";

            message.textContent =
                `The answer was ${game.currentCountry.name}.`;


            // Disable controls
            guessButton.disabled = true;
            guessInput.disabled = true;
            playbutton.disabled = true;


            // Start next round
            setTimeout(newRound, 1500);
        }


        // Player still has attempts
        else {

            roundStatus.textContent =
                "🎵 Keep listening!";

            message.textContent =
                `❌ Incorrect! ${game.attempts} attempts remaining.`;
        }
    }
}


// Guess button
guessButton.addEventListener("click", submitGuess);


// Enter key
guessInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        submitGuess();
    }
});


// Start first game
newRound();