
import { useState, useRef, useEffect } from 'react';
import './style.css';
import countries from './countries';

function App() {
  const [activePage, setActivePage] = useState('game');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('');

  const audioRef = useRef(null);

  const pages = [
    { name: 'Home', id: 'game' },
    { name: 'Countries', id: 'countriesPage' },
    { name: 'Stats', id: 'statsPage' },
    { name: 'Leaderboard', id: 'leaderboardPage' }
  ];

  const handleNavigation = (pageId) => {
    setActivePage(pageId);
    setMenuOpen(false);
  };

  // -----------------------------------
  // Date helpers
  // -----------------------------------

  const getTodayDate = () => {
    const today = new Date();

    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
  };

  // -----------------------------------
  // Daily country selection
  // -----------------------------------

  const getDailyCountries = () => {
    const today = new Date();

    const dateString =
      `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    let seed = 0;

    for (let i = 0; i < dateString.length; i++) {
      seed = (seed * 31 + dateString.charCodeAt(i)) % 100000;
    }

    const shuffledCountries = [...countries];

    for (let i = shuffledCountries.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;

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
  };

  // -----------------------------------
  // Load saved daily progress
  // -----------------------------------

  const [game, setGame] = useState(() => {
    const dailyCountries = getDailyCountries();
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    let savedProgress = null;

    try {
      savedProgress = JSON.parse(
        localStorage.getItem('anthemleDailyProgress') || 'null'
      );
    } catch (error) {
      console.error('Could not read saved progress:', error);
    }

    const isSameDay = savedProgress?.date === today;

    const completedYesterday =
      savedProgress?.date === yesterday &&
      savedProgress?.completed === true;

    const currentAnthem = isSameDay
      ? Math.min(savedProgress?.currentAnthem ?? 0, 5)
      : 0;

    const completedToday =
      isSameDay && savedProgress?.completed === true;

    let streak = 0;

    if (isSameDay) {
      streak = savedProgress?.streak ?? 0;
    } else if (completedYesterday) {
      streak = savedProgress?.streak ?? 0;
    }

    return {
      currentCountry:
        currentAnthem < 5 ? dailyCountries[currentAnthem] : null,
      attempts: 6,
      status: completedToday ? 'completed' : 'playing',
      guesses: [],
      score: isSameDay ? savedProgress?.score ?? 0 : 0,
      streak,
      dailyCountries,
      currentAnthem,
      completedToday,
      inputGuess: ''
    };
  });

  // -----------------------------------
  // Lifetime statistics
  // -----------------------------------

  const [stats, setStats] = useState(() => {
    try {
      const savedStats = JSON.parse(
        localStorage.getItem('anthemleStats') || 'null'
      );

      return {
        totalChallenges: savedStats?.totalChallenges ?? 0,
        totalScore: savedStats?.totalScore ?? 0,
        bestStreak: savedStats?.bestStreak ?? 0,
        lastCompletedDate: savedStats?.lastCompletedDate ?? null
      };
    } catch (error) {
      console.error('Could not read lifetime stats:', error);

      return {
        totalChallenges: 0,
        totalScore: 0,
        bestStreak: 0,
        lastCompletedDate: null
      };
    }
  });

  // -----------------------------------
  // Save daily progress automatically
  // -----------------------------------

  useEffect(() => {
    const progress = {
      date: getTodayDate(),
      currentAnthem: game.currentAnthem,
      score: game.score,
      completed: game.completedToday,
      streak: game.streak
    };

    localStorage.setItem(
      'anthemleDailyProgress',
      JSON.stringify(progress)
    );
  }, [
    game.currentAnthem,
    game.score,
    game.completedToday,
    game.streak
  ]);

  // -----------------------------------
  // Save lifetime statistics
  // -----------------------------------

  useEffect(() => {
    localStorage.setItem(
      'anthemleStats',
      JSON.stringify(stats)
    );
  }, [stats]);

  // Count a completed daily challenge only once.
  useEffect(() => {
    if (!game.completedToday) return;

    const today = getTodayDate();

    if (stats.lastCompletedDate === today) return;

    setStats(prev => ({
      ...prev,
      totalChallenges: prev.totalChallenges + 1,
      totalScore: prev.totalScore + game.score,
      bestStreak: Math.max(prev.bestStreak, game.streak),
      lastCompletedDate: today
    }));
  }, [
    game.completedToday,
    game.score,
    game.streak,
    stats.lastCompletedDate
  ]);

  // -----------------------------------
  // Stop and clean up audio
  // -----------------------------------

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // -----------------------------------
  // Start the first round
  // -----------------------------------

  useEffect(() => {
    if (!game.currentCountry && game.status !== 'completed') {
      newRound();
    }

    // Initialisation only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------
  // Start a new round
  // -----------------------------------

  const newRound = () => {
    if (game.currentAnthem >= 5) {
      setGame(prev => {
        if (prev.completedToday) return prev;

        return {
          ...prev,
          currentCountry: null,
          status: 'completed',
          completedToday: true,
          streak: prev.streak + 1
        };
      });

      setIsPlaying(false);
      return;
    }

    const currentCountry =
      game.dailyCountries[game.currentAnthem];

    if (!currentCountry) {
      console.error('No country found for this round.');
      return;
    }

    console.log('Selected country:', currentCountry);
    console.log('Audio path:', currentCountry.audio);

    // Stop previous audio.
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create the new audio player.
    const audio = new Audio(currentCountry.audio);

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    audio.addEventListener('canplaythrough', () => {
      console.log('Anthem loaded successfully:', currentCountry.name);
    });

    audio.addEventListener('error', () => {
      console.error(
        'Audio loading failed:',
        currentCountry.audio,
        audio.error
      );

      setMessage(
        `Unable to load the anthem for ${currentCountry.name}. Check the console.`
      );

      setIsPlaying(false);
    });

    audioRef.current = audio;

    setGame(prev => ({
      ...prev,
      currentCountry,
      attempts: 6,
      status: 'playing',
      guesses: [],
      inputGuess: ''
    }));

    setMessage('');
    setIsPlaying(false);
  };

  // -----------------------------------
  // Play / pause anthem
  // -----------------------------------

  const handlePlayPause = () => {
    if (game.status !== 'playing' || !audioRef.current) {
      console.warn('Audio is not initialised yet.');
      return;
    }

    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Audio playback failed:', error);

          setMessage(
            'Audio could not be played. Check the console and audio path.'
          );

          setIsPlaying(false);
        });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // -----------------------------------
  // Submit guess
  // -----------------------------------

  const submitGuess = () => {
    if (game.status !== 'playing' || !game.currentCountry) {
      return;
    }

    const guess = game.inputGuess.trim();

    if (!guess) return;

    const alreadyGuessed = game.guesses.some(
      previous =>
        previous.country.toLowerCase() === guess.toLowerCase()
    );

    if (alreadyGuessed) {
      setMessage('⚠️ You already guessed that!');
      return;
    }

    const normalizedGuess = guess.toLowerCase();

    const isCorrect =
      normalizedGuess === game.currentCountry.name.toLowerCase() ||
      (game.currentCountry.aliases || []).some(
        alias => normalizedGuess === alias.toLowerCase()
      );

    const updatedGuesses = [
      ...game.guesses,
      { country: guess, correct: isCorrect }
    ];

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsPlaying(false);

    if (isCorrect) {
      const scoreByAttempt = [100, 80, 60, 40, 20, 10];
      const points = scoreByAttempt[updatedGuesses.length - 1] ?? 0;

      setGame(prev => ({
        ...prev,
        guesses: updatedGuesses,
        score: prev.score + points,
        status: 'won',
        inputGuess: '',
        currentAnthem: prev.currentAnthem + 1
      }));

      setMessage(`🎉 Correct! You earned ${points} points.`);
      return;
    }

    const remainingAttempts = game.attempts - 1;

    setGame(prev => ({
      ...prev,
      guesses: updatedGuesses,
      attempts: remainingAttempts,
      status: remainingAttempts === 0 ? 'lost' : 'playing',
      inputGuess: '',
      currentAnthem:
        remainingAttempts === 0
          ? prev.currentAnthem + 1
          : prev.currentAnthem
    }));

    if (remainingAttempts === 0) {
      setMessage(
        `💀 Round over! The answer was ${game.currentCountry.name}.`
      );
    } else {
      setMessage(
        `❌ Incorrect! ${remainingAttempts} attempts remaining.`
      );
    }
  };

  // -----------------------------------
  // Automatically advance after a round
  // -----------------------------------

  useEffect(() => {
    if (game.status !== 'won' && game.status !== 'lost') {
      return;
    }

    const delay = setTimeout(() => {
      newRound();
    }, game.status === 'won' ? 1000 : 1500);

    return () => clearTimeout(delay);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status, game.currentAnthem]);

  // -----------------------------------
  // Render
  // -----------------------------------

  const averageScore =
    stats.totalChallenges > 0
      ? Math.round(stats.totalScore / stats.totalChallenges)
      : 0;

  return (
    <>
      <header>
        <h1>ANTEHMLE</h1>
        <p>Guess the country from its national anthem.</p>

        <nav id="mainNav">
          <button
            id="menuToggle"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            ☰
          </button>

          <div id="navLinks" className={menuOpen ? 'show' : ''}>
            {pages.map(page => (
              <button
                key={page.id}
                className={activePage === page.id ? 'active' : ''}
                onClick={() => handleNavigation(page.id)}
              >
                {page.name}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main>
        {/* Game */}
        <section
          id="game"
          style={{ display: activePage === 'game' ? 'block' : 'none' }}
        >
          <h2>Today's Anthem</h2>

          <div id="roundStatus">
            <p>
              {game.status === 'completed'
                ? '🏆 Daily Challenge Complete!'
                : game.currentCountry
                  ? `🎵 Anthem ${game.currentAnthem + 1} / 5`
                  : 'Loading anthem...'}
            </p>
          </div>

          <div id="anthemControls">
            <button
              id="playButton"
              onClick={handlePlayPause}
              disabled={!game.currentCountry || game.status !== 'playing'}
            >
              {isPlaying ? '⏸ Pause Anthem' : '▶ Play Anthem'}
            </button>
          </div>

          <div id="guessControls">
            <input
              type="text"
              id="guessInput"
              placeholder="Enter your guess"
              value={game.inputGuess}
              disabled={game.status !== 'playing'}
              onChange={e =>
                setGame(prev => ({
                  ...prev,
                  inputGuess: e.target.value
                }))
              }
              onKeyDown={e => {
                if (e.key === 'Enter') submitGuess();
              }}
            />

            <button
              id="guessButton"
              onClick={submitGuess}
              disabled={game.status !== 'playing'}
            >
              Guess
            </button>
          </div>

          <div id="attempts">
            <p>
              Attempts remaining:{' '}
              <span id="attemptsRemaining">{game.attempts}</span>
            </p>
          </div>

          <div id="score">
            <p>
              Score: <span id="scoreValue">{game.score}</span>
            </p>
          </div>

          <div id="streak">
            <p>
              🔥 Streak: <span id="streakValue">{game.streak}</span>
            </p>
          </div>

          <div id="feedback">
            <p id="message">{message}</p>
          </div>

          <div id="history">
            <h3>Guess History</h3>

            <div id="guessHistory">
              {game.guesses.map((guess, index) => (
                <p key={index}>
                  {guess.correct ? '✅' : '❌'} {guess.country}
                </p>
              ))}
            </div>
          </div>

          <div
            id="dailyResult"
            style={{
              display: game.status === 'completed' ? 'block' : 'none'
            }}
          >
            <h2>🏆 Daily Challenge Complete!</h2>

            <div id="resultScore">
              <p>Your Score</p>
              <strong>{game.score} / 500</strong>
            </div>

            <div id="resultMessage">
              <p>
                {game.score === 500
                  ? '🏆 Perfect Day!'
                  : game.score >= 400
                    ? '🔥 Excellent Run!'
                    : game.score >= 200
                      ? '👍 Good Run!'
                      : '💪 Challenge Complete!'}
              </p>
            </div>

            <p id="resultStreak">
              🔥 Streak: <span id="resultStreakValue">{game.streak}</span>
            </p>

            <p id="resultTomorrow">
              Come back tomorrow for a new challenge.
            </p>
          </div>
        </section>

        {/* Countries */}
        <section
          id="countriesPage"
          style={{
            display: activePage === 'countriesPage' ? 'block' : 'none'
          }}
        >
          <h2>Countries</h2>
          <p>Explore the countries featured in Anthemle.</p>

          <div id="countriesList">
            {countries.map(country => (
              <div className="countryCard" key={country.name}>
                <h3>{country.flag} {country.name}</h3>
                <p>{country.anthem}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section
          id="statsPage"
          style={{ display: activePage === 'statsPage' ? 'block' : 'none' }}
        >
          <h2>Stats</h2>
          <p>Your Anthemle progress.</p>

          <div id="statsList">
            <div className="statCard">
              <h3>🔥 Current Streak</h3>
              <p>{game.streak}</p>
            </div>

            <div className="statCard">
              <h3>🏆 Best Streak</h3>
              <p>{stats.bestStreak}</p>
            </div>

            <div className="statCard">
              <h3>🎯 Challenges Completed</h3>
              <p>{stats.totalChallenges}</p>
            </div>

            <div className="statCard">
              <h3>⭐ Total Score</h3>
              <p>{stats.totalScore}</p>
            </div>

            <div className="statCard">
              <h3>📊 Average Score</h3>
              <p>{averageScore}</p>
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section
          id="leaderboardPage"
          style={{
            display: activePage === 'leaderboardPage' ? 'block' : 'none'
          }}
        >
          <h2>Leaderboard</h2>
          <p>See how you rank against other Anthemle players.</p>

          <div id="leaderboardList">
            <div className="leaderboardHeader">
              <span>Rank</span>
              <span>Player</span>
              <span>Score</span>
              <span>Streak</span>
            </div>

            <div className="leaderboardEmpty">
              <h3>🌍 Global Leaderboard</h3>
              <p>
                Compete with players around the world.
                Online rankings will be available soon.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;
