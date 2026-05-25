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

  useEffect(() => {
    fetch('http://localhost:7071/api/GetDailyAngle')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to retrieve daily puzzle state.');
        return res.json();
      })
      .then((data) => {
        setTargetAngle(data.targetAngle);

        const todayStr = new Date().toISOString().split('T')[0];
        setGameDate(todayStr);

        const savedState = localStorage.getItem(`angle_wtf_${todayStr}`);
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
    const guessNum = parseInt(currentGuess);

    if (isNaN(guessNum) || guessNum < 1 || guessNum > 359) return;

    const alreadyGuessed = guessHistory.some(attempt => attempt.value === guessNum);
    if (alreadyGuessed) {
      alert(`You already guessed ${guessNum}°! Try a different vector trajectory.`);
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
      status = 'Boiling!🔥';
      indicatorEmoji = '🟥';
    } else if (diff <= 10) {
      status = 'Hot!';
      indicatorEmoji = '🟧';
    } else if (diff <= 25) {
      status = 'Getting Hot';
      indicatorEmoji = '🟨';
    }

    const direction = guessNum < targetAngle ? '⬆️' : '⬇️';
    const newHistory = [...guessHistory, { value: guessNum, direction, status, emoji: indicatorEmoji }];

    // The match only finishes now when they hit the 100% accurate zone!
    const isWon = diff === 0;

    setGuessHistory(newHistory);
    setCurrentGuess('');
    setGameOver(isWon);

    localStorage.setItem(`angle_wtf_${gameDate}`, JSON.stringify({
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
    alert('🎯 Performance metrics copied! Ready to paste into Discord.');
  };

  const resetDevGame = () => {
    if (gameDate) {
      localStorage.removeItem(`angle_wtf_${gameDate}`);
      setGuessHistory([]);
      setGameOver(false);
      setCurrentGuess('');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Loading daily geometric parameters...</div>;
  if (error) return <div className="flex h-screen items-center justify-center text-rose-500">❌ API Connection Error: {error}</div>;

  // 💡 CHRONOLOGICAL CLIPPING STEP: 
  // We grab only the final 4 elements from our history array to pass down to the canvas
  const canvasOnionSkinGuesses = guessHistory.slice(-4);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-white px-4 py-8 text-slate-800 font-sans selection:bg-orange-100">

      <div className="flex flex-col items-center w-full max-w-md">
        <header className="flex flex-col items-center mb-4">
          <div className="flex items-center space-x-2 text-4xl font-light tracking-wide text-orange-600">
            <span className="text-3xl">📐</span>
            <span className="font-semibold tracking-normal">ANGLE</span>
          </div>
        </header>

        {/* Pass the explicitly sliced 4-item array down to our graphic component */}
        <AngleCanvas targetAngle={targetAngle} guessHistory={canvasOnionSkinGuesses} />

        {!gameOver ? (
          <form onSubmit={handleGuessSubmit} className="flex items-center space-x-2 mt-6">
            <input
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength="3"
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              className="w-28 text-center py-2 px-3 text-lg border-2 border-slate-400 rounded-lg focus:outline-none focus:border-orange-500 font-mono"
              autoFocus
            />
            <button
              type="submit"
              className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-medium py-2 px-4 rounded-lg border border-slate-400 shadow-sm transition"
            >
              Guess!
            </button>
          </form>
        ) : (
          <div className="mt-6 text-center space-y-3 flex flex-col items-center">
            <p className="text-xl font-semibold text-emerald-600">
              🎉 Congratulations! You nailed it in {guessHistory.length} attempts!
            </p>
            <button
              onClick={shareResults}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-6 rounded-xl shadow-md transition transform active:scale-95"
            >
              🔗 Share Score Matrix
            </button>
          </div>
        )}

        {/* Scalable Scrolling Guess Table */}
        <div className="w-full max-w-xs mt-6 flex flex-col items-center">
          <span className="text-xs text-slate-500 font-medium mb-2">
            Total Attempts Filed: {guessHistory.length}
          </span>

          {/* Constrained max-height container with an auto overflow scroll behavior */}
          <div className="w-full max-h-48 overflow-y-auto space-y-1 bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
            {guessHistory.map((attempt, index) => (
              <div
                key={index}
                className="grid grid-cols-3 items-center text-center bg-white border border-slate-200 py-1.5 px-3 rounded-lg shadow-sm text-sm font-medium"
              >
                <span className="font-mono text-slate-700">{attempt.value}°</span>
                <span className="text-base text-blue-500 font-bold">{attempt.direction}</span>
                <span className="text-slate-600 text-xs tracking-tight">{attempt.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 opacity-30 hover:opacity-100 transition">
          <button onClick={resetDevGame} className="text-xs font-mono bg-slate-200 px-2 py-1 rounded">
            ⚙️ Clear Storage Reset
          </button>
        </div>
      </div>

      <footer className="mt-8 text-xs text-slate-400">
        <p>Privacy Policy - Terms</p>
      </footer>
    </div>
  );
}

export default App;