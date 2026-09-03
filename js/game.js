const playbutton=document.getElementById("playButton");
const guessButton = document.getElementById("guessButton");
const roundStatus = document.getElementById("roundStatus");
const guessInput = document.getElementById("guessInput");
const message = document.getElementById("message");
const guessHistory = document.getElementById("guessHistory");
const attemptsRemaining = document.getElementById("attemptsRemaining");
const game = {
    currentCountry: null,
    audio: null,
    attempts: 6,
    status: "playing",

    guesses: []
};
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

    const randomIndex = Math.floor(Math.random() * countries.length);

    game.currentCountry = countries[randomIndex];
    game.audio = new Audio(game.currentCountry.audio);

    game.attempts = 6;
    attemptsRemaining.textContent = game.attempts;

    game.status = "playing";
    game.guesses = [];

    renderGuessHistory();

    message.textContent = "";
    guessInput.value = "";

    guessButton.disabled = false;
    guessInput.disabled = false;

    roundStatus.textContent = "🎵 New round!";
}

// Play anthem
playbutton.addEventListener("click", function () {

    if (game.status !== "playing") {
        return;
    }

    game.audio.play();
});
// Play anthem
function submitGuess() {

    if (game.status !== "playing") {
        return;
    }

    const guess = guessInput.value.trim();

    if (guess === "") {
        return;
    }
    guessInput.value = "";
    if (game.guesses.some(function (previousGuess) {
        return previousGuess.country.toLowerCase() === guess.toLowerCase();
    })) {
        message.textContent = "⚠️ You already guessed that!";
        return;
    }

    const isCorrect =
        guess.toLowerCase() === game.currentCountry.name.toLowerCase();

    game.guesses.push({
        country: guess,
        correct: isCorrect
    });

    renderGuessHistory();

    game.audio.pause();
    game.audio.currentTime = 0;

    if (isCorrect) {

        game.status = "won";

        roundStatus.textContent = "🎉 Correct!";
        message.textContent = "You got it!";
        guessButton.disabled = true;
        guessInput.disabled = true;

        setTimeout(newRound, 1000);
    }

    else {

        game.attempts--;
        attemptsRemaining.textContent = game.attempts;

        if (game.attempts === 0) {

            game.status = "lost";

            roundStatus.textContent = "💀 Round over!";

            message.textContent =
                `The answer was ${game.currentCountry.name}.`;

            guessButton.disabled = true;
            guessInput.disabled = true;

            setTimeout(newRound, 1500);
        }

        else {

            roundStatus.textContent =
                `❌ Incorrect — ${game.attempts} attempts remaining`;

            message.textContent = "Try again!";
        }
    }
}
// Guess button + Enter key
guessButton.addEventListener("click", submitGuess);

guessInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        submitGuess();
    }
});
// Start the first game
newRound();