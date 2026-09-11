const playbutton = document.getElementById("playButton");
const guessButton = document.getElementById("guessButton");
const roundStatus = document.getElementById("roundStatus");
const guessInput = document.getElementById("guessInput");
const message = document.getElementById("message");
const guessHistory = document.getElementById("guessHistory");
const attemptsRemaining = document.getElementById("attemptsRemaining");
const scoreValue = document.getElementById("scoreValue");
const streakValue = document.getElementById("streakValue");
const dailyResult = document.getElementById("dailyResult");
const resultScore = document.querySelector("#resultScore strong");
const resultMessage = document.querySelector("#resultMessage p");
const resultStreakValue = document.getElementById("resultStreakValue");
const game = {
    currentCountry: null,
    audio: null,
    attempts: 6,
    status: "playing",
    guesses: [],
    score: 0,
    streak: 0,
    dailyCountries: [],
    currentAnthem: 0,
    completedToday: false
};


// -----------------------------------
// Generate today's 5 countries
// -----------------------------------
function getDailyCountries() {

    const today = new Date();

    const dateString =
        `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    let seed = 0;

    for (let i = 0; i < dateString.length; i++) {
        seed =
            (seed * 31 + dateString.charCodeAt(i)) % 100000;
    }

    const shuffledCountries = [...countries];

    for (let i = shuffledCountries.length - 1; i > 0; i--) {

        seed =
            (seed * 9301 + 49297) % 233280;

        const randomIndex =
            Math.floor((seed / 233280) * (i + 1));

        [
            shuffledCountries[i],
            shuffledCountries[randomIndex]
        ] = [
            shuffledCountries[randomIndex],
            shuffledCountries[i]
        ];
    }

    return shuffledCountries.slice(0, 5);
}
function saveDailyProgress() {

    const progress = {
        date: new Date().toDateString(),
        currentAnthem: game.currentAnthem,
        score: game.score,
        completed: game.status === "completed",
        streak: game.streak
    };

    localStorage.setItem(
        "anthemleDailyProgress",
        JSON.stringify(progress)
    );
}
function loadDailyProgress() {

    const savedData =
        localStorage.getItem("anthemleDailyProgress");

    if (savedData === null) {
        return;
    }

    const progress =
        JSON.parse(savedData);

    const today =
        new Date().toDateString();

    // Same day → resume progress
    if (progress.date === today) {

        game.currentAnthem =
            progress.currentAnthem;

        game.score =
            progress.score;

        game.streak =
            progress.streak || 0;

        game.completedToday =
            progress.completed;

        scoreValue.textContent =
            game.score;

        streakValue.textContent =
            game.streak;

        // Challenge already completed → restore result screen
        if (game.completedToday) {

            game.status = "completed";

            dailyResult.style.display = "block";

            document
                .getElementById("game")
                .classList.add("completed");

            resultScore.textContent =
                `${game.score} / 500`;

            resultStreakValue.textContent =
                game.streak;

            if (game.score === 500) {

                resultMessage.textContent =
                    "🏆 Perfect Day!";

            } else if (game.score >= 400) {

                resultMessage.textContent =
                    "🔥 Excellent Run!";

            } else if (game.score >= 200) {

                resultMessage.textContent =
                    "👍 Good Run!";

            } else {

                resultMessage.textContent =
                    "💪 Challenge Complete!";
            }

            roundStatus.textContent =
                "🏆 Daily Challenge Complete!";

            return;
        }

        return;
    }

    // New day → start fresh
    game.currentAnthem = 0;
    game.score = 0;
    game.completedToday = false;

    // Check if yesterday's challenge was completed
    const yesterday = new Date();

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    if (
        progress.completed &&
        progress.date === yesterday.toDateString()
    ) {

        game.streak =
            progress.streak;

    } else {

        game.streak = 0;
    }

    scoreValue.textContent =
        game.score;

    streakValue.textContent =
        game.streak;
}


// -----------------------------------
// Start a new anthem
// -----------------------------------
function newRound() {

    if (game.dailyCountries.length === 0) {
        game.dailyCountries = getDailyCountries();
    }


    // Check if all 5 anthems are completed
   game.status = "completed";

if (!game.completedToday) {
    game.streak++;
    streakValue.textContent = game.streak;
    game.completedToday = true;
}

saveDailyProgress();

// Hide the normal game UI
playbutton.disabled = true;
guessButton.disabled = true;
guessInput.disabled = true;

// Show the result screen
dailyResult.style.display = "block";
document.getElementById("game").classList.add("completed");
// Fill result data
resultScore.textContent =
    `${game.score} / 500`;

resultStreakValue.textContent =
    game.streak;

// Performance message
if (game.score === 500) {

    resultMessage.textContent =
        "🏆 Perfect Day!";

} else if (game.score >= 400) {

    resultMessage.textContent =
        "🔥 Excellent Run!";

} else if (game.score >= 200) {

    resultMessage.textContent =
        "👍 Good Run!";

} else {

    resultMessage.textContent =
        "💪 Challenge Complete!";
}

roundStatus.textContent =
    "🏆 Daily Challenge Complete!";

message.textContent = "";

return;




    // Select today's current anthem
    game.currentCountry =
        game.dailyCountries[game.currentAnthem];


    game.audio =
        new Audio(game.currentCountry.audio);


    game.audio.addEventListener("ended", function () {

        playbutton.textContent =
            "▶ Play Anthem";
    });


    // Reset round-specific state
    game.attempts = 6;

    attemptsRemaining.textContent =
        game.attempts;

    game.status = "playing";

    game.guesses = [];

    renderGuessHistory();


    // Reset UI
    message.textContent = "";

    guessInput.value = "";

    guessButton.disabled = false;
    guessInput.disabled = false;
    playbutton.disabled = false;

    playbutton.textContent =
        "▶ Play Anthem";

    roundStatus.textContent =
        `🎵 Anthem ${game.currentAnthem + 1} / 5`;

    guessInput.focus();
}


// -----------------------------------
// Play / pause anthem
// -----------------------------------

playbutton.addEventListener("click", function () {

    if (game.status !== "playing") {
        return;
    }


    if (game.audio.paused) {

        game.audio.play();

        playbutton.textContent =
            "⏸ Pause Anthem";

    } else {

        game.audio.pause();

        playbutton.textContent =
            "▶ Play Anthem";
    }
});


// -----------------------------------
// Submit guess
// -----------------------------------

function submitGuess() {

    if (game.status !== "playing") {
        return;
    }


    const guess =
        guessInput.value.trim();


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

        message.textContent =
            "⚠️ You already guessed that!";

        return;
    }


    // Check answer
    const normalizedGuess =
        guess.toLowerCase();


    const isCorrect =
        normalizedGuess ===
        game.currentCountry.name.toLowerCase() ||

        (game.currentCountry.aliases &&

        game.currentCountry.aliases.some(function (alias) {

            return normalizedGuess ===
                   alias.toLowerCase();
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

    playbutton.textContent =
        "▶ Play Anthem";


    // -----------------------------------
    // CORRECT GUESS
    // -----------------------------------

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


        roundStatus.textContent =
            "🎉 Correct!";


        message.textContent =
            "You got it!";


        // Disable controls temporarily
        guessButton.disabled = true;
        guessInput.disabled = true;
        playbutton.disabled = true;


        // Move to next anthem
        game.currentAnthem++;
        saveDailyProgress();

        setTimeout(newRound, 1000);
    }


    // -----------------------------------
    // WRONG GUESS
    // -----------------------------------

    else {

        game.attempts--;

        attemptsRemaining.textContent =
            game.attempts;


        // No attempts left
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


            // Move to next anthem
            game.currentAnthem++;


            setTimeout(newRound, 1500);
        }


        // Attempts remaining
        else {

            roundStatus.textContent =
                `🎵 Anthem ${game.currentAnthem + 1} / 5`;

            message.textContent =
                `❌ Incorrect! ${game.attempts} attempts remaining.`;
        }
    }
}


// -----------------------------------
// Guess button
// -----------------------------------

guessButton.addEventListener(
    "click",
    submitGuess
);


// -----------------------------------
// Enter key
// -----------------------------------

guessInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {
            submitGuess();
        }
    }
);


// -----------------------------------
// Start today's challenge
// -----------------------------------

game.dailyCountries =
    getDailyCountries();
loadDailyProgress();

newRound();