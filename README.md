# Anthemle

A daily guessing game where you identify countries from their national anthems.

## Features

* 5 anthems per daily challenge
* 6 attempts per anthem
* Attempt-based scoring (max 500)
* Guess history and duplicate detection
* Audio playback with play/pause
* Case-insensitive guesses and aliases
* Deterministic daily anthem selection
* Progress and streak persistence with `localStorage`
* Responsive UI

## Tech Stack

* HTML
* CSS
* JavaScript
* Browser `localStorage`
* HTML5 Audio

## Project Structure

```text
anthemle/
├── anthemle.html
├── css/
│   └── style.css
├── js/
│   ├── game.js
│   └── countries.js
└── assets/
    └── audio/
```


## Status

Currently under active development. Future versions will introduce backend functionality, database persistence, leaderboards, authentication, and deployment.
