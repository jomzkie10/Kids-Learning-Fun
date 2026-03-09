import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Star, Trophy } from 'lucide-react';

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

// --- Main App Component ---
export default function App() {
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [score, setScore] = useState(0);

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
        <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1 sm:px-4 sm:py-2 rounded-full border-2 border-yellow-300">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-lg sm:text-xl font-bold text-yellow-600">{score}</span>
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
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 sm:mt-8"
            >
              <GameCard title="Math Dice" color="bg-red-400" border="border-red-600" icon="🎲" onClick={() => setCurrentGame('math')} />
              <GameCard title="Puzzle Race" color="bg-blue-400" border="border-blue-600" icon="🧩" onClick={() => setCurrentGame('puzzle')} />
              <GameCard title="Alphabet Match" color="bg-green-400" border="border-green-600" icon="🔤" onClick={() => setCurrentGame('alphabet')} />
              <GameCard title="Memory Match" color="bg-purple-400" border="border-purple-600" icon="🃏" onClick={() => setCurrentGame('memory')} />
              <GameCard title="Counting Game" color="bg-orange-400" border="border-orange-600" icon="🔢" onClick={() => setCurrentGame('counting')} />
            </motion.div>
          )}
          {currentGame === 'math' && <MathDice key="math" onWin={() => setScore(s => s + 1)} />}
          {currentGame === 'puzzle' && <PuzzleRace key="puzzle" onWin={() => setScore(s => s + 1)} />}
          {currentGame === 'alphabet' && <AlphabetMatch key="alphabet" onWin={() => setScore(s => s + 1)} />}
          {currentGame === 'memory' && <MemoryMatch key="memory" onWin={() => setScore(s => s + 1)} />}
          {currentGame === 'counting' && <CountingGame key="counting" onWin={() => setScore(s => s + 1)} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function GameCard({ title, color, border, icon, onClick }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`${color} text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-4 border-b-8 ${border} active:border-b-0 active:translate-y-2 transition-all`}
    >
      <span className="text-6xl">{icon}</span>
      <h2 className="text-2xl font-bold">{title}</h2>
    </motion.button>
  );
}

// --- Mini Games ---

function MathDice({ onWin }: { onWin: () => void, key?: string }) {
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [options, setOptions] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const generateQuestion = () => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setDice1(d1);
    setDice2(d2);
    const sum = d1 + d2;
    const opts = new Set([sum]);
    while(opts.size < 3) {
      let wrong = sum + Math.floor(Math.random() * 5) - 2;
      if (wrong > 0 && wrong !== sum) opts.add(wrong);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleAnswer = (ans: number) => {
    if (ans === dice1 + dice2) {
      playSound('correct');
      setShowConfetti(true);
      onWin();
      setTimeout(() => {
        setShowConfetti(false);
        generateQuestion();
      }, 2000);
    } else {
      playSound('wrong');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8 mt-4">
      {showConfetti && <Confetti />}
      <h2 className="text-3xl font-bold text-slate-700">Add the dice!</h2>
      <div className="flex items-center gap-2 sm:gap-4 text-4xl sm:text-6xl font-bold text-slate-600">
        <Dice value={dice1} />
        <span className="text-slate-400">+</span>
        <Dice value={dice2} />
        <span className="text-slate-400">=</span>
        <span className="text-slate-400">?</span>
      </div>
      <div className="flex gap-4 mt-8">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            className="bg-red-500 text-white text-4xl font-bold w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-lg border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all hover:bg-red-400"
          >
            {opt}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function Dice({ value }: { value: number }) {
  const dots = Array.from({ length: value });
  return (
    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl shadow-md border-2 border-slate-200 flex flex-wrap justify-center items-center p-2 gap-1">
      {dots.map((_, i) => (
        <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 bg-slate-800 rounded-full" />
      ))}
    </div>
  );
}

function PuzzleRace({ onWin }: { onWin: () => void, key?: string }) {
  const [pieces, setPieces] = useState<number[]>([]);
  const [placed, setPlaced] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isPlaying) {
      playSound('wrong');
      setIsPlaying(false);
    }
  }, [timeLeft, isPlaying]);

  const startGame = () => {
    setPieces([1, 2, 3, 4].sort(() => Math.random() - 0.5));
    setPlaced({});
    setTimeLeft(30);
    setIsPlaying(true);
    setShowConfetti(false);
    setSelectedPiece(null);
  };

  const handleSlotClick = (slotId: number) => {
    if (selectedPiece !== null) {
      if (selectedPiece === slotId) {
        playSound('correct');
        setPlaced(prev => {
          const next = { ...prev, [slotId]: selectedPiece };
          if (Object.keys(next).length === 4) {
            playSound('win');
            setShowConfetti(true);
            setIsPlaying(false);
            onWin();
          }
          return next;
        });
        setSelectedPiece(null);
      } else {
        playSound('wrong');
        setSelectedPiece(null);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 mt-4 w-full">
      {showConfetti && <Confetti />}
      <div className="flex justify-between w-full max-w-md items-center px-4">
        <h2 className="text-3xl font-bold text-slate-700">Puzzle Race</h2>
        <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
          ⏱️ {timeLeft}s
        </div>
      </div>

      {!isPlaying && timeLeft === 30 && (
        <button onClick={startGame} className="bg-blue-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-lg border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 mt-8">
          Start Race!
        </button>
      )}

      {!isPlaying && timeLeft === 0 && (
        <div className="text-center mt-8">
          <h3 className="text-3xl font-bold text-red-500 mb-6">Time's up!</h3>
          <button onClick={startGame} className="bg-blue-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-lg border-b-8 border-blue-700 active:border-b-0 active:translate-y-2">
            Try Again
          </button>
        </div>
      )}

      {isPlaying && (
        <>
          <div className="grid grid-cols-2 gap-3 bg-slate-200 p-3 rounded-2xl w-64 h-64 sm:w-72 sm:h-72 shadow-inner">
            {[1, 2, 3, 4].map(slot => (
              <div
                key={slot}
                onClick={() => handleSlotClick(slot)}
                className={`border-4 border-dashed rounded-xl flex items-center justify-center transition-colors
                  ${selectedPiece !== null ? 'border-blue-400 bg-blue-50 cursor-pointer' : 'border-slate-300 bg-slate-100'}`}
              >
                {placed[slot] ? (
                  <PuzzlePiece id={slot} />
                ) : (
                  <span className="text-slate-300 text-5xl font-bold opacity-50">{slot}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 sm:gap-4 mt-4">
            {pieces.map(p => {
              if (placed[p]) return <div key={p} className="w-16 h-16 sm:w-20 sm:h-20" />;
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
  { letter: 'A', pic: '🍎', name: 'Apple' },
  { letter: 'B', pic: '🐻', name: 'Bear' },
  { letter: 'C', pic: '🐱', name: 'Cat' },
  { letter: 'D', pic: '🐶', name: 'Dog' },
  { letter: 'E', pic: '🐘', name: 'Elephant' },
  { letter: 'F', pic: '🐸', name: 'Frog' },
];

function AlphabetMatch({ onWin }: { onWin: () => void, key?: string }) {
  const [letters, setLetters] = useState<any[]>([]);
  const [pics, setPics] = useState<any[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);

  const startRound = () => {
    const shuffled = [...ALPHABET_PAIRS].sort(() => Math.random() - 0.5).slice(0, 4);
    setLetters([...shuffled].sort(() => Math.random() - 0.5));
    setPics([...shuffled].sort(() => Math.random() - 0.5));
    setMatched(new Set());
    setSelectedLetter(null);
    setShowConfetti(false);
  };

  useEffect(() => {
    startRound();
  }, []);

  const handlePicClick = (letter: string) => {
    if (!selectedLetter) return;
    if (selectedLetter === letter) {
      playSound('correct');
      setMatched(prev => {
        const next = new Set(prev).add(letter);
        if (next.size === 4) {
          playSound('win');
          setShowConfetti(true);
          onWin();
          setTimeout(startRound, 3000);
        }
        return next;
      });
      setSelectedLetter(null);
    } else {
      playSound('wrong');
      setSelectedLetter(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8 mt-4 w-full">
      {showConfetti && <Confetti />}
      <h2 className="text-3xl font-bold text-slate-700 text-center">Match Letter to Picture!</h2>
      
      <div className="flex justify-between w-full max-w-md gap-4 px-4">
        {/* Letters Column */}
        <div className="flex flex-col gap-4 flex-1">
          {letters.map(item => {
            const isMatched = matched.has(item.letter);
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
                {item.letter}
              </button>
            );
          })}
        </div>

        {/* Pictures Column */}
        <div className="flex flex-col gap-4 flex-1">
          {pics.map(item => {
            const isMatched = matched.has(item.letter);
            return (
              <button
                key={`p-${item.letter}`}
                disabled={isMatched}
                onClick={() => handlePicClick(item.letter)}
                className={`h-20 rounded-2xl text-5xl transition-all border-b-4 active:border-b-0 active:translate-y-1 flex items-center justify-center
                  ${isMatched ? 'bg-green-200 border-green-300 opacity-50' : 
                    selectedLetter ? 'bg-white border-slate-300 shadow-md hover:bg-blue-50 ring-2 ring-blue-200 cursor-pointer' : 
                    'bg-white border-slate-300 shadow-md opacity-80 cursor-default'}`}
              >
                {item.pic}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

const MEMORY_EMOJIS = ['🚀', '🌟', '🎈', '🍕', '🎸', '🚗'];

function MemoryMatch({ onWin }: { onWin: () => void, key?: string }) {
  const [cards, setCards] = useState<{id: number, emoji: string, isFlipped: boolean, isMatched: boolean}[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const startRound = () => {
    const deck = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({ id: idx, emoji, isFlipped: false, isMatched: false }));
    setCards(deck);
    setFlippedIds([]);
    setShowConfetti(false);
  };

  useEffect(() => {
    startRound();
  }, []);

  const handleCardClick = (id: number) => {
    if (flippedIds.length === 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);
    
    const updatedCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(updatedCards);

    if (newFlipped.length === 2) {
      const [id1, id2] = newFlipped;
      const c1 = updatedCards.find(c => c.id === id1);
      const c2 = updatedCards.find(c => c.id === id2);

      if (c1?.emoji === c2?.emoji) {
        playSound('correct');
        setTimeout(() => {
          setCards(prev => {
            const next = prev.map(c => c.id === id1 || c.id === id2 ? { ...c, isMatched: true } : c);
            if (next.every(c => c.isMatched)) {
              playSound('win');
              setShowConfetti(true);
              onWin();
              setTimeout(startRound, 4000);
            }
            return next;
          });
          setFlippedIds([]);
        }, 500);
      } else {
        playSound('wrong');
        setTimeout(() => {
          setCards(prev => prev.map(c => c.id === id1 || c.id === id2 ? { ...c, isFlipped: false } : c));
          setFlippedIds([]);
        }, 1000);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 mt-4">
      {showConfetti && <Confetti />}
      <h2 className="text-3xl font-bold text-slate-700">Memory Match</h2>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`w-20 h-24 sm:w-24 sm:h-32 rounded-xl text-4xl sm:text-5xl flex items-center justify-center shadow-md transition-all duration-300 transform preserve-3d
              ${card.isFlipped || card.isMatched ? 'bg-white rotate-y-180' : 'bg-purple-500 hover:bg-purple-400 border-b-4 border-purple-700 active:border-b-0 active:translate-y-1'}`}
            style={{ perspective: '1000px' }}
          >
            <div className={`transition-opacity duration-300 ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'}`}>
              {card.emoji}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

const COUNTING_EMOJIS = ['🐸', '🦋', '🍎', '🎈', '🚗', '🐥', '🦖', '🍦'];

function CountingGame({ onWin }: { onWin: () => void, key?: string }) {
  const [count, setCount] = useState(1);
  const [emoji, setEmoji] = useState('🐸');
  const [options, setOptions] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const generateQuestion = () => {
    const newCount = Math.floor(Math.random() * 10) + 1;
    const newEmoji = COUNTING_EMOJIS[Math.floor(Math.random() * COUNTING_EMOJIS.length)];
    setCount(newCount);
    setEmoji(newEmoji);
    
    const opts = new Set([newCount]);
    while(opts.size < 3) {
      let wrong = newCount + Math.floor(Math.random() * 5) - 2;
      if (wrong > 0 && wrong !== newCount && wrong <= 15) opts.add(wrong);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleAnswer = (ans: number) => {
    if (ans === count) {
      playSound('correct');
      setShowConfetti(true);
      onWin();
      setTimeout(() => {
        setShowConfetti(false);
        generateQuestion();
      }, 2000);
    } else {
      playSound('wrong');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8 mt-4 w-full">
      {showConfetti && <Confetti />}
      <h2 className="text-3xl font-bold text-slate-700">How many?</h2>
      
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-inner border-4 border-orange-200 min-h-[200px] w-full max-w-lg flex flex-wrap justify-center items-center gap-2 sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: i * 0.05 }}
            className="text-4xl sm:text-5xl"
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <div className="flex gap-4 sm:gap-6 mt-4">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            className="bg-orange-500 text-white text-4xl font-bold w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-lg border-b-8 border-orange-700 active:border-b-0 active:translate-y-2 transition-all hover:bg-orange-400"
          >
            {opt}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
