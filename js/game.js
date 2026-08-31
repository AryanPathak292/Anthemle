const playButton = document.querySelector("button");
const guessButton = document.getElementById("guessButton");
const guessInput = document.getElementById("guessInput");
const message = document.getElementById("message");

const game = {
    currentCountry: null,
    audio: null,
    attempts: 6,
    status: "playing"
};


// Start a new round
function newRound() {

    const randomIndex = Math.floor(Math.random() * countries.length);

    game.currentCountry = countries[randomIndex];

    game.audio = new Audio(game.currentCountry.audio);

    game.attempts = 6;
    game.status = "playing";

    message.textContent = "";
    guessInput.value = "";
}


// Play anthem
playButton.addEventListener("click", function () {
    game.audio.play();
});


// Check guess
guessButton.addEventListener("click", function () {

    const guess = guessInput.value.trim();

    if (guess === "") {
        return;
    }

    // Stop anthem after guess
    game.audio.pause();
    game.audio.currentTime = 0;


    // Correct guess
    if (guess.toLowerCase() === game.currentCountry.name.toLowerCase()) {

    game.status = "won";

    game.audio.pause();
    game.audio.currentTime = 0;

    message.textContent = "🎉 Correct!";

    setTimeout(newRound, 1000);
}
    // Wrong guess
    else {

        game.attempts--;

        if (game.attempts === 0) {

            game.status = "lost";

            message.textContent =
                `💀 Game over! The answer was ${game.currentCountry.name}.`;

            guessButton.disabled = true;
            guessInput.disabled = true;

        }

        else {

            message.textContent =
                `❌ Incorrect! You have ${game.attempts} attempts left.`;

        }
    }

});


// Start the first game
newRound();