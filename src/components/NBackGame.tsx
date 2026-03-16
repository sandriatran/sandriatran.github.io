import { useState, useEffect, useCallback, useRef } from 'react';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function NBackGame() {
  const [isOpen, setIsOpen] = useState(false);
  const [n, setN] = useState(2);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [startInput, setStartInput] = useState('');
  const maxTrials = 20 + n; // Ensure enough trials to actually test n-back

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRespondedThisTurn = useRef(false);

  const speakLetter = (letter: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.rate = 1.2;
      utterance.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-nback', handleOpen as EventListener);
    return () => window.removeEventListener('open-nback', handleOpen as EventListener);
  }, []);

  const closeGame = useCallback(() => {
    setIsOpen(false);
    setGameState('start');
    setStartInput('');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeGame]);

  const startGame = () => {
    // Generate sequence
    const newSeq: string[] = [];
    for (let i = 0; i < maxTrials; i++) {
      if (i >= n && Math.random() < 0.35) {
        // 35% chance to be a match
        newSeq.push(newSeq[i - n]);
      } else {
        newSeq.push(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
      }
    }
    setSequence(newSeq);
    setScore(0);
    setCurrentIndex(0);
    setGameState('playing');
    setFeedback(null);
    setStartInput(''); // reset input
    hasRespondedThisTurn.current = false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartInput(val);
    if (val.toLowerCase() === 'start') {
      startGame();
    }
  };

  const nextTurn = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= maxTrials - 1) {
        setGameState('end');
        return prev;
      }
      return prev + 1;
    });
    setFeedback(null);
    hasRespondedThisTurn.current = false;
  }, [maxTrials]);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(nextTurn, 2500);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, nextTurn]);

  // Handle auditory feedback separately when index changes
  useEffect(() => {
    if (gameState === 'playing' && sequence[currentIndex]) {
      speakLetter(sequence[currentIndex]);
    }
  }, [currentIndex, gameState, sequence]);

  const handleMatch = useCallback(() => {
    if (gameState !== 'playing' || hasRespondedThisTurn.current) return;
    hasRespondedThisTurn.current = true;

    if (currentIndex >= n && sequence[currentIndex] === sequence[currentIndex - n]) {
      setScore((s) => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  }, [gameState, sequence, currentIndex, n]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent spacebar matching from triggering if we're not playing
      if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault();
        handleMatch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleMatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 transition-opacity duration-300" style={{ background: 'rgba(15, 18, 25, 0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div className="glass-card w-full max-w-lg p-8 relative flex flex-col items-center">
        <button 
          onClick={closeGame}
          className="absolute top-5 right-5 text-xs font-accent tracking-[0.15em] text-[var(--accent-lavender)] hover:text-white transition-colors uppercase"
        >
          Close [Esc]
        </button>

        <h2 className="font-display text-3xl mb-2 mt-4 text-center" style={{ color: 'var(--text-primary)' }}>Dual N-Back Protocol</h2>
        <div className="w-12 h-0.5 mb-6" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-pink), transparent)' }}></div>
        
        {gameState === 'start' && (
          <div className="flex flex-col items-center w-full gap-8 animate-fade-in-up">
            <p className="font-body text-sm text-center px-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              A cognitive science memory task with <strong style={{ color: 'var(--accent-lavender)' }}>audio-visual</strong> stimuli.
              <br/><br/>
              Press <strong style={{ color: 'var(--text-primary)' }}>Spacebar</strong> or click <strong style={{ color: 'var(--text-primary)' }}>Match</strong> if the current letter matches the one from <em style={{ color: 'var(--accent-pink)' }}>N</em> steps ago.
            </p>
            
            <div className="flex flex-col items-center gap-4 w-full px-8">
              <label className="text-xs font-accent tracking-[0.2em] uppercase" style={{ color: 'var(--accent-indigo)' }}>Select N Level</label>
              <input 
                type="range" 
                min="1" max="10" 
                value={n} 
                onChange={(e) => setN(parseInt(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer outline-none"
                style={{ accentColor: 'var(--accent-lavender)' }}
              />
              <div className="flex items-center gap-2">
                <span className="font-display text-5xl" style={{ color: 'var(--accent-lavender)' }}>{n}</span>
                <span className="text-sm font-accent tracking-widest text-white/50 uppercase mt-2">-Back</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 mt-2 w-full max-w-xs">
              <label htmlFor="start-input" className="text-xs font-accent tracking-[0.15em] uppercase" style={{ color: 'var(--text-secondary)' }}>Type "START" to initialize</label>
              <input
                id="start-input"
                type="text"
                autoComplete="off"
                spellCheck="false"
                value={startInput}
                onChange={handleInputChange}
                className="w-full text-center py-3 rounded-full text-sm font-accent tracking-[0.2em] uppercase transition-all bg-transparent outline-none focus:ring-2"
                style={{ border: '1px solid var(--surface-border)', color: 'var(--text-primary)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)' }}
                placeholder="..."
              />
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex flex-col items-center mt-2 w-full animate-fade-in">
            <div className="flex justify-between w-full px-4 mb-10 text-xs font-accent tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
              <span>Trial: {currentIndex + 1}/{maxTrials}</span>
              <span>Score: {score}</span>
            </div>

            <div 
              className="relative flex items-center justify-center w-36 h-36 mb-12 rounded-2xl transition-all duration-300"
              style={{
                background: feedback === 'correct' ? 'rgba(34, 197, 94, 0.15)' : feedback === 'incorrect' ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface)',
                border: `1px solid ${feedback === 'correct' ? 'rgba(34, 197, 94, 0.4)' : feedback === 'incorrect' ? 'rgba(239, 68, 68, 0.4)' : 'var(--surface-border)'}`,
                boxShadow: feedback === 'correct' ? '0 0 40px rgba(34, 197, 94, 0.2)' : feedback === 'incorrect' ? '0 0 40px rgba(239, 68, 68, 0.2)' : 'inset 0 0 20px rgba(255,255,255,0.05)',
              }}
            >
              <span className="font-display text-7xl" style={{ color: 'var(--text-primary)', animation: 'fade-in 0.3s ease-out forwards' }} key={currentIndex}>
                {sequence[currentIndex]}
              </span>
            </div>

            <div className="flex flex-col gap-4 w-full px-8">
              <button 
                onClick={handleMatch}
                className="w-full py-4 rounded-xl text-sm font-accent tracking-[0.15em] uppercase transition-all active:scale-95"
                style={{ background: 'color-mix(in srgb, var(--accent-lavender) 20%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-lavender) 40%, transparent)', color: 'var(--text-primary)' }}
              >
                Match (Spacebar)
              </button>
            </div>
            <p className="mt-6 text-xs font-body text-center opacity-70" style={{ color: 'var(--text-secondary)' }}>
              Remember the audio-visual sequence from {n} step{n > 1 ? 's' : ''} ago.
            </p>
          </div>
        )}

        {gameState === 'end' && (
          <div className="flex flex-col items-center mt-4 w-full gap-8 animate-fade-in-up">
            <h3 className="font-display text-4xl" style={{ color: 'var(--accent-pink)' }}>Task Complete</h3>
            <div className="flex flex-col items-center justify-center w-36 h-36 rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
              <span className="font-display text-5xl" style={{ color: 'var(--text-primary)' }}>{score}</span>
              <span className="text-[10px] font-accent tracking-[0.2em] uppercase mt-1" style={{ color: 'var(--text-secondary)' }}>Matches</span>
            </div>
            
            <p className="font-body text-sm text-center max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Excellent processing. Your working memory was tested at a cognitive load of <strong style={{ color: 'var(--text-primary)' }}>{n}-back</strong>.
            </p>

            <button 
              onClick={() => {
                setGameState('start');
                setStartInput('');
              }}
              className="mt-2 px-8 py-3 rounded-full text-sm font-accent tracking-[0.15em] uppercase transition-all"
              style={{ background: 'color-mix(in srgb, var(--surface) 50%, transparent)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)' }}
            >
              Recalibrate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
