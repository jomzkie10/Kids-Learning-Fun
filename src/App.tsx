import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Star, Trophy, Volume2, VolumeX, Gift, Calendar, BarChart3, CheckCircle, Medal, X, Info } from 'lucide-react';

// --- Audio Utility ---
let audioCtx: AudioContext | null = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// --- BGM Utility ---
let bgmInterval: any = null;
let isBgmPlaying = false;
const melody = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C4, E4, G4, C5, G4, E4
let noteIndex = 0;

function setBgm(play: boolean) {
  if (play === isBgmPlaying) return;
  initAudio();
  if (!audioCtx) return;
  
  if (play) {
    isBgmPlaying = true;
    bgmInterval = setInterval(() => {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = melody[noteIndex];
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
      
      noteIndex = (noteIndex + 1) % melody.length;
    }, 400);
  } else {
    isBgmPlaying = false;
    clearInterval(bgmInterval);
  }
}

function playSound(type: 'correct' | 'wrong' | 'win') {
  initAudio();
  if (!audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'correct') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'wrong') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } else if (type === 'win') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2);
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }
}

// --- Confetti Component ---
const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex justify-center">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-sm animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
            backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)],
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

// --- Level Complete Component ---
const LevelComplete = ({ show }: { show: boolean }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0, rotate: 10 }}
          className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
        >
          <div className="bg-yellow-400 text-white px-8 py-6 rounded-3xl shadow-2xl border-4 border-yellow-200 flex flex-col items-center gap-2">
            <Star className="w-16 h-16 fill-white animate-[spin_3s_linear_infinite]" />
            <h2 className="text-4xl font-black uppercase tracking-wider">Awesome!</h2>
            <p className="text-xl font-bold opacity-90">+1 Star</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Game State Hook ---
function useGameState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(`kids-game-state-${key}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialValue;
  });

  useEffect(() => {
    localStorage.setItem(`kids-game-state-${key}`, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

const GAME_RULES: Record<string, { title: string, rules: string[] }> = {
  math: {
    title: 'Math Dice',
    rules: [
      'Look at the numbers on the dice.',
      'Add or subtract them depending on the sign (+ or -).',
      'Tap the correct answer from the options below!',
      'As you level up, the numbers get bigger and subtraction is introduced.'
    ]
  },
  puzzle: {
    title: 'Puzzle Race',
    rules: [
      'Tap a puzzle piece at the bottom to select it.',
      'Then tap the matching number slot on the board to place it.',
      'Place all pieces before the timer runs out!',
      'As you level up, you have less time to complete the puzzle.'
    ]
  },
  alphabet: {
    title: 'Alphabet Match',
    rules: [
      'Look at the letters on the left and the pictures on the right.',
      'Tap a letter, then tap the picture that starts with that letter.',
      'Match all the pairs to win!',
      'As you level up, you will see lowercase letters and more pairs.'
    ]
  },
  memory: {
    title: 'Memory Match',
    rules: [
      'Tap a card to flip it over and see the picture.',
      'Try to remember where the pictures are.',
      'Find and tap two matching pictures to clear them.',
      'Clear all the cards to win!',
      'As you level up, there will be more cards to match.'
    ]
  },
  counting: {
    title: 'Counting Game',
    rules: [
      'Count how many items you see on the screen.',
      'Tap the correct number from the options below!',
      'As you level up, there will be more items to count.'
    ]
  },
  colors: {
    title: 'Color Catch',
    rules: [
      'Read the name of the color at the top.',
      'Tap the circle that matches that color!',
      'As you level up, the colors will move around to trick you!'
    ]
  },
  shapes: {
    title: 'Shape Sorter',
    rules: [
      'Read the name of the shape (and color) at the top.',
      'Tap the shape that matches!',
      'As you level up, you will need to match both the shape and the color, and the shapes will move around!'
    ]
  },
  words: {
    title: 'Word Builder',
    rules: [
      'Look at the picture and the empty boxes.',
      'Tap the letters in the correct order to spell the word!',
      'As you level up, the words will get longer and there will be extra letters to trick you.'
    ]
  }
};

// --- Main App Component ---
export default function App() {
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('kids-learning-scores');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load scores', e);
    }
    return {
      math: 0,
      puzzle: 0,
      alphabet: 0,
      memory: 0,
      counting: 0,
      colors: 0,
      shapes: 0,
      words: 0
    };
  });

  const [dailyCompletedDate, setDailyCompletedDate] = useState<string | null>(() => {
    try {
      return localStorage.getItem('kids-learning-daily-completed');
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (dailyCompletedDate) {
      localStorage.setItem('kids-learning-daily-completed', dailyCompletedDate);
    }
  }, [dailyCompletedDate]);

  useEffect(() => {
    localStorage.setItem('kids-learning-scores', JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    setBgm(musicEnabled);
    return () => setBgm(false);
  }, [musicEnabled]);

  const CURRENT_DATE = new Date('2026-03-09T02:22:51-07:00');
  const TODAY_STR = CURRENT_DATE.toDateString();
  const gameIds = ['math', 'puzzle', 'alphabet', 'memory', 'counting', 'colors', 'shapes', 'words'];
  const dailyGameIndex = CURRENT_DATE.getDay() % gameIds.length;
  const dailyGameId = gameIds[dailyGameIndex];

  const handleWin = (gameId: string) => {
    let points = 1;
    if (gameId === dailyGameId) {
      if (dailyCompletedDate !== TODAY_STR) {
        points = 10; // Bonus points for first completion today
        setDailyCompletedDate(TODAY_STR);
      } else {
        points = 2; // Double points for subsequent plays today
      }
    }
    setScores(prev => ({ ...prev, [gameId]: (prev[gameId] || 0) + points }));
  };

  let totalScore = 0;
  for (const key in scores) {
    totalScore += scores[key] || 0;
  }
  const getLevel = (gameId: string) => Math.floor((scores[gameId] || 0) / 5) + 1;

  return (
    <div className="min-h-screen bg-sky-100 font-sans text-slate-800 selection:bg-sky-300 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {currentGame && (
            <button onClick={() => setCurrentGame(null)} className="p-2 bg-sky-100 hover:bg-sky-200 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-sky-600" />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-sky-600 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            Kids Learning Fun
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {currentGame && (
            <button onClick={() => setShowRules(true)} className="p-2 bg-sky-100 hover:bg-sky-200 rounded-full transition-colors flex items-center gap-2 border-2 border-sky-300">
              <Info className="w-5 h-5 text-sky-600" />
              <span className="hidden sm:inline font-bold text-sky-700">How to Play</span>
            </button>
          )}
          <button onClick={() => setShowLeaderboard(true)} className="p-2 bg-sky-100 hover:bg-sky-200 rounded-full transition-colors flex items-center gap-2 border-2 border-sky-300">
            <Medal className="w-5 h-5 text-sky-600" />
            <span className="hidden sm:inline font-bold text-sky-700">Leaderboard</span>
          </button>
          <button onClick={() => setShowDashboard(true)} className="p-2 bg-sky-100 hover:bg-sky-200 rounded-full transition-colors flex items-center gap-2 border-2 border-sky-300">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span className="hidden sm:inline font-bold text-sky-700">Parents</span>
          </button>
          <button onClick={() => setMusicEnabled(!musicEnabled)} className="p-2 bg-sky-100 hover:bg-sky-200 rounded-full transition-colors">
            {musicEnabled ? <Volume2 className="w-5 h-5 text-sky-600" /> : <VolumeX className="w-5 h-5 text-sky-600" />}
          </button>
          <button onClick={() => setShowRewards(true)} className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-full transition-colors flex items-center gap-2 border-2 border-yellow-300">
            <Gift className="w-5 h-5 text-yellow-600" />
            <span className="hidden sm:inline font-bold text-yellow-700">Rewards</span>
          </button>
          <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1 sm:px-4 sm:py-2 rounded-full border-2 border-yellow-300">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-lg sm:text-xl font-bold text-yellow-600">{totalScore}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!currentGame && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-6 mt-4 sm:mt-8"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-6 text-white shadow-lg flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6" /> Daily Challenge</h2>
                  {dailyCompletedDate === TODAY_STR ? (
                    <p className="opacity-90 mt-1 flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-300" /> Completed! You earned your bonus.</p>
                  ) : (
                    <p className="opacity-90 mt-1">Play today's game for +10 bonus points!</p>
                  )}
                </div>
                <button onClick={() => setCurrentGame(dailyGameId)} className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold shadow-md hover:scale-105 transition-transform">
                  {dailyCompletedDate === TODAY_STR ? 'Play Again' : 'Play Now'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GameCard title="Math Dice" color="bg-red-400" border="border-red-600" icon="🎲" score={scores.math || 0} level={getLevel('math')} isDaily={dailyGameId === 'math'} onClick={() => setCurrentGame('math')} />
                <GameCard title="Puzzle Race" color="bg-blue-400" border="border-blue-600" icon="🧩" score={scores.puzzle || 0} level={getLevel('puzzle')} isDaily={dailyGameId === 'puzzle'} onClick={() => setCurrentGame('puzzle')} />
                <GameCard title="Alphabet Match" color="bg-green-400" border="border-green-600" icon="🔤" score={scores.alphabet || 0} level={getLevel('alphabet')} isDaily={dailyGameId === 'alphabet'} onClick={() => setCurrentGame('alphabet')} />
                <GameCard title="Memory Match" color="bg-purple-400" border="border-purple-600" icon="🃏" score={scores.memory || 0} level={getLevel('memory')} isDaily={dailyGameId === 'memory'} onClick={() => setCurrentGame('memory')} />
                <GameCard title="Counting Game" color="bg-orange-400" border="border-orange-600" icon="🔢" score={scores.counting || 0} level={getLevel('counting')} isDaily={dailyGameId === 'counting'} onClick={() => setCurrentGame('counting')} />
                <GameCard title="Color Catch" color="bg-pink-400" border="border-pink-600" icon="🎨" score={scores.colors || 0} level={getLevel('colors')} isDaily={dailyGameId === 'colors'} onClick={() => setCurrentGame('colors')} />
                <GameCard title="Shape Sorter" color="bg-teal-400" border="border-teal-600" icon="🔺" score={scores.shapes || 0} level={getLevel('shapes')} isDaily={dailyGameId === 'shapes'} onClick={() => setCurrentGame('shapes')} />
                <GameCard title="Word Builder" color="bg-indigo-400" border="border-indigo-600" icon="📝" score={scores.words || 0} level={getLevel('words')} isDaily={dailyGameId === 'words'} onClick={() => setCurrentGame('words')} />
              </div>
            </motion.div>
          )}
          {currentGame === 'math' && <MathDice key="math" level={getLevel('math')} onWin={() => handleWin('math')} />}
          {currentGame === 'puzzle' && <PuzzleRace key="puzzle" level={getLevel('puzzle')} onWin={() => handleWin('puzzle')} />}
          {currentGame === 'alphabet' && <AlphabetMatch key="alphabet" level={getLevel('alphabet')} onWin={() => handleWin('alphabet')} />}
          {currentGame === 'memory' && <MemoryMatch key="memory" level={getLevel('memory')} onWin={() => handleWin('memory')} />}
          {currentGame === 'counting' && <CountingGame key="counting" level={getLevel('counting')} onWin={() => handleWin('counting')} />}
          {currentGame === 'colors' && <ColorCatch key="colors" level={getLevel('colors')} onWin={() => handleWin('colors')} />}
          {currentGame === 'shapes' && <ShapeSorter key="shapes" level={getLevel('shapes')} onWin={() => handleWin('shapes')} />}
          {currentGame === 'words' && <WordBuilder key="words" level={getLevel('words')} onWin={() => handleWin('words')} />}
        </AnimatePresence>
      </main>
      {showRewards && <RewardsModal totalScore={totalScore} onClose={() => setShowRewards(false)} />}
      {showDashboard && <ParentDashboard scores={scores} getLevel={getLevel} onClose={() => setShowDashboard(false)} />}
      {showLeaderboard && <LeaderboardModal scores={scores} onClose={() => setShowLeaderboard(false)} />}
      {showRules && currentGame && GAME_RULES[currentGame] && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-sky-600 flex items-center gap-2">
                <Info className="w-8 h-8 text-sky-500" />
                How to Play
              </h2>
              <button onClick={() => setShowRules(false)} className="text-slate-500 hover:text-slate-800 text-3xl font-bold">&times;</button>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">{GAME_RULES[currentGame].title}</h3>
              <ul className="space-y-3">
                {GAME_RULES[currentGame].rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                    <span className="text-lg">{rule}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowRules(false)} className="w-full mt-6 bg-sky-500 text-white px-6 py-3 rounded-full text-xl font-bold shadow-lg border-b-4 border-sky-700 active:border-b-0 active:translate-y-1">
                Got it!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function LeaderboardModal({ scores, onClose }: { scores: Record<string, number>, onClose: () => void }) {
  const [selectedGame, setSelectedGame] = useState<string>('math');
  const gameIds = ['math', 'puzzle', 'alphabet', 'memory', 'counting', 'colors', 'shapes', 'words'];
  const gameNames: Record<string, string> = {
    math: 'Math Dice',
    puzzle: 'Puzzle Race',
    alphabet: 'Alphabet Match',
    memory: 'Memory Cards',
    counting: 'Counting Stars',
    colors: 'Color Catch',
    shapes: 'Shape Sorter',
    words: 'Word Builder',
  };

  const getMockLeaderboard = (gameId: string) => {
    const baseScore = gameId.length * 10;
    return [
      { name: 'Alex', score: baseScore + 45, isUser: false },
      { name: 'Sam', score: baseScore + 30, isUser: false },
      { name: 'Jordan', score: baseScore + 20, isUser: false },
      { name: 'Taylor', score: baseScore + 10, isUser: false },
      { name: 'Casey', score: baseScore + 5, isUser: false },
    ];
  };

  const currentLeaderboard = getMockLeaderboard(selectedGame);
  const userScore = scores[selectedGame] || 0;
  
  const combined = [...currentLeaderboard, { name: 'You', score: userScore, isUser: true }];
  combined.sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-sky-600 flex items-center gap-2">
            <Medal className="w-8 h-8 text-yellow-500" />
            Leaderboards
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {gameIds.map(id => (
            <button
              key={id}
              onClick={() => setSelectedGame(id)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                selectedGame === id ? 'bg-sky-500 text-white' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
              }`}
            >
              {gameNames[id]}
            </button>
          ))}
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-100">
          <h3 className="text-xl font-bold text-slate-700 mb-4 text-center">{gameNames[selectedGame]} Top Scores</h3>
          <div className="space-y-3">
            {combined.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  entry.isUser ? 'bg-yellow-100 border-2 border-yellow-300' : 'bg-white border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-400 text-white' :
                    index === 1 ? 'bg-slate-300 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`font-bold ${entry.isUser ? 'text-yellow-700' : 'text-slate-700'}`}>
                    {entry.name}
                  </span>
                </div>
                <div className="font-bold text-sky-600 text-lg">
                  {entry.score} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GameCard({ title, color, border, icon, score, level, isDaily, onClick }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`${color} text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-4 border-b-8 ${border} active:border-b-0 active:translate-y-2 transition-all relative overflow-hidden`}
    >
      {isDaily && (
        <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-br-xl">
          Daily 2x
        </div>
      )}
      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
        <div className="bg-white/30 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
          <Star className="w-4 h-4" /> {score}
        </div>
        <div className="bg-black/20 px-3 py-1 rounded-full text-xs font-bold">
          Lvl {level}
        </div>
      </div>
      <span className="text-6xl">{icon}</span>
      <h2 className="text-2xl font-bold">{title}</h2>
    </motion.button>
  );
}

// --- Mini Games ---

function MathDice({ onWin, level }: { onWin: () => void, level: number, key?: string }) {
  const [state, setState] = useGameState('math', {
    dice1: 1,
    dice2: 1,
    operation: '+' as '+' | '-',
    options: [] as number[]
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const generateQuestion = () => {
    const maxDice = 6 + (level - 1) * 2;
    let d1 = Math.floor(Math.random() * maxDice) + 1;
    let d2 = Math.floor(Math.random() * maxDice) + 1;
    
    // Introduce subtraction at level 3+
    const isSubtraction = level >= 3 && Math.random() > 0.5;
    
    let op: '+' | '-' = '+';
    if (isSubtraction) {
      // Ensure positive result
      if (d2 > d1) {
        const temp = d1;
        d1 = d2;
        d2 = temp;
      }
      op = '-';
    }

    const answer = isSubtraction ? d1 - d2 : d1 + d2;
    const opts = new Set([answer]);
    
    while(opts.size < 3) {
      let wrong = answer + Math.floor(Math.random() * 5) - 2;
      if (wrong >= 0 && wrong !== answer) opts.add(wrong);
    }
    
    setState({
      dice1: d1,
      dice2: d2,
      operation: op,
      options: Array.from(opts).sort(() => Math.random() - 0.5)
    });
  };

  useEffect(() => {
    if (state.options.length === 0) {
      generateQuestion();
    }
  }, []);

  const handleAnswer = (ans: number) => {
    if (feedback) return;
    setSelectedAnswer(ans);
    const correctAnswer = state.operation === '+' ? state.dice1 + state.dice2 : state.dice1 - state.dice2;
    if (ans === correctAnswer) {
      playSound('correct');
      setFeedback('correct');
      setTimeout(() => {
        setShowConfetti(true);
        onWin();
        setTimeout(() => {
          setShowConfetti(false);
          setFeedback(null);
          setSelectedAnswer(null);
          generateQuestion();
        }, 2000);
      }, 500);
    } else {
      playSound('wrong');
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setSelectedAnswer(null);
      }, 500);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8 mt-4 w-full">
      {showConfetti && <Confetti />}
      <LevelComplete show={showConfetti} />
      <h2 className="text-3xl font-bold text-slate-700">Math Time!</h2>
      <div className="flex items-center gap-2 sm:gap-4 text-4xl sm:text-6xl font-bold text-slate-600">
        <Dice value={state.dice1} />
        <span className="text-slate-400">{state.operation}</span>
        <Dice value={state.dice2} />
        <span className="text-slate-400">=</span>
        <span className="text-slate-400">?</span>
      </div>
      <div className="flex gap-4 mt-8">
        {state.options.map(opt => {
          const isSelected = selectedAnswer === opt;
          const isCorrect = isSelected && feedback === 'correct';
          const isWrong = isSelected && feedback === 'wrong';
          
          return (
            <motion.button
              key={opt}
              onClick={() => handleAnswer(opt)}
              animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : isCorrect ? { scale: [1, 1.2, 1] } : {}}
              className={`text-white text-4xl font-bold w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-lg border-b-8 active:border-b-0 active:translate-y-2 transition-all
                ${isCorrect ? 'bg-green-500 border-green-700' : 
                  isWrong ? 'bg-red-500 border-red-700' : 
                  'bg-red-500 border-red-700 hover:bg-red-400'}`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function Dice({ value }: { value: number }) {
  const dots = Array.from({ length: Math.min(value, 9) }); // Max 9 dots for visual sanity
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl shadow-md border-2 border-slate-200 flex flex-wrap justify-center items-center p-2 gap-1 relative">
        {dots.map((_, i) => (
          <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 bg-slate-800 rounded-full" />
        ))}
        {value > 9 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl text-3xl font-black text-slate-800">
            {value}
          </div>
        )}
      </div>
      <span className="text-xl font-bold text-slate-500">{value}</span>
    </div>
  );
}

function PuzzleRace({ onWin, level }: { onWin: () => void, level: number, key?: string }) {
  const [state, setState] = useGameState('puzzle', {
    pieces: [] as number[],
    placed: {} as { [key: number]: number },
    timeLeft: 30,
    isPlaying: false
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong', id: number } | null>(null);

  useEffect(() => {
    if (state.isPlaying && state.timeLeft > 0) {
      const timer = setTimeout(() => setState(s => ({ ...s, timeLeft: s.timeLeft - 1 })), 1000);
      return () => clearTimeout(timer);
    } else if (state.timeLeft === 0 && state.isPlaying) {
      playSound('wrong');
      setState(s => ({ ...s, isPlaying: false }));
    }
  }, [state.timeLeft, state.isPlaying]);

  const startGame = () => {
    setState({
      pieces: [1, 2, 3, 4].sort(() => Math.random() - 0.5),
      placed: {},
      timeLeft: Math.max(10, 30 - (level - 1) * 5),
      isPlaying: true
    });
    setShowConfetti(false);
    setSelectedPiece(null);
  };

  const handleSlotClick = (slotId: number) => {
    if (selectedPiece !== null && !feedback) {
      if (selectedPiece === slotId) {
        playSound('correct');
        const nextPlaced = { ...state.placed, [slotId]: selectedPiece };
        setState(s => ({ ...s, placed: nextPlaced }));
        setFeedback({ type: 'correct', id: slotId });
        
        setTimeout(() => {
          setFeedback(null);
          if (Object.keys(nextPlaced).length === 4) {
            playSound('win');
            setShowConfetti(true);
            setState(s => ({ ...s, isPlaying: false }));
            onWin();
          }
        }, 500);
        setSelectedPiece(null);
      } else {
        playSound('wrong');
        setFeedback({ type: 'wrong', id: slotId });
        setTimeout(() => setFeedback(null), 500);
        setSelectedPiece(null);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 mt-4 w-full">
      {showConfetti && <Confetti />}
      <LevelComplete show={showConfetti} />
      <div className="flex justify-between w-full max-w-md items-center px-4">
        <h2 className="text-3xl font-bold text-slate-700">Puzzle Race</h2>
        <div className={`text-2xl font-bold ${state.timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
          ⏱️ {state.timeLeft}s
        </div>
      </div>

      {!state.isPlaying && state.timeLeft === 30 && (
        <button onClick={startGame} className="bg-blue-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-lg border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 mt-8">
          Start Race!
        </button>
      )}

      {!state.isPlaying && state.timeLeft === 0 && (
        <div className="text-center mt-8">
          <h3 className="text-3xl font-bold text-red-500 mb-6">Time's up!</h3>
          <button onClick={startGame} className="bg-blue-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-lg border-b-8 border-blue-700 active:border-b-0 active:translate-y-2">
            Try Again
          </button>
        </div>
      )}

      {state.isPlaying && (
        <>
          <div className="grid grid-cols-2 gap-3 bg-slate-200 p-3 rounded-2xl w-64 h-64 sm:w-72 sm:h-72 shadow-inner">
            {[1, 2, 3, 4].map(slot => {
              const isCorrect = feedback?.id === slot && feedback.type === 'correct';
              const isWrong = feedback?.id === slot && feedback.type === 'wrong';
              
              return (
                <motion.div
                  key={slot}
                  onClick={() => handleSlotClick(slot)}
                  animate={isWrong ? { x: [-5, 5, -5, 5, 0] } : isCorrect ? { scale: [1, 1.1, 1] } : {}}
                  className={`border-4 border-dashed rounded-xl flex items-center justify-center transition-colors
                    ${isCorrect ? 'border-green-400 bg-green-50' :
                      isWrong ? 'border-red-400 bg-red-50' :
                      selectedPiece !== null ? 'border-blue-400 bg-blue-50 cursor-pointer' : 'border-slate-300 bg-slate-100'}`}
                >
                  {state.placed[slot] ? (
                    <PuzzlePiece id={slot} />
                  ) : (
                    <span className="text-slate-300 text-5xl font-bold opacity-50">{slot}</span>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="flex gap-3 sm:gap-4 mt-4">
            {state.pieces.map(p => {
              if (state.placed[p]) return <div key={p} className="w-16 h-16 sm:w-20 sm:h-20" />;
              return (
                <div
                  key={p}
                  onClick={() => setSelectedPiece(selectedPiece === p ? null : p)}
                  className={`cursor-pointer transition-all ${selectedPiece === p ? 'scale-110 ring-4 ring-blue-400 rounded-xl shadow-lg' : 'hover:scale-105'}`}
                >
                  <PuzzlePiece id={p} fixedSize />
                </div>
              );
            })}
          </div>
          <p className="text-slate-500 font-medium text-center px-4">Tap a piece below, then tap the matching number slot!</p>
        </>
      )}
    </motion.div>
  );
}

function PuzzlePiece({ id, fixedSize = false }: { id: number, fixedSize?: boolean }) {
  const colors = ['bg-red-400', 'bg-green-400', 'bg-blue-400', 'bg-yellow-400'];
  const shapes = ['⭐', '❤️', '🌙', '☀️'];
  return (
    <div className={`${fixedSize ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-full h-full'} ${colors[id-1]} rounded-xl shadow-md flex items-center justify-center text-4xl sm:text-5xl border-2 border-white/50`}>
      {shapes[id-1]}
    </div>
  );
}

const ALPHABET_PAIRS = [
  { letter: 'A', lower: 'a', pic: '🍎', name: 'Apple' },
  { letter: 'B', lower: 'b', pic: '🐻', name: 'Bear' },
  { letter: 'C', lower: 'c', pic: '🐱', name: 'Cat' },
  { letter: 'D', lower: 'd', pic: '🐶', name: 'Dog' },
  { letter: 'E', lower: 'e', pic: '🐘', name: 'Elephant' },
  { letter: 'F', lower: 'f', pic: '🐸', name: 'Frog' },
  { letter: 'G', lower: 'g', pic: '🦒', name: 'Giraffe' },
  { letter: 'H', lower: 'h', pic: '🚁', name: 'Helicopter' },
  { letter: 'I', lower: 'i', pic: '🍦', name: 'Ice Cream' },
  { letter: 'J', lower: 'j', pic: '🧃', name: 'Juice' },
];

function AlphabetMatch({ onWin, level }: { onWin: () => void, level: number, key?: string }) {
  const [state, setState] = useGameState('alphabet', {
    letters: [] as any[],
    pics: [] as any[],
    matched: [] as string[],
    pairCount: 4
  });
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong', id: string } | null>(null);

  const startRound = () => {
    const currentPairCount = Math.min(6, 3 + Math.floor(level / 2));
    const shuffled = [...ALPHABET_PAIRS].sort(() => Math.random() - 0.5).slice(0, currentPairCount);
    
    // Mix uppercase and lowercase based on level
    const useLowercase = level >= 2;
    
    const letterItems = shuffled.map(item => ({
      ...item,
      displayLetter: (useLowercase && Math.random() > 0.5) ? item.lower : item.letter
    }));

    setState({
      pairCount: currentPairCount,
      letters: [...letterItems].sort(() => Math.random() - 0.5),
      pics: [...letterItems].sort(() => Math.random() - 0.5),
      matched: []
    });
    setSelectedLetter(null);
    setShowConfetti(false);
  };

  useEffect(() => {
    if (state.letters.length === 0) {
      startRound();
    }
  }, []);

  const handlePicClick = (letter: string) => {
    if (!selectedLetter || feedback) return;
    if (selectedLetter === letter) {
      playSound('correct');
      setFeedback({ type: 'correct', id: letter });
      setTimeout(() => {
        const nextMatched = [...state.matched, letter];
        setState(s => ({ ...s, matched: nextMatched }));
        setFeedback(null);
        if (nextMatched.length === state.pairCount) {
          playSound('win');
          setShowConfetti(true);
          onWin();
          setTimeout(startRound, 3000);
        }
        setSelectedLetter(null);
      }, 500);
    } else {
      playSound('wrong');
      setFeedback({ type: 'wrong', id: letter });
      setTimeout(() => {
        setFeedback(null);
        setSelectedLetter(null);
      }, 500);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8 mt-4 w-full">
      {showConfetti && <Confetti />}
      <LevelComplete show={showConfetti} />
      <h2 className="text-3xl font-bold text-slate-700 text-center">Match Letter to Picture!</h2>
      
      <div className="flex justify-between w-full max-w-md gap-4 px-4">
        {/* Letters Column */}
        <div className="flex flex-col gap-4 flex-1">
          {state.letters.map(item => {
            const isMatched = state.matched.includes(item.letter);
            const isSelected = selectedLetter === item.letter;
            return (
              <button
                key={`l-${item.letter}`}
                disabled={isMatched}
                onClick={() => setSelectedLetter(isSelected ? null : item.letter)}
                className={`h-20 rounded-2xl text-4xl font-bold transition-all border-b-4 active:border-b-0 active:translate-y-1
                  ${isMatched ? 'bg-green-200 text-green-600 border-green-300 opacity-50' : 
                    isSelected ? 'bg-yellow-400 text-white border-yellow-600 ring-4 ring-yellow-200' : 
                    'bg-white text-slate-700 border-slate-300 shadow-md hover:bg-slate-50'}`}
              >
                {item.displayLetter}
              </button>
            );
          })}
        </div>

        {/* Pictures Column */}
        <div className="flex flex-col gap-4 flex-1">
          {state.pics.map(item => {
            const isMatched = state.matched.includes(item.letter);
            const isCorrect = feedback?.id === item.letter && feedback.type === 'correct';
            const isWrong = feedback?.id === item.letter && feedback.type === 'wrong';
            
            return (
              <motion.button
                key={`p-${item.letter}`}
                disabled={isMatched}
                onClick={() => handlePicClick(item.letter)}
                animate={isWrong ? { x: [-5, 5, -5, 5, 0] } : isCorrect ? { scale: [1, 1.1, 1] } : {}}
                className={`h-20 rounded-2xl text-5xl transition-all border-b-4 active:border-b-0 active:translate-y-1 flex items-center justify-center
                  ${isMatched || isCorrect ? 'bg-green-200 border-green-300 opacity-50' : 
                    isWrong ? 'bg-red-200 border-red-300' :
                    selectedLetter ? 'bg-white border-slate-300 shadow-md hover:bg-blue-50 ring-2 ring-blue-200 cursor-pointer' : 
                    'bg-white border-slate-300 shadow-md opacity-80 cursor-default'}`}
              >
                {item.pic}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

const MEMORY_EMOJIS = ['🚀', '🌟', '🎈', '🍕', '🎸', '🚗'];

function MemoryMatch({ onWin, level }: { onWin: () => void, level: number, key?: string }) {
  const [state, setState] = useGameState('memory', {
    cards: [] as {id: number, emoji: string, isFlipped: boolean, isMatched: boolean}[],
    flippedIds: [] as number[],
    isPeeking: false
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const startRound = () => {
    const pairCount = Math.min(6, 3 + Math.floor(level / 2));
    const selectedEmojis = [...MEMORY_EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairCount);
    const deck = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({ id: idx, emoji, isFlipped: false, isMatched: false }));
    
    setState({
      cards: deck.map(c => ({ ...c, isFlipped: true })),
      flippedIds: [],
      isPeeking: true
    });
    setShowConfetti(false);
    
    setTimeout(() => {
      setState(s => ({
        ...s,
        cards: s.cards.map(c => ({ ...c, isFlipped: c.isMatched })),
        isPeeking: false
      }));
    }, 2000);
  };

  useEffect(() => {
    if (state.cards.length === 0) {
      startRound();
    } else if (state.isPeeking) {
      setState(s => ({
        ...s,
        cards: s.cards.map(c => ({ ...c, isFlipped: c.isMatched })),
        isPeeking: false
      }));
    }
  }, []);

  const handleCardClick = (id: number) => {
    if (state.isPeeking || state.flippedIds.length === 2) return;
    const card = state.cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlipped = [...state.flippedIds, id];
    const updatedCards = state.cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    
    setState(s => ({ ...s, flippedIds: newFlipped, cards: updatedCards }));

    if (newFlipped.length === 2) {
      const [id1, id2] = newFlipped;
      const c1 = updatedCards.find(c => c.id === id1);
      const c2 = updatedCards.find(c => c.id === id2);

      if (c1?.emoji === c2?.emoji) {
        playSound('correct');
        setFeedback('correct');
        const nextCards = updatedCards.map(c => c.id === id1 || c.id === id2 ? { ...c, isMatched: true } : c);
        setTimeout(() => {
          setState(s => ({ ...s, cards: nextCards, flippedIds: [] }));
          setFeedback(null);
          if (nextCards.every(c => c.isMatched)) {
            playSound('win');
            setShowConfetti(true);
            onWin();
            setTimeout(startRound, 4000);
          }
        }, 500);
      } else {
        playSound('wrong');
        setFeedback('wrong');
        setTimeout(() => {
          setFeedback(null);
          setState(s => ({
            ...s,
            cards: s.cards.map(c => c.id === id1 || c.id === id2 ? { ...c, isFlipped: false } : c),
            flippedIds: []
          }));
        }, 1000);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 mt-4">
      {showConfetti && <Confetti />}
      <LevelComplete show={showConfetti} />
      <h2 className="text-3xl font-bold text-slate-700">Memory Match</h2>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
        {state.cards.map(card => {
          const isJustFlipped = state.flippedIds.includes(card.id);
          const isCorrect = isJustFlipped && feedback === 'correct';
          const isWrong = isJustFlipped && feedback === 'wrong';
          
          return (
            <motion.button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              animate={isWrong ? { x: [-5, 5, -5, 5, 0] } : isCorrect ? { scale: [1, 1.1, 1] } : {}}
              className={`w-20 h-24 sm:w-24 sm:h-32 rounded-xl text-4xl sm:text-5xl flex items-center justify-center shadow-md transition-all duration-300 transform preserve-3d
                ${card.isFlipped || card.isMatched ? 'bg-white rotate-y-180' : 'bg-purple-500 hover:bg-purple-400 border-b-4 border-purple-700 active:border-b-0 active:translate-y-1'}
                ${isCorrect ? 'ring-4 ring-green-400' : isWrong ? 'ring-4 ring-red-400' : ''}`}
              style={{ perspective: '1000px' }}
            >
              <div className={`transition-opacity duration-300 ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}`}>
                {card.emoji}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

const COUNTING_EMOJIS = ['🐸', '🦋', '🍎', '🎈', '🚗', '🐥', '🦖', '🍦'];

function CountingGame({ onWin, level }: { onWin: () => void, level: number, key?: string }) {
  const [state, setState] = useGameState('counting', {
    count: 1,
    emoji: '🐸',
    options: [] as number[]
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const generateQuestion = () => {
    const maxCount = 5 + level * 2;
    const newCount = Math.floor(Math.random() * maxCount) + 1;
    const newEmoji = COUNTING_EMOJIS[Math.floor(Math.random() * COUNTING_EMOJIS.length)];
    
    const opts = new Set([newCount]);
    while(opts.size < 3) {
      let wrong = newCount + Math.floor(Math.random() * 5) - 2;
      if (wrong > 0 && wrong !== newCount && wrong <= maxCount + 5) opts.add(wrong);
    }
    
    setState({
      count: newCount,
      emoji: newEmoji,
      options: Array.from(opts).sort(() => Math.random() - 0.5)
    });
  };

  useEffect(() => {
    if (state.options.length === 0) {
      generateQuestion();
    }
  }, []);

  const handleAnswer = (ans: number) => {
    if (feedback) return;
    setSelectedAnswer(ans);
    if (ans === state.count) {
      playSound('correct');
      setFeedback('correct');
      setTimeout(() => {
        setShowConfetti(true);
        onWin();
        setTimeout(() => {
          setShowConfetti(false);
          setFeedback(null);
          setSelectedAnswer(null);
          generateQuestion();
        }, 2000);
      }, 500);
    } else {
      playSound('wrong');
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setSelectedAnswer(null);
      }, 500);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8 mt-4 w-full">
      {showConfetti && <Confetti />}
      <LevelComplete show={showConfetti} />
      <h2 className="text-3xl font-bold text-slate-700">How many?</h2>
      
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-inner border-4 border-orange-200 min-h-[200px] w-full max-w-lg flex flex-wrap justify-center items-center gap-2 sm:gap-4">
        {Array.from({ length: state.count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: i * 0.05 }}
            className="text-4xl sm:text-5xl"
          >
            {state.emoji}
          </motion.div>
        ))}
      </div>

      <div className="flex gap-4 sm:gap-6 mt-4">
        {state.options.map(opt => {
          const isSelected = selectedAnswer === opt;
          const isCorrect = isSelected && feedback === 'correct';
          const isWrong = isSelected && feedback === 'wrong';
          
          return (
            <motion.button
              key={opt}
              onClick={() => handleAnswer(opt)}
              animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : isCorrect ? { scale: [1, 1.2, 1] } : {}}
              className={`text-white text-4xl font-bold w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-lg border-b-8 active:border-b-0 active:translate-y-2 transition-all
                ${isCorrect ? 'bg-green-500 border-green-700' : 
                  isWrong ? 'bg-red-500 border-red-700' : 
                  'bg-orange-500 border-orange-700 hover:bg-orange-400'}`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

const REWARDS = [
  { score: 5, emoji: '🥉', name: 'Bronze Medal' },
  { score: 10, emoji: '🥈', name: 'Silver Medal' },
  { score: 20, emoji: '🥇', name: 'Gold Medal' },
  { score: 50, emoji: '👑', name: 'Crown' },
  { score: 100, emoji: '🏆', name: 'Grand Trophy' },
];

function RewardsModal({ totalScore, onClose }: { totalScore: number, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-slate-800">Your Rewards</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-3xl font-bold">&times;</button>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {REWARDS.map(r => {
            const unlocked = totalScore >= r.score;
            return (
              <div key={r.score} className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${unlocked ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                <div className="text-4xl">{unlocked ? r.emoji : '🔒'}</div>
                <div>
                  <div className="font-bold text-lg text-slate-700">{r.name}</div>
                  <div className="text-sm text-slate-500">Unlocks at {r.score} points</div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function ParentDashboard({ scores, getLevel, onClose }: { scores: Record<string, number>, getLevel: (id: string) => number, onClose: () => void }) {
  const games = [
    { id: 'math', name: 'Math Dice', icon: '🎲', color: 'text-red-500', bg: 'bg-red-100' },
    { id: 'puzzle', name: 'Puzzle Race', icon: '🧩', color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'alphabet', name: 'Alphabet Match', icon: '🔤', color: 'text-green-500', bg: 'bg-green-100' },
    { id: 'memory', name: 'Memory Match', icon: '🃏', color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'counting', name: 'Counting Game', icon: '🔢', color: 'text-orange-500', bg: 'bg-orange-100' },
    { id: 'colors', name: 'Color Catch', icon: '🎨', color: 'text-pink-500', bg: 'bg-pink-100' },
    { id: 'shapes', name: 'Shape Sorter', icon: '🔺', color: 'text-teal-500', bg: 'bg-teal-100' },
    { id: 'words', name: 'Word Builder', icon: '📝', color: 'text-indigo-500', bg: 'bg-indigo-100' }
  ];

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-sky-500" />
              Parent Dashboard
            </h2>
            <p className="text-slate-500 mt-1">Track your child's learning progress</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-3xl font-bold">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="bg-sky-50 rounded-2xl p-6 mb-6 flex items-center justify-between border-2 border-sky-100">
            <div>
              <h3 className="text-lg font-semibold text-sky-800">Total Stars Earned</h3>
              <p className="text-sm text-sky-600">Across all learning games</p>
            </div>
            <div className="text-4xl font-black text-yellow-500 flex items-center gap-2">
              <Star className="w-8 h-8 fill-yellow-500" />
              {totalScore}
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-700 mb-4">Game Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {games.map(game => {
              const score = scores[game.id] || 0;
              const level = getLevel(game.id);
              const progressToNextLevel = (score % 5) / 5 * 100;
              
              return (
                <div key={game.id} className={`p-4 rounded-2xl border-2 border-slate-100 ${game.bg} bg-opacity-30`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{game.icon}</span>
                    <div className="flex-1">
                      <h4 className={`font-bold ${game.color}`}>{game.name}</h4>
                      <div className="text-sm text-slate-600 font-medium">Level {level}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-700 flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {score}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-white rounded-full h-2.5 mb-1 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full ${game.color.replace('text-', 'bg-')}`} 
                      style={{ width: `${progressToNextLevel}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    {5 - (score % 5)} stars to Level {level + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- New Games ---

const COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Brown', hex: '#8b4513' },
];

function ColorCatch({ onWin, level }: { onWin: () => void, level: number, key?: string }) {
  const [state, setState] = useGameState('colors', {
    targetColor: COLORS[0],
    options: [] as typeof COLORS
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const generateQuestion = () => {
    const numOptions = Math.min(8, 3 + Math.floor(level / 2));
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
    const selectedOptions = shuffled.slice(0, numOptions);
    const target = selectedOptions[Math.floor(Math.random() * selectedOptions.length)];
    setState({
      targetColor: target,
      options: selectedOptions
    });
  };

  useEffect(() => {
    if (state.options.length === 0) {
      generateQuestion();
    }
  }, []);

  const handleAnswer = (color: typeof COLORS[0]) => {
    if (feedback) return;
    setSelectedAnswer(color.name);
    if (color.name === state.targetColor.name) {
      playSound('correct');
      setFeedback('correct');
      setTimeout(() => {
        setShowConfetti(true);
        onWin();
        setTimeout(() => {
          setShowConfetti(false);
          setFeedback(null);
          setSelectedAnswer(null);
          generateQuestion();
        }, 2000);
      }, 500);
    } else {
      playSound('wrong');
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setSelectedAnswer(null);
      }, 500);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8 mt-4 w-full">
      {showConfetti && <Confetti />}
      <LevelComplete show={showConfetti} />
      <h2 className="text-3xl font-bold text-slate-700">Find the color:</h2>
      <div className="text-5xl sm:text-6xl font-black text-slate-700">
        {state.targetColor.name}
      </div>
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 max-w-lg">
        {state.options.map(opt => {
          const isSelected = selectedAnswer === opt.name;
          const isCorrect = isSelected && feedback === 'correct';
          const isWrong = isSelected && feedback === 'wrong';
          
          return (
            <motion.button
              key={opt.name}
              onClick={() => handleAnswer(opt)}
              animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : isCorrect ? { scale: [1, 1.2, 1] } : {}}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg border-4 active:scale-95 transition-transform hover:scale-105
                ${isCorrect ? 'border-green-500 ring-4 ring-green-300' : 
                  isWrong ? 'border-red-500 ring-4 ring-red-300' : 
                  'border-white'}`}
              style={{ backgroundColor: opt.hex }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

const SHAPE_EMOJIS = [
  { name: 'Red Circle', emoji: '🔴', base: 'Circle', color: 'Red', difficulty: 1 },
  { name: 'Blue Square', emoji: '🟦', base: 'Square', color: 'Blue', difficulty: 1 },
  { name: 'Red Triangle', emoji: '🔺', base: 'Triangle', color: 'Red', difficulty: 1 },
  { name: 'Yellow Star', emoji: '⭐', base: 'Star', color: 'Yellow', difficulty: 1 },
  { name: 'Red Heart', emoji: '❤️', base: 'Heart', color: 'Red', difficulty: 1 },
  { name: 'Red Diamond', emoji: '♦️', base: 'Diamond', color: 'Red', difficulty: 1 },
  { name: 'Yellow Circle', emoji: '🟡', base: 'Circle', color: 'Yellow', difficulty: 2 },
  { name: 'Green Square', emoji: '🟩', base: 'Square', color: 'Green', difficulty: 2 },
  { name: 'Purple Circle', emoji: '🟣', base: 'Circle', color: 'Purple', difficulty: 2 },
  { name: 'Orange Diamond', emoji: '🔶', base: 'Diamond', color: 'Orange', difficulty: 2 },
  { name: 'Blue Diamond', emoji: '🔷', base: 'Diamond', color: 'Blue', difficulty: 2 },
  { name: 'White Circle', emoji: '⚪', base: 'Circle', color: 'White', difficulty: 3 },
  { name: 'Black Square', emoji: '⬛', base: 'Square', color: 'Black', difficulty: 3 },
  { name: 'Brown Circle', emoji: '🟤', base: 'Circle', color: 'Brown', difficulty: 3 },
  { name: 'Orange Square', emoji: '🟧', base: 'Square', color: 'Orange', difficulty: 3 },
  { name: 'Yellow Square', emoji: '🟨', base: 'Square', color: 'Yellow', difficulty: 3 },
  { name: 'Purple Square', emoji: '🟪', base: 'Square', color: 'Purple', difficulty: 3 },
];

function ShapeSorter({ onWin, level }: { onWin: () => void, level: number, key?: string }) {
  const [state, setState] = useGameState('shapes-v2', {
    targetShape: SHAPE_EMOJIS[0],
    options: [] as typeof SHAPE_EMOJIS,
    askForColor: false
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const generateQuestion = () => {
    const numOptions = Math.min(12, 3 + Math.floor(level / 2));
    const askForColor = level >= 3;
    const maxDifficulty = Math.max(1, Math.ceil(level / 2));
    
    const availableShapes = SHAPE_EMOJIS.filter(s => s.difficulty <= maxDifficulty);
    const shuffled = [...availableShapes].sort(() => Math.random() - 0.5);
    
    let selectedOptions: typeof SHAPE_EMOJIS = [];
    
    if (!askForColor) {
      const seenBases = new Set();
      for (const shape of shuffled) {
        if (!seenBases.has(shape.base)) {
          seenBases.add(shape.base);
          selectedOptions.push(shape);
        }
        if (selectedOptions.length === numOptions) break;
      }
      if (selectedOptions.length < numOptions) {
        selectedOptions = shuffled.slice(0, numOptions);
      }
    } else {
      selectedOptions = shuffled.slice(0, numOptions);
    }
    
    const target = selectedOptions[Math.floor(Math.random() * selectedOptions.length)];
    
    setState({
      targetShape: target,
      options: selectedOptions,
      askForColor
    });
  };

  useEffect(() => {
    if (state.options.length === 0) {
      generateQuestion();
    }
  }, []);

  const handleAnswer = (shape: typeof SHAPE_EMOJIS[0]) => {
    if (feedback) return;
    setSelectedAnswer(shape.name);
    if (shape.name === state.targetShape.name) {
      playSound('correct');
      setFeedback('correct');
      setTimeout(() => {
        setShowConfetti(true);
        onWin();
        setTimeout(() => {
          setShowConfetti(false);
          setFeedback(null);
          setSelectedAnswer(null);
          generateQuestion();
        }, 2000);
      }, 500);
    } else {
      playSound('wrong');
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setSelectedAnswer(null);
      }, 500);
    }
  };

  const getAnimation = (opt: typeof SHAPE_EMOJIS[0], isCorrect: boolean, isWrong: boolean) => {
    if (isWrong) return { x: [-10, 10, -10, 10, 0] };
    if (isCorrect) return { scale: [1, 1.2, 1] };
    
    if (level >= 5) {
      const randomDelay = Math.random() * 2;
      return {
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          delay: randomDelay,
          ease: "easeInOut"
        }
      };
    }
    if (level >= 4) {
      const randomDelay = Math.random() * 2;
      return {
        y: [0, -5, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          delay: randomDelay,
          ease: "easeInOut"
        }
      };
    }
    return {};
  };

  const targetName = state.askForColor ? state.targetShape.name : state.targetShape.base;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex flex-col items-center gap-8 mt-4 w-full ${level >= 6 ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white rounded-3xl p-4' : ''}`}>
      {showConfetti && <Confetti />}
      <LevelComplete show={showConfetti} />
      <h2 className="text-3xl font-bold text-slate-700">Find the:</h2>
      <div className="text-5xl sm:text-6xl font-black text-teal-600">
        {targetName}
      </div>
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 max-w-2xl">
        {state.options.map((opt, i) => {
          const isSelected = selectedAnswer === opt.name;
          const isCorrect = isSelected && feedback === 'correct';
          const isWrong = isSelected && feedback === 'wrong';
          
          return (
            <motion.button
              key={`${opt.name}-${i}`}
              onClick={() => handleAnswer(opt)}
              animate={getAnimation(opt, isCorrect, isWrong)}
              className={`w-24 h-24 sm:w-32 sm:h-32 rounded-2xl shadow-lg border-b-8 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center text-6xl sm:text-7xl
                ${isCorrect ? 'bg-green-100 border-green-300 ring-4 ring-green-400' : 
                  isWrong ? 'bg-red-100 border-red-300 ring-4 ring-red-400' : 
                  'bg-white border-slate-200 hover:bg-slate-50'}`}
            >
              {opt.emoji}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

const WORDS = [
  { word: 'CAT', emoji: '🐱' },
  { word: 'DOG', emoji: '🐶' },
  { word: 'SUN', emoji: '☀️' },
  { word: 'CAR', emoji: '🚗' },
  { word: 'PIG', emoji: '🐷' },
  { word: 'COW', emoji: '🐮' },
  { word: 'BUG', emoji: '🐛' },
  { word: 'HAT', emoji: '🎩' },
  { word: 'BAT', emoji: '🦇' },
  { word: 'OWL', emoji: '🦉' },
  { word: 'BIRD', emoji: '🐦' },
  { word: 'FISH', emoji: '🐟' },
  { word: 'FROG', emoji: '🐸' },
  { word: 'BEAR', emoji: '🐻' },
  { word: 'LION', emoji: '🦁' },
  { word: 'DUCK', emoji: '🦆' },
  { word: 'TREE', emoji: '🌳' },
  { word: 'STAR', emoji: '⭐' },
  { word: 'MOON', emoji: '🌙' },
  { word: 'FIRE', emoji: '🔥' },
];

function WordBuilder({ onWin, level }: { onWin: () => void, level: number, key?: string }) {
  const [state, setState] = useGameState('words', {
    target: WORDS[0],
    spelled: [] as string[],
    letters: [] as {char: string, id: number}[]
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong', id: number } | null>(null);

  const generateQuestion = () => {
    // Filter words based on level (longer words at higher levels)
    const maxWordLength = level >= 3 ? 4 : 3;
    const availableWords = WORDS.filter(w => w.word.length <= maxWordLength);
    const newTarget = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    let opts = newTarget.word.split('').map((char, i) => ({ char, id: i }));
    
    // Add extra random letters based on level
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numExtra = Math.min(6, level);
    for(let i=0; i<numExtra; i++) {
      opts.push({ char: alphabet[Math.floor(Math.random() * alphabet.length)], id: i + 100 });
    }
    
    setState({
      target: newTarget,
      spelled: [],
      letters: opts.sort(() => Math.random() - 0.5)
    });
  };

  useEffect(() => {
    if (state.letters.length === 0) {
      generateQuestion();
    }
  }, []);

  const handleLetterClick = (letterObj: {char: string, id: number}) => {
    if (feedback) return;
    const expectedChar = state.target.word[state.spelled.length];
    if (letterObj.char === expectedChar) {
      playSound('correct');
      setFeedback({ type: 'correct', id: letterObj.id });
      
      setTimeout(() => {
        const newSpelled = [...state.spelled, letterObj.char];
        
        setState(s => ({
          ...s,
          spelled: newSpelled,
          letters: s.letters.filter(l => l.id !== letterObj.id)
        }));
        setFeedback(null);

        if (newSpelled.length === state.target.word.length) {
          playSound('win');
          setShowConfetti(true);
          onWin();
          setTimeout(() => {
            setShowConfetti(false);
            generateQuestion();
          }, 2000);
        }
      }, 500);
    } else {
      playSound('wrong');
      setFeedback({ type: 'wrong', id: letterObj.id });
      setTimeout(() => setFeedback(null), 500);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8 mt-4 w-full">
      {showConfetti && <Confetti />}
      <LevelComplete show={showConfetti} />
      <h2 className="text-3xl font-bold text-slate-700">Spell the word!</h2>
      <div className="text-8xl">{state.target.emoji}</div>
      
      {/* Word slots */}
      <div className="flex gap-2 sm:gap-4">
        {state.target.word.split('').map((char, i) => (
          <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 border-b-8 border-slate-300 flex items-center justify-center text-4xl sm:text-5xl font-bold text-indigo-600 uppercase">
            {state.spelled[i] || ''}
          </div>
        ))}
      </div>

      {/* Available letters */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8 max-w-lg">
        {state.letters.map(l => {
          const isCorrect = feedback?.id === l.id && feedback.type === 'correct';
          const isWrong = feedback?.id === l.id && feedback.type === 'wrong';
          
          return (
            <motion.button
              key={l.id}
              onClick={() => handleLetterClick(l)}
              animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : isCorrect ? { scale: [1, 1.2, 1] } : {}}
              className={`w-16 h-16 sm:w-20 sm:h-20 text-white rounded-2xl shadow-lg border-b-8 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center text-4xl sm:text-5xl font-bold uppercase
                ${isCorrect ? 'bg-green-500 border-green-700' : 
                  isWrong ? 'bg-red-500 border-red-700' : 
                  'bg-indigo-500 border-indigo-700 hover:bg-indigo-400'}`}
            >
              {l.char}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
