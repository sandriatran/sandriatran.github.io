/**
 * NBackGame — Dual N-Back with 3x3 position grid + audio letters
 *
 * True dual n-back: track BOTH the position on a 3x3 grid AND the
 * spoken letter simultaneously. Two independent match buttons.
 * Hidden easter egg (press E).
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const LETTERS = 'CDHKMNPQRSTW'.split(''); // Phonetically distinct subset
const N_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const GRID_SIZE = 9; // 3x3

interface Trial {
  position: number; // 0-8 index in 3x3 grid
  letter: string;
}

function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.lang.startsWith('en') && v.localService)
    || voices.find(v => v.lang.startsWith('en'))
    || null;
}

export default function NBackGame() {
  const [isOpen, setIsOpen] = useState(false);
  const [n, setN] = useState(2);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [sequence, setSequence] = useState<Trial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [posScore, setPosScore] = useState(0);
  const [audioScore, setAudioScore] = useState(0);
  const [posFeedback, setPosFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [audioFeedback, setAudioFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const maxTrials = 20 + n;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posResponded = useRef(false);
  const audioResponded = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => { voiceRef.current = getPreferredVoice(); };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }
  }, []);

  const speakLetter = (letter: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    if (voiceRef.current) utterance.voice = voiceRef.current;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-nback', handleOpen as EventListener);
    return () => window.removeEventListener('open-nback', handleOpen as EventListener);
  }, []);

  const closeGame = useCallback(() => {
    setIsOpen(false);
    setGameState('start');
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
    const newSeq: Trial[] = [];
    for (let i = 0; i < maxTrials; i++) {
      const posMatch = i >= n && Math.random() < 0.3;
      const audioMatch = i >= n && Math.random() < 0.3;
      newSeq.push({
        position: posMatch ? newSeq[i - n].position : Math.floor(Math.random() * GRID_SIZE),
        letter: audioMatch ? newSeq[i - n].letter : LETTERS[Math.floor(Math.random() * LETTERS.length)],
      });
    }
    setSequence(newSeq);
    setPosScore(0);
    setAudioScore(0);
    setCurrentIndex(0);
    setGameState('playing');
    setPosFeedback(null);
    setAudioFeedback(null);
    posResponded.current = false;
    audioResponded.current = false;
  };

  const nextTurn = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= maxTrials - 1) {
        setGameState('end');
        return prev;
      }
      return prev + 1;
    });
    setPosFeedback(null);
    setAudioFeedback(null);
    posResponded.current = false;
    audioResponded.current = false;
  }, [maxTrials]);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(nextTurn, 3000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, nextTurn]);

  useEffect(() => {
    if (gameState === 'playing' && sequence[currentIndex]) {
      speakLetter(sequence[currentIndex].letter);
    }
  }, [currentIndex, gameState, sequence]);

  const handlePosMatch = useCallback(() => {
    if (gameState !== 'playing' || posResponded.current) return;
    posResponded.current = true;
    if (currentIndex >= n && sequence[currentIndex].position === sequence[currentIndex - n].position) {
      setPosScore((s) => s + 1);
      setPosFeedback('correct');
    } else {
      setPosFeedback('incorrect');
    }
  }, [gameState, sequence, currentIndex, n]);

  const handleAudioMatch = useCallback(() => {
    if (gameState !== 'playing' || audioResponded.current) return;
    audioResponded.current = true;
    if (currentIndex >= n && sequence[currentIndex].letter === sequence[currentIndex - n].letter) {
      setAudioScore((s) => s + 1);
      setAudioFeedback('correct');
    } else {
      setAudioFeedback('incorrect');
    }
  }, [gameState, sequence, currentIndex, n]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key === 'a' || e.key === 'A') { e.preventDefault(); handlePosMatch(); }
      if (e.key === 'l' || e.key === 'L') { e.preventDefault(); handleAudioMatch(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handlePosMatch, handleAudioMatch]);

  if (!isOpen) return null;

  const progress = gameState === 'playing' ? ((currentIndex + 1) / maxTrials) * 100 : 0;
  const currentTrial = sequence[currentIndex];
  const totalScore = posScore + audioScore;

  const feedbackColor = (fb: 'correct' | 'incorrect' | null) =>
    fb === 'correct' ? 'rgba(34, 197, 94, 0.5)' : fb === 'incorrect' ? 'rgba(239, 68, 68, 0.5)' : 'transparent';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-5"
      style={{ background: 'var(--overlay-backdrop)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeGame(); }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: '520px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--surface-border)',
          borderRadius: '20px',
          boxShadow: '0 24px 80px -12px rgba(0, 0, 0, 0.3)',
        }}
      >
        {gameState === 'playing' && (
          <div
            className="absolute top-0 left-0 h-[2px] transition-all duration-300"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-lavender))' }}
          />
        )}

        <button
          onClick={closeGame}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)' }}
          aria-label="Close game"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        <div className="px-8 pb-8 pt-10 sm:px-10 sm:pb-10 sm:pt-12">

          {/* ── Start Screen ── */}
          {gameState === 'start' && (
            <div className="flex flex-col items-center">
              <h2 className="mb-1.5 font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
                Dual N-Back
              </h2>
              <div className="mb-6 h-[2px] w-10" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-lavender), transparent)' }} />

              <p className="mb-6 max-w-sm text-center text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                A cognitive training exercise designed to boost{' '}
                <strong style={{ color: 'var(--accent-lavender)' }}>working memory</strong>.
                Track <strong style={{ color: 'var(--text-primary)' }}>two streams</strong> simultaneously:
                the <strong style={{ color: 'var(--accent-blue)' }}>position</strong> on a 3x3 grid and the{' '}
                <strong style={{ color: 'var(--accent-pink)' }}>spoken letter</strong>.
                Signal a match when either repeats from{' '}
                <em style={{ color: 'var(--accent-lavender)' }}>N</em> steps ago.
              </p>

              <div className="mb-6 flex w-full gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
                  <kbd className="font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>A</kbd>
                  <div className="mt-1">Position match</div>
                </div>
                <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
                  <kbd className="font-mono font-bold" style={{ color: 'var(--accent-pink)' }}>L</kbd>
                  <div className="mt-1">Audio match</div>
                </div>
              </div>

              <label className="mb-3 text-xs font-accent tracking-[0.18em] uppercase" style={{ color: 'var(--text-secondary)' }}>
                Select level
              </label>
              <div className="mb-8 flex flex-wrap justify-center gap-2">
                {N_OPTIONS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setN(level)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-200"
                    style={{
                      background: n === level ? 'var(--accent-blue)' : 'var(--surface)',
                      color: n === level ? 'var(--cta-button-text)' : 'var(--text-secondary)',
                      border: `1px solid ${n === level ? 'var(--accent-blue)' : 'var(--surface-border)'}`,
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <button
                onClick={startGame}
                className="w-full rounded-full py-3.5 text-sm font-accent font-medium tracking-[0.12em] uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'var(--accent-blue)', color: 'var(--cta-button-text)' }}
              >
                Start {n}-Back
              </button>
            </div>
          )}

          {/* ── Playing Screen ── */}
          {gameState === 'playing' && currentTrial && (
            <div className="flex flex-col items-center">
              <div className="mb-6 flex w-full justify-between text-xs font-accent tracking-[0.15em] uppercase" style={{ color: 'var(--text-secondary)' }}>
                <span>{currentIndex + 1} / {maxTrials}</span>
                <span>{n}-back</span>
                <span>{totalScore} correct</span>
              </div>

              {/* 3x3 Grid */}
              <div
                className="mb-6 grid grid-cols-3 gap-1.5"
                style={{ width: '180px', height: '180px' }}
              >
                {Array.from({ length: GRID_SIZE }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg transition-all duration-200"
                    style={{
                      background: currentTrial.position === i
                        ? 'var(--accent-blue)'
                        : 'var(--surface)',
                      border: `1px solid ${currentTrial.position === i ? 'var(--accent-blue)' : 'var(--surface-border)'}`,
                      boxShadow: currentTrial.position === i ? '0 0 16px color-mix(in srgb, var(--accent-blue) 40%, transparent)' : 'none',
                    }}
                  />
                ))}
              </div>

              {/* Current letter */}
              <div className="mb-6 text-center">
                <span className="font-display text-4xl" style={{ color: 'var(--text-primary)' }} key={currentIndex}>
                  {currentTrial.letter}
                </span>
              </div>

              {/* Match buttons */}
              <div className="flex w-full gap-3">
                <button
                  onClick={handlePosMatch}
                  className="flex-1 rounded-xl py-3 text-sm font-accent font-medium tracking-[0.1em] uppercase transition-all duration-150 active:scale-[0.97]"
                  style={{
                    background: posFeedback ? feedbackColor(posFeedback) : 'var(--surface)',
                    border: `1px solid ${posFeedback === 'correct' ? 'rgba(34,197,94,0.4)' : posFeedback === 'incorrect' ? 'rgba(239,68,68,0.4)' : 'var(--surface-border)'}`,
                    color: 'var(--text-primary)',
                  }}
                >
                  <kbd className="mr-1.5 font-mono text-xs" style={{ color: 'var(--accent-blue)' }}>A</kbd>
                  Position
                </button>
                <button
                  onClick={handleAudioMatch}
                  className="flex-1 rounded-xl py-3 text-sm font-accent font-medium tracking-[0.1em] uppercase transition-all duration-150 active:scale-[0.97]"
                  style={{
                    background: audioFeedback ? feedbackColor(audioFeedback) : 'var(--surface)',
                    border: `1px solid ${audioFeedback === 'correct' ? 'rgba(34,197,94,0.4)' : audioFeedback === 'incorrect' ? 'rgba(239,68,68,0.4)' : 'var(--surface-border)'}`,
                    color: 'var(--text-primary)',
                  }}
                >
                  Audio
                  <kbd className="ml-1.5 font-mono text-xs" style={{ color: 'var(--accent-pink)' }}>L</kbd>
                </button>
              </div>
            </div>
          )}

          {/* ── End Screen ── */}
          {gameState === 'end' && (
            <div className="flex flex-col items-center">
              <h3 className="mb-6 font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
                Session Complete
              </h3>

              <div className="mb-6 flex w-full gap-4">
                <div className="flex flex-1 flex-col items-center rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
                  <span className="font-display text-3xl" style={{ color: 'var(--accent-blue)' }}>{posScore}</span>
                  <span className="mt-1 text-[10px] font-accent tracking-[0.15em] uppercase" style={{ color: 'var(--text-secondary)' }}>position</span>
                </div>
                <div className="flex flex-1 flex-col items-center rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)' }}>
                  <span className="font-display text-3xl" style={{ color: 'var(--accent-pink)' }}>{audioScore}</span>
                  <span className="mt-1 text-[10px] font-accent tracking-[0.15em] uppercase" style={{ color: 'var(--text-secondary)' }}>audio</span>
                </div>
              </div>

              <p className="mb-8 max-w-xs text-center text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Working memory tested at{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{n}-back</strong> across{' '}
                {maxTrials} trials with dual-stream tracking.
              </p>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => setGameState('start')}
                  className="flex-1 rounded-full py-3 text-sm font-accent tracking-[0.1em] uppercase transition-all duration-200"
                  style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)' }}
                >
                  Settings
                </button>
                <button
                  onClick={startGame}
                  className="flex-1 rounded-full py-3 text-sm font-accent tracking-[0.1em] uppercase transition-all duration-200"
                  style={{ background: 'var(--accent-blue)', color: 'var(--cta-button-text)' }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
