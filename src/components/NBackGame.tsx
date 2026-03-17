/**
 * NBackGame — "Cognitive Card" redesign
 *
 * Hidden easter egg (press E). Solid background modal with proper
 * hierarchy, numbered pill selector for N-level, single Start button,
 * and improved voice selection for natural TTS.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const N_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Pick the best available English voice
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
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const maxTrials = 20 + n;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRespondedThisTurn = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load voices (they load async in some browsers)
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
    utterance.rate = 1.1;
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
    const newSeq: string[] = [];
    for (let i = 0; i < maxTrials; i++) {
      if (i >= n && Math.random() < 0.35) {
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
    hasRespondedThisTurn.current = false;
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, nextTurn]);

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
      if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault();
        handleMatch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleMatch]);

  if (!isOpen) return null;

  const progress = gameState === 'playing' ? ((currentIndex + 1) / maxTrials) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-5"
      style={{
        background: 'var(--overlay-backdrop)',
        backdropFilter: 'blur(16px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) closeGame(); }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: '480px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--surface-border)',
          borderRadius: '20px',
          boxShadow: '0 24px 80px -12px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Progress bar (during gameplay) */}
        {gameState === 'playing' && (
          <div
            className="absolute top-0 left-0 h-[2px] transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-lavender))',
            }}
          />
        )}

        {/* Close button */}
        <button
          onClick={closeGame}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-primary)',
          }}
          aria-label="Close game"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {/* Content */}
        <div className="px-8 pb-8 pt-10 sm:px-10 sm:pb-10 sm:pt-12">

          {/* ── Start Screen ── */}
          {gameState === 'start' && (
            <div className="flex flex-col items-center">
              <h2
                className="mb-1.5 font-display text-2xl"
                style={{ color: 'var(--text-primary)' }}
              >
                Dual N-Back Protocol
              </h2>
              <div
                className="mb-6 h-[2px] w-10"
                style={{ background: 'linear-gradient(90deg, transparent, var(--accent-lavender), transparent)' }}
              />

              <p
                className="mb-8 max-w-sm text-center text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                A cognitive memory task with{' '}
                <strong style={{ color: 'var(--accent-lavender)' }}>audio-visual</strong>{' '}
                stimuli. Press{' '}
                <strong style={{ color: 'var(--text-primary)' }}>Spacebar</strong> or tap{' '}
                <strong style={{ color: 'var(--text-primary)' }}>Match</strong> when the
                current letter matches the one from <em>N</em> steps ago.
              </p>

              {/* N-level pill selector */}
              <label
                className="mb-3 text-xs font-accent tracking-[0.18em] uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
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

              {/* Start button */}
              <button
                onClick={startGame}
                className="w-full rounded-full py-3.5 text-sm font-accent font-medium tracking-[0.12em] uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'var(--accent-blue)',
                  color: 'var(--cta-button-text)',
                }}
              >
                Start {n}-Back
              </button>
            </div>
          )}

          {/* ── Playing Screen ── */}
          {gameState === 'playing' && (
            <div className="flex flex-col items-center">
              {/* Stats row */}
              <div
                className="mb-8 flex w-full justify-between text-xs font-accent tracking-[0.15em] uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>{currentIndex + 1} / {maxTrials}</span>
                <span>{n}-back</span>
                <span>{score} correct</span>
              </div>

              {/* Letter display */}
              <div
                className="mb-8 flex h-32 w-32 items-center justify-center rounded-2xl transition-all duration-300"
                style={{
                  background: feedback === 'correct'
                    ? 'rgba(34, 197, 94, 0.12)'
                    : feedback === 'incorrect'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'var(--surface)',
                  border: `1px solid ${
                    feedback === 'correct'
                      ? 'rgba(34, 197, 94, 0.35)'
                      : feedback === 'incorrect'
                      ? 'rgba(239, 68, 68, 0.35)'
                      : 'var(--surface-border)'
                  }`,
                }}
              >
                <span
                  className="font-display text-6xl"
                  style={{ color: 'var(--text-primary)' }}
                  key={currentIndex}
                >
                  {sequence[currentIndex]}
                </span>
              </div>

              {/* Match button */}
              <button
                onClick={handleMatch}
                className="w-full rounded-full py-3.5 text-sm font-accent font-medium tracking-[0.12em] uppercase transition-all duration-150 active:scale-[0.97]"
                style={{
                  background: 'color-mix(in srgb, var(--accent-lavender) 15%, var(--surface))',
                  border: '1px solid color-mix(in srgb, var(--accent-lavender) 30%, var(--surface-border))',
                  color: 'var(--text-primary)',
                }}
              >
                Match (Spacebar)
              </button>

              <p
                className="mt-4 text-xs text-center"
                style={{ color: 'var(--text-secondary)', opacity: 0.6 }}
              >
                Does this letter match {n} step{n > 1 ? 's' : ''} ago?
              </p>
            </div>
          )}

          {/* ── End Screen ── */}
          {gameState === 'end' && (
            <div className="flex flex-col items-center">
              <h3
                className="mb-6 font-display text-2xl"
                style={{ color: 'var(--text-primary)' }}
              >
                Task Complete
              </h3>

              {/* Score display */}
              <div
                className="mb-6 flex h-28 w-28 flex-col items-center justify-center rounded-full"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-border)',
                }}
              >
                <span className="font-display text-4xl" style={{ color: 'var(--text-primary)' }}>
                  {score}
                </span>
                <span
                  className="mt-0.5 text-[10px] font-accent tracking-[0.18em] uppercase"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  matches
                </span>
              </div>

              <p
                className="mb-8 max-w-xs text-center text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Working memory tested at{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{n}-back</strong> across{' '}
                {maxTrials} trials.
              </p>

              {/* Action buttons */}
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setGameState('start')}
                  className="flex-1 rounded-full py-3 text-sm font-accent tracking-[0.1em] uppercase transition-all duration-200"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Settings
                </button>
                <button
                  onClick={startGame}
                  className="flex-1 rounded-full py-3 text-sm font-accent tracking-[0.1em] uppercase transition-all duration-200"
                  style={{
                    background: 'var(--accent-blue)',
                    color: 'var(--cta-button-text)',
                  }}
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
