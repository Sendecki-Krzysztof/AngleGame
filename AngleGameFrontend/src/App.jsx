import React, { useState, useEffect } from 'react';
import AngleCanvas from './components/AngleCanvas';

function App() {
  const [targetAngle, setTargetAngle] = useState(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [guessHistory, setGuessHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameDate, setGameDate] = useState('');

  const MAX_ATTEMPTS = 4;

  useEffect(() => {
    // 1. Calculate local calendar string first
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    setGameDate(todayStr);

    // 2. Append the local date parameter to your API request URL
    fetch(`http://localhost:7071/api/GetDailyAngle?date=${todayStr}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to retrieve daily puzzle state.');
        return res.json();
      })
      .then((data) => {
        console.log("Database Payload Received:", data);
        console.log("Game Date Set To:", todayStr);

        const incomingAngle = data.TargetAngle !== undefined ? data.TargetAngle : data.targetAngle;

        if (incomingAngle !== undefined) {
          setTargetAngle(parseInt(incomingAngle, 10));
        } else {
          console.error("Target angle field missing from DB payload entity.", data);
          setTargetAngle(0);
        }

        // Restored History Matrix State using production cache keys
        const savedState = localStorage.getItem(`angle_pipeline_state_${todayStr}`);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setGuessHistory(parsed.history);
          setGameOver(parsed.gameOver);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    const guessNum = parseInt(currentGuess, 10);

    if (isNaN(guessNum) || guessNum < 1 || guessNum > 359) return;

    const alreadyGuessed = guessHistory.some(attempt => attempt.value === guessNum);
    if (alreadyGuessed) {
      setCurrentGuess('');
      return;
    }

    const diff = Math.abs(targetAngle - guessNum);
    let status = 'Cold';
    let indicatorEmoji = '⬛';

    if (diff === 0) {
      status = 'Perfect!';
      indicatorEmoji = '🟩';
    } else if (diff <= 3) {
      status = 'Boiling! 🔥';
      indicatorEmoji = '🟥';
    } else if (diff <= 10) {
      status = 'Hot!';
      indicatorEmoji = '🟧';
    } else if (diff <= 25) {
      status = 'Warm';
      indicatorEmoji = '🟨';
    }

    const direction = guessNum < targetAngle ? '⬆️' : '⬇️';
    const newHistory = [...guessHistory, { value: guessNum, direction, status, emoji: indicatorEmoji }];
    const isWon = diff === 0;

    setGuessHistory(newHistory);
    setCurrentGuess('');
    setGameOver(isWon);

    localStorage.setItem(`angle_pipeline_state_${gameDate}`, JSON.stringify({
      history: newHistory,
      gameOver: isWon
    }));
  };

  const shareResults = () => {
    const totalTurns = guessHistory.length;
    const cleanDate = gameDate.replace(/-/g, '/');

    let textBlock = `Angle Pipeline Challenge ${cleanDate} - ${totalTurns} Turns\n`;
    guessHistory.forEach(turn => {
      textBlock += `${turn.emoji} ${turn.value}° ${turn.direction}\n`;
    });
    textBlock += `Sent via AngleCloudPipeline App`;

    navigator.clipboard.writeText(textBlock);
    alert('🎯 Stats copied to clipboard!');
  };

  const resetDevGame = () => {
    if (gameDate) {
      localStorage.removeItem(`angle_pipeline_state_${gameDate}`);
      setGuessHistory([]);
      setGameOver(false);
      setCurrentGuess('');
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-sm font-medium tracking-wide text-slate-400">
      Loading daily parameters...
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-sm font-medium text-rose-400">
      ❌ API Connection Error: {error}
    </div>
  );

  const canvasOnionSkinGuesses = guessHistory.slice(-4);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-slate-950 px-4 py-12 text-slate-200 font-sans antialiased">
      <div className="flex flex-col items-center w-full max-w-md flex-1 justify-center">

        <header className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center space-x-2 text-2xl font-bold tracking-wider text-white">
            <span className="text-xl bg-slate-900 border border-slate-800 p-2 rounded-xl shadow-md">📐</span>
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">ANGLE PIPELINE</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-2 font-semibold">Serverless Vector System</p>
        </header>

        <main className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
          <div className="w-full bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner flex items-center justify-center overflow-hidden relative">
            <AngleCanvas targetAngle={targetAngle} guessHistory={canvasOnionSkinGuesses} />
          </div>

          <div className="w-full mt-6 min-h-[72px] flex flex-col items-center justify-center">
            {!gameOver ? (
              <form onSubmit={handleGuessSubmit} className="flex items-center space-x-2 w-full max-w-xs">
                <div className="relative flex-1">
                  <input
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength="3"
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value)}
                    placeholder="Enter degrees (1-359)"
                    className="w-full text-center py-2.5 px-4 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-base font-mono text-white transition-colors placeholder:text-slate-600 shadow-inner"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-sm pointer-events-none">°</span>
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium py-2.5 px-5 rounded-xl shadow-md shadow-orange-500/10 transition active:scale-95 text-sm"
                >
                  Guess
                </button>
              </form>
            ) : (
              <div className="text-center space-y-3 w-full animate-fade-in">
                <p className="text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2 px-4 rounded-xl inline-block">
                  🎉 Completed in {guessHistory.length} attempts!
                </p>
                <button
                  onClick={shareResults}
                  className="w-full max-w-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-6 rounded-xl border border-slate-700 shadow-sm transition active:scale-95 text-sm flex items-center justify-center space-x-2 mx-auto"
                >
                  <span>🔗 Share Score Matrix</span>
                </button>
              </div>
            )}
          </div>

          {guessHistory.length > 0 && (
            <div className="w-full mt-6 border-t border-slate-800/80 pt-5 flex flex-col">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
                <span>Attempt Log</span>
                <span>Count: {guessHistory.length}</span>
              </div>

              <div className="w-full max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {guessHistory.map((attempt, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 items-center text-center bg-slate-950/40 border border-slate-800/60 py-2 px-4 rounded-xl text-xs font-medium text-slate-300"
                  >
                    <span className="font-mono text-left text-slate-400 flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-600 font-sans">#{index + 1}</span>
                      <span className="text-slate-200 font-bold">{attempt.value}°</span>
                    </span>
                    <span className="text-sm font-bold text-blue-400 flex justify-center">{attempt.direction}</span>
                    <span className="text-right text-[11px] text-slate-400 font-medium">{attempt.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <div className="mt-4 opacity-10 hover:opacity-40 transition duration-300">
          <button onClick={resetDevGame} className="text-[10px] font-mono tracking-wider uppercase text-slate-500 hover:underline">
            [Dev Reset Cache]
          </button>
        </div>
      </div>

      <footer className="mt-8 text-[11px] font-medium tracking-wide text-slate-600">
        <p>&copy; {new Date().getFullYear()} Angle Pipeline Platform</p>
      </footer>
    </div>
  );
}

export default App;