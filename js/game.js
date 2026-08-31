const playButton = document.querySelector("button");

const india = countries[0];

const audio = new Audio(india.audio);

playButton.addEventListener("click", function () {
    audio.play();
});