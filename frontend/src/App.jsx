
import { useState, useRef, useEffect } from 'react';
import './style.css';
import countries from './countries';

const getTodayDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const getYesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const getDailyCountries = () => {
  const dateString = getTodayDate();
  let seed = 0;

  for (let i = 0; i < dateString.length; i++) {
    seed = (seed * 31 + dateString.charCodeAt(i)) % 100000;
  }

  const shuffled = [...countries];

  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const index = Math.floor((seed / 233280) * (i + 1));

    [shuffled[i], shuffled[index]] = [shuffled[index], shuffled[i]];
  }

  return shuffled.slice(0, 5);
};

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Could not read ${key}:`, error);
    return fallback;
  }
};

function App() {
  const [activePage, setActivePage] = useState('game');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('');

  const audioRef = useRef(null);
  const transitionTimer = useRef(null);

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

  // Load daily progress before the first render.
  const [game, setGame] = useState(() => {
    const dailyCountries = getDailyCountries();
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    const saved = readStorage('anthemleDailyProgress', null);

    const sameDay = saved?.date === today;
    const completedYesterday =
      saved?.date === yesterday && saved?.completed === true;

    const currentAnthem = sameDay
      ? Math.min(saved.currentAnthem ?? 0, 5)
      : 0;

    const completedToday = sameDay && saved?.completed === true;

    // If the previous round was just won/lost, the currentAnthem
    // already points to the next round.
    const savedStatus = sameDay ? saved?.status : 'playing';

    const currentCountryIndex =
      savedStatus === 'won' || savedStatus === 'lost'
        ? currentAnthem - 1
        : currentAnthem;

    const currentCountry =
      currentCountryIndex >= 0 && currentCountryIndex < 5
        ? dailyCountries[currentCountryIndex]
        : null;

    return {
      currentCountry,
      attempts: sameDay ? saved?.attempts ?? 6 : 6,
      status: completedToday ? 'completed' : savedStatus || 'playing',
      guesses: sameDay && Array.isArray(saved?.guesses)
        ? saved.guesses
        : [],
      roundResults: sameDay && Array.isArray(saved?.roundResults)
        ? saved.roundResults
        : [],
      score: sameDay ? saved?.score ?? 0 : 0,
      streak: sameDay
        ? saved?.streak ?? 0
        : completedYesterday
          ? saved?.streak ?? 0
          : 0,
      dailyCountries,
      currentAnthem,
      completedToday,
      inputGuess: sameDay ? saved?.inputGuess ?? '' : ''
    };
  });

  const [stats, setStats] = useState(() => {
    const saved = readStorage('anthemleStats', {});

    return {
      totalChallenges: saved.totalChallenges ?? 0,
      totalScore: saved.totalScore ?? 0,
      bestStreak: saved.bestStreak ?? 0,
      lastCompletedDate: saved.lastCompletedDate ?? null
    };
  });

  // Save the complete game state whenever it changes.
  useEffect(() => {
    const progress = {
      date: getTodayDate(),
      currentAnthem: game.currentAnthem,
      score: game.score,
      completed: game.completedToday,
      streak: game.streak,
      attempts: game.attempts,
      guesses: game.guesses,
      roundResults: game.roundResults,
      status: game.status,
      inputGuess: game.inputGuess
    };

    try {
      localStorage.setItem(
        'anthemleDailyProgress',
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error('Could not save daily progress:', error);
    }
  }, [game]);

  // Save lifetime statistics.
  useEffect(() => {
    try {
      localStorage.setItem('anthemleStats', JSON.stringify(stats));
    } catch (error) {
      console.error('Could not save lifetime stats:', error);
    }
  }, [stats]);

  // Count a completed challenge exactly once.
  useEffect(() => {
    if (!game.completedToday) return;

    const today = getTodayDate();

    setStats(prev => {
      if (prev.lastCompletedDate === today) {
        return prev;
      }

      return {
        ...prev,
        totalChallenges: prev.totalChallenges + 1,
        totalScore: prev.totalScore + game.score,
        bestStreak: Math.max(prev.bestStreak, game.streak),
        lastCompletedDate: today
      };
    });
  }, [game.completedToday, game.score, game.streak]);

  // Audio cleanup.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    };
  }, []);

  // Initialise audio for the restored round.
  useEffect(() => {
    if (game.status === 'completed') return;

    if (game.status === 'won' || game.status === 'lost') {
      advanceRound();
      return;
    }

    if (game.currentCountry) {
      createAudio(game.currentCountry);
    } else {
      startRound(0);
    }

    // Run only once on initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create audio for a country.
  const createAudio = (country) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(country.audio);

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    audio.addEventListener('error', () => {
      console.error('Audio loading failed:', country.audio);
      setMessage(`Unable to load the anthem for ${country.name}.`);
      setIsPlaying(false);
    });

    audioRef.current = audio;
  };

  // Start a particular round.
  const startRound = (roundIndex) => {
    if (roundIndex >= 5) {
      setGame(prev => ({
        ...prev,
        currentCountry: null,
        status: 'completed',
        completedToday: true,
        streak: prev.completedToday ? prev.streak : prev.streak + 1
      }));

      setIsPlaying(false);
      return;
    }

    const country = game.dailyCountries[roundIndex];

    if (!country) {
      console.error('Country not found for round:', roundIndex);
      return;
    }

    createAudio(country);

    setGame(prev => ({
      ...prev,
      currentCountry: country,
      currentAnthem: roundIndex,
      attempts: 6,
      guesses: [],
      inputGuess: '',
      status: 'playing'
    }));

    setMessage('');
    setIsPlaying(false);
  };

  // Move to the next round.
  const advanceRound = () => {
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
    }

    const nextRound = game.currentAnthem;

    transitionTimer.current = setTimeout(() => {
      startRound(nextRound);
    }, game.status === 'won' ? 1000 : 1500);
  };

  // Play / pause anthem.
  const handlePlayPause = () => {
    if (game.status !== 'playing' || !audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error('Audio playback failed:', error);
          setMessage('Audio could not be played.');
        });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Submit a guess.
  const submitGuess = () => {
    if (game.status !== 'playing' || !game.currentCountry) return;

    const guess = game.inputGuess.trim();
    if (!guess) return;

    const alreadyGuessed = game.guesses.some(
      previous => previous.country.toLowerCase() === guess.toLowerCase()
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
        roundResults: [
          ...prev.roundResults,
          {
            country: prev.currentCountry.name,
            won: true,
            attemptsUsed: updatedGuesses.length,
            points
          }
        ],
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
      roundResults: remainingAttempts === 0
        ? [
            ...prev.roundResults,
            {
              country: prev.currentCountry.name,
              won: false,
              attemptsUsed: updatedGuesses.length,
              points: 0
            }
          ]
        : prev.roundResults,
      attempts: remainingAttempts,
      status: remainingAttempts === 0 ? 'lost' : 'playing',
      inputGuess: '',
      currentAnthem:
        remainingAttempts === 0
          ? prev.currentAnthem + 1
          : prev.currentAnthem
    }));

    if (remainingAttempts === 0) {
      setMessage(`💀 Round over! The answer was ${game.currentCountry.name}.`);
    } else {
      setMessage(`❌ Incorrect! ${remainingAttempts} attempts remaining.`);
    }
  };

  // Automatically advance after a round.
  useEffect(() => {
    if (game.status !== 'won' && game.status !== 'lost') return;

    advanceRound();

    return () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status, game.currentAnthem]);

  const averageScore = stats.totalChallenges > 0
    ? Math.round(stats.totalScore / stats.totalChallenges)
    : 0;
const shareResults = async () => {
  const resultLines = game.roundResults.map(result =>
    `${result.won ? '🟩' : '⬛'} ${result.country} — ${result.points} points`
  );

  const shareText = [
    '🎵 ANTHMLE — Daily Challenge',
    `🏆 Score: ${game.score}/500`,
    '',
    ...resultLines,
    '',
    `🔥 Streak: ${game.streak}`,
    '',
    'Can you beat my score?'
  ].join('\n');

  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Anthemle Daily Challenge',
        text: shareText
      });
    } else {
      await navigator.clipboard.writeText(shareText);
      setMessage('Results copied! Share them with your friends 🎉');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Could not share results:', error);
      setMessage('Unable to share results. Please try again.');
    }
  }
};
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
                  ? `🎵 Anthem ${game.currentAnthem+1 } / 5`
                  : 'Loading anthem...'
                  }
            </p>
          </div>
{game.status !== 'completed' && (
  <>
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
        onChange={e => setGame(prev => ({
          ...prev,
          inputGuess: e.target.value
        }))}
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
  </>
)}

          

          <div id="attempts">
            <p>
              Attempts remaining: <span id="attemptsRemaining">{game.attempts}</span>
            </p>
          </div>

          <div id="score">
            <p>Score: <span id="scoreValue">{game.score}</span></p>
          </div>

          <div id="streak">
            <p>🔥 Streak: <span id="streakValue">{game.streak}</span></p>
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
            style={{ display: game.status === 'completed' ? 'block' : 'none' }}
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

            <div id="roundResults">
              <h3>Today's Results</h3>
              {game.roundResults.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Anthem</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Result</th>
                      <th style={{ textAlign: 'right', padding: '10px' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {game.roundResults.map((result, index) => (
                      <tr key={`${result.country}-${index}`}>
                        <td style={{ padding: '10px' }}>{result.country}</td>
                        <td style={{ padding: '10px' }}>
                          {result.won
                            ? `Correct — attempt ${result.attemptsUsed}`
                            : 'Not guessed'}
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px' }}>
                          {result.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Round-by-round results are not available for this saved challenge.</p>
              )}
            </div>

            <p id="resultStreak">
              🔥 Streak: <span id="resultStreakValue">{game.streak}</span>
            </p>

            <p id="resultTomorrow">Come back tomorrow for a new challenge.</p>
            <button id="shareButton" onClick={shareResults}>
  📋 Share Results
</button>
          </div>
        </section>

        {/* Countries */}
        <section
          id="countriesPage"
          style={{ display: activePage === 'countriesPage' ? 'block' : 'none' }}
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
          style={{ display: activePage === 'leaderboardPage' ? 'block' : 'none' }}
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
