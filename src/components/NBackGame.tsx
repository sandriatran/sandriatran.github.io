/**
 * ============================================================================
 * DUAL N-BACK GAME
 * ============================================================================
 *
 * WHAT IS DUAL N-BACK?
 * --------------------
 * A cognitive training exercise that challenges working memory by asking
 * the player to track TWO independent streams of stimuli simultaneously:
 *
 *   1. POSITION — A square lights up on a 3x3 grid each trial.
 *   2. AUDIO    — A letter is spoken aloud each trial.
 *
 * The player must signal when EITHER stream matches the stimulus from
 * N steps ago. For example, in 2-back:
 *
 *   Trial 1: position=top-left,    letter=K
 *   Trial 2: position=center,      letter=M
 *   Trial 3: position=top-left,    letter=R   ← POSITION MATCH (same as trial 1)
 *   Trial 4: position=bottom-right, letter=M  ← AUDIO MATCH (same as trial 2)
 *
 * The two streams are INDEPENDENT — a position match can happen without
 * an audio match, or both can match simultaneously (a "double").
 *
 * WHY THESE SPECIFIC LETTERS?
 * ---------------------------
 * We use a phonetically distinct subset: C, D, H, K, M, N, P, Q, R, S, T, W.
 * These were chosen because they DON'T sound alike when spoken by TTS.
 * Letters like B/D/E/G/P/T/V/Z are too similar phonetically and cause
 * false confusion that isn't about working memory — it's about hearing.
 *
 * SEQUENCE GENERATION
 * -------------------
 * Each trial's position and letter are generated independently:
 *   - 30% chance of being a deliberate match with N steps ago
 *   - 70% chance of being random
 * This means ~30% of trials have a position match, ~30% have an audio
 * match, and ~9% have both (0.3 × 0.3). These probabilities create a
 * good balance: enough matches to stay engaged, few enough to be challenging.
 *
 * SCORING
 * -------
 * Position and audio are scored independently. A correct response means:
 *   - You pressed the match button AND the stimulus actually matched N back
 * An incorrect response means:
 *   - You pressed match but it DIDN'T match (false positive)
 * Note: we don't currently penalize MISSED matches (false negatives).
 * A full implementation would track hits, misses, false alarms, and
 * correct rejections for a d-prime (d') sensitivity score.
 *
 * CONTROLS
 * --------
 * A key → "I think the POSITION matches N steps ago"
 * L key → "I think the AUDIO (letter) matches N steps ago"
 * These keys are on opposite sides of the keyboard for ergonomic
 * separation — left hand for position, right hand for audio.
 *
 * TIMING
 * ------
 * Each trial lasts 3 seconds. This is longer than typical single n-back
 * (2-2.5s) because dual-stream tracking requires more processing time.
 * The player can respond at any point during the 3-second window.
 *
 * OPENING THE GAME
 * ----------------
 * This is a hidden easter egg. Press E anywhere on the site to open it.
 * The Hero.astro keyboard handler dispatches a 'open-nback' custom event
 * which this component listens for.
 *
 * VOICE (TEXT-TO-SPEECH)
 * ----------------------
 * Uses the Web Speech API (SpeechSynthesisUtterance). We try to pick the
 * best available English voice on the user's system. Voices load
 * asynchronously in some browsers (especially Chrome), so we listen for
 * the 'voiceschanged' event to update our selection.
 *
 * For higher quality audio, replace speakLetter() with pre-recorded
 * .mp3 files generated via ElevenLabs or similar. Drop them in
 * /public/audio/C.mp3, /public/audio/D.mp3, etc. and use:
 *   new Audio(`/audio/${letter}.mp3`).play()
 *
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ── CONSTANTS ──────────────────────────────────────────────────────────────────

/**
 * Phonetically distinct letters — chosen to avoid TTS confusion.
 * Excluded: A (sounds like "ay"), B/D/E/G/P/T/V/Z (too similar),
 * F/L/X (ambiguous in some TTS voices), I/O/U/Y (vowels blur together).
 */
const LETTERS = 'CDHKMNPQRSTW'.split('');

/** Available N-back levels. 8 is near human limits for dual n-back. */
const N_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

/** 3x3 grid = 9 cells, indexed 0-8 (left-to-right, top-to-bottom). */
const GRID_SIZE = 9;

/**
 * How long each trial lasts in milliseconds.
 * 3000ms = 3 seconds per trial. Adjust this to make the game
 * easier (longer) or harder (shorter).
 */
const TRIAL_DURATION_MS = 3000;

/**
 * Probability that a trial will be a deliberate match with N steps ago.
 * 0.3 = 30% chance. Higher = more matches = easier to detect but more
 * false alarms. Lower = fewer matches = harder to stay alert.
 */
const MATCH_PROBABILITY = 0.3;

/**
 * Base number of trials per game. The actual count is BASE + N,
 * so higher N levels get slightly more trials (since the first N
 * trials can never have a match — they have no N-back reference).
 */
const BASE_TRIALS = 20;


// ── TYPES ──────────────────────────────────────────────────────────────────────

/**
 * A single trial in the sequence. Each trial has:
 * - position: which cell (0-8) lights up on the 3x3 grid
 * - letter: which letter is spoken aloud
 */
interface Trial {
  position: number;
  letter: string;
}

/** The three phases of the game. */
type GameState = 'start' | 'playing' | 'end';

/** Feedback shown after the player presses a match button. */
type Feedback = 'correct' | 'incorrect' | null;


// ── VOICE SELECTION ────────────────────────────────────────────────────────────

/**
 * Pick the best available English voice from the system.
 *
 * Strategy:
 * 1. Prefer a LOCAL English voice (sounds better, no network dependency)
 * 2. Fall back to ANY English voice
 * 3. Fall back to null (uses browser default)
 *
 * On macOS: typically selects "Samantha" or "Karen"
 * On Chrome: typically selects "Google UK English Female"
 * On Windows: typically selects "Microsoft Zira"
 */
function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();

  // Prefer local (offline) English voice — faster and often higher quality
  const localEnglish = voices.find(v => v.lang.startsWith('en') && v.localService);
  if (localEnglish) return localEnglish;

  // Fall back to any English voice (may be network-based)
  const anyEnglish = voices.find(v => v.lang.startsWith('en'));
  if (anyEnglish) return anyEnglish;

  // No English voice found — return null, browser will use its default
  return null;
}


// ── COMPONENT ──────────────────────────────────────────────────────────────────

export default function NBackGame() {

  // ── STATE ──────────────────────────────────────────────────────────────────

  /** Is the game modal visible? */
  const [isOpen, setIsOpen] = useState(false);

  /** Current N-back level (how many steps back to compare). */
  const [n, setN] = useState(2);

  /** Current phase: start screen, playing, or results screen. */
  const [gameState, setGameState] = useState<GameState>('start');

  /** The full pre-generated sequence of trials for this game. */
  const [sequence, setSequence] = useState<Trial[]>([]);

  /** Which trial we're currently on (0-indexed). */
  const [currentIndex, setCurrentIndex] = useState(0);

  /** Running score for position matches. */
  const [posScore, setPosScore] = useState(0);

  /** Running score for audio matches. */
  const [audioScore, setAudioScore] = useState(0);

  /** Visual feedback for position match button (green/red flash). */
  const [posFeedback, setPosFeedback] = useState<Feedback>(null);

  /** Visual feedback for audio match button (green/red flash). */
  const [audioFeedback, setAudioFeedback] = useState<Feedback>(null);

  /** Total number of trials in this game. */
  const maxTrials = BASE_TRIALS + n;


  // ── REFS (values that persist across renders without causing re-renders) ───

  /** Reference to the interval timer that advances trials. */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Has the player already pressed the position match button this trial? */
  const posResponded = useRef(false);

  /** Has the player already pressed the audio match button this trial? */
  const audioResponded = useRef(false);

  /** Cached reference to the selected TTS voice. */
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);


  // ── VOICE INITIALIZATION ──────────────────────────────────────────────────

  /**
   * Load the best available TTS voice.
   *
   * Why useEffect? Voices load asynchronously in Chrome — they're not
   * available immediately on page load. The 'voiceschanged' event fires
   * when voices become available, so we listen for it and update our
   * cached voice reference.
   */
  useEffect(() => {
    const loadVoices = () => {
      voiceRef.current = getPreferredVoice();
    };

    // Try loading immediately (works in Firefox/Safari)
    loadVoices();

    // Also listen for async voice loading (needed in Chrome)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }
  }, []);


  // ── SPEAK A LETTER ────────────────────────────────────────────────────────

  /**
   * Speak a single letter using the Web Speech API.
   *
   * To replace with pre-recorded audio (e.g., from ElevenLabs):
   *   1. Generate .mp3 files for each letter
   *   2. Save to /public/audio/C.mp3, /public/audio/D.mp3, etc.
   *   3. Replace this function body with:
   *      const audio = new Audio(`/audio/${letter}.mp3`);
   *      audio.play();
   */
  const speakLetter = (letter: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.rate = 1.0;   // Normal speed (0.1 to 10, default 1)
    utterance.pitch = 1.0;  // Normal pitch (0 to 2, default 1)

    // Use our preferred voice if available
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }

    // Cancel any currently speaking utterance before starting the new one
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };


  // ── OPEN/CLOSE THE GAME ──────────────────────────────────────────────────

  /**
   * Listen for the 'open-nback' custom event dispatched by the keyboard
   * handler in Hero.astro when the user presses E.
   */
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-nback', handleOpen as EventListener);
    return () => window.removeEventListener('open-nback', handleOpen as EventListener);
  }, []);

  /**
   * Close the game: hide modal, reset state, stop TTS, clear timer.
   */
  const closeGame = useCallback(() => {
    setIsOpen(false);
    setGameState('start');

    // Stop any letter being spoken
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Stop the trial timer
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  /**
   * Close on Escape key.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeGame]);


  // ── SEQUENCE GENERATION ───────────────────────────────────────────────────

  /**
   * Generate a new sequence and start the game.
   *
   * The sequence is pre-generated (not real-time) so we can control
   * match probability precisely. Each trial independently decides
   * whether to create a position match and/or audio match.
   *
   * For the first N trials, no matches are possible (there's nothing
   * N steps back to compare to), so they're always random.
   */
  const startGame = () => {
    const newSeq: Trial[] = [];

    for (let i = 0; i < maxTrials; i++) {
      // Can only create a match if we have N previous trials to reference
      const canMatch = i >= n;

      // Independently decide if this trial should match N steps back
      const shouldMatchPosition = canMatch && Math.random() < MATCH_PROBABILITY;
      const shouldMatchAudio = canMatch && Math.random() < MATCH_PROBABILITY;

      newSeq.push({
        // If matching: copy the position from N steps ago
        // If not: pick a random grid cell (0 through 8)
        position: shouldMatchPosition
          ? newSeq[i - n].position
          : Math.floor(Math.random() * GRID_SIZE),

        // If matching: copy the letter from N steps ago
        // If not: pick a random letter from our phonetically distinct set
        letter: shouldMatchAudio
          ? newSeq[i - n].letter
          : LETTERS[Math.floor(Math.random() * LETTERS.length)],
      });
    }

    // Reset all game state
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


  // ── TRIAL ADVANCEMENT ─────────────────────────────────────────────────────

  /**
   * Advance to the next trial. Called every TRIAL_DURATION_MS by setInterval.
   *
   * If we've reached the last trial, end the game instead.
   * Reset feedback and response flags for the new trial.
   */
  const nextTurn = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= maxTrials - 1) {
        setGameState('end');
        return prev; // Don't increment past the end
      }
      return prev + 1;
    });

    // Clear visual feedback from previous trial
    setPosFeedback(null);
    setAudioFeedback(null);

    // Allow the player to respond again in the new trial
    posResponded.current = false;
    audioResponded.current = false;
  }, [maxTrials]);

  /**
   * Start/stop the trial timer based on game state.
   *
   * When playing: advance every 3 seconds.
   * When not playing: clear the interval.
   * Cleanup: always clear on unmount to prevent memory leaks.
   */
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(nextTurn, TRIAL_DURATION_MS);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, nextTurn]);

  /**
   * Speak the current letter whenever the trial index changes.
   * This fires on every new trial during gameplay.
   */
  useEffect(() => {
    if (gameState === 'playing' && sequence[currentIndex]) {
      speakLetter(sequence[currentIndex].letter);
    }
  }, [currentIndex, gameState, sequence]);


  // ── MATCH HANDLERS ────────────────────────────────────────────────────────

  /**
   * Player signals a POSITION match.
   *
   * Check: does the current trial's position equal the position from
   * N trials ago? If yes → correct. If no → incorrect.
   *
   * The posResponded ref prevents double-counting if the player
   * mashes the button. Only the first press per trial counts.
   */
  const handlePosMatch = useCallback(() => {
    // Guard: not playing, or already responded this trial
    if (gameState !== 'playing' || posResponded.current) return;
    posResponded.current = true;

    // Compare current position with the position N steps ago
    const isMatch = currentIndex >= n
      && sequence[currentIndex].position === sequence[currentIndex - n].position;

    if (isMatch) {
      setPosScore((s) => s + 1);
      setPosFeedback('correct');   // Green flash
    } else {
      setPosFeedback('incorrect'); // Red flash
    }
  }, [gameState, sequence, currentIndex, n]);

  /**
   * Player signals an AUDIO match.
   *
   * Same logic as position match, but comparing letters instead.
   */
  const handleAudioMatch = useCallback(() => {
    if (gameState !== 'playing' || audioResponded.current) return;
    audioResponded.current = true;

    const isMatch = currentIndex >= n
      && sequence[currentIndex].letter === sequence[currentIndex - n].letter;

    if (isMatch) {
      setAudioScore((s) => s + 1);
      setAudioFeedback('correct');
    } else {
      setAudioFeedback('incorrect');
    }
  }, [gameState, sequence, currentIndex, n]);

  /**
   * Keyboard controls during gameplay.
   *
   * A key → position match (left hand, left side of keyboard)
   * L key → audio match (right hand, right side of keyboard)
   *
   * This separation lets you use both hands independently,
   * which is important for dual n-back since both matches
   * can happen simultaneously.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handlePosMatch();
      }
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleAudioMatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handlePosMatch, handleAudioMatch]);


  // ── RENDER GUARDS ─────────────────────────────────────────────────────────

  /** Don't render anything if the game isn't open. */
  if (!isOpen) return null;


  // ── DERIVED VALUES (computed from state, not stored separately) ────────────

  /** Progress bar width as a percentage (0-100). */
  const progress = gameState === 'playing'
    ? ((currentIndex + 1) / maxTrials) * 100
    : 0;

  /** The current trial's data (position + letter). */
  const currentTrial = sequence[currentIndex];

  /** Combined score for display. */
  const totalScore = posScore + audioScore;

  /**
   * Helper: returns a CSS color string for feedback states.
   * Green for correct, red for incorrect, transparent for neutral.
   */
  const feedbackColor = (fb: Feedback) =>
    fb === 'correct'
      ? 'rgba(34, 197, 94, 0.5)'    // Green
      : fb === 'incorrect'
      ? 'rgba(239, 68, 68, 0.5)'    // Red
      : 'transparent';


  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    /* ── BACKDROP — Blurred overlay behind the modal ── */
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-5"
      style={{
        background: 'var(--overlay-backdrop)',
        backdropFilter: 'blur(16px)',
      }}
      onClick={(e) => {
        // Close when clicking the backdrop (not the modal itself)
        if (e.target === e.currentTarget) closeGame();
      }}
    >
      {/* ── MODAL CONTAINER ── */}
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

        {/* ── PROGRESS BAR — Thin gradient line at top during gameplay ── */}
        {gameState === 'playing' && (
          <div
            className="absolute top-0 left-0 h-[2px] transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-lavender))',
            }}
          />
        )}

        {/* ── CLOSE BUTTON — Always visible, top-right ── */}
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

        {/* ── CONTENT AREA ── */}
        <div className="px-8 pb-8 pt-10 sm:px-10 sm:pb-10 sm:pt-12">

          {/* ══════════════════════════════════════════════════════════════
              START SCREEN — Level selection and instructions
              ══════════════════════════════════════════════════════════════ */}
          {gameState === 'start' && (
            <div className="flex flex-col items-center">

              {/* Title */}
              <h2 className="mb-1.5 font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
                Dual N-Back
              </h2>

              {/* Decorative gradient underline */}
              <div
                className="mb-6 h-[2px] w-10"
                style={{ background: 'linear-gradient(90deg, transparent, var(--accent-lavender), transparent)' }}
              />

              {/* Instructions */}
              <p className="mb-6 max-w-sm text-center text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                A cognitive training exercise designed to boost{' '}
                <strong style={{ color: 'var(--accent-lavender)' }}>working memory</strong>.
                Track <strong style={{ color: 'var(--text-primary)' }}>two streams</strong> simultaneously:
                the <strong style={{ color: 'var(--accent-blue)' }}>position</strong> on a 3×3 grid and the{' '}
                <strong style={{ color: 'var(--accent-pink)' }}>spoken letter</strong>.
                Signal a match when either repeats from{' '}
                <em style={{ color: 'var(--accent-lavender)' }}>N</em> steps ago.
              </p>

              {/* Control legend — shows keyboard shortcuts */}
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

              {/* N-level selector — numbered pills, tap to select */}
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

              {/* Start button */}
              <button
                onClick={startGame}
                className="w-full rounded-full py-3.5 text-sm font-accent font-medium tracking-[0.12em] uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'var(--accent-blue)', color: 'var(--cta-button-text)' }}
              >
                Start {n}-Back
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              PLAYING SCREEN — Grid, letter, and match buttons
              ══════════════════════════════════════════════════════════════ */}
          {gameState === 'playing' && currentTrial && (
            <div className="flex flex-col items-center">

              {/* Stats row — trial count, n-level, running score */}
              <div
                className="mb-6 flex w-full justify-between text-xs font-accent tracking-[0.15em] uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>{currentIndex + 1} / {maxTrials}</span>
                <span>{n}-back</span>
                <span>{totalScore} correct</span>
              </div>

              {/* ── 3×3 POSITION GRID ──
                  9 cells arranged in a 3×3 grid. The active cell (matching
                  currentTrial.position) lights up in accent-blue with a
                  glow effect. All other cells are neutral. */}
              <div
                className="mb-6 grid grid-cols-3 gap-1.5"
                style={{ width: '180px', height: '180px' }}
              >
                {Array.from({ length: GRID_SIZE }).map((_, cellIndex) => {
                  const isActive = currentTrial.position === cellIndex;
                  return (
                    <div
                      key={cellIndex}
                      className="rounded-lg transition-all duration-200"
                      style={{
                        background: isActive ? 'var(--accent-blue)' : 'var(--surface)',
                        border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--surface-border)'}`,
                        boxShadow: isActive
                          ? '0 0 16px color-mix(in srgb, var(--accent-blue) 40%, transparent)'
                          : 'none',
                      }}
                    />
                  );
                })}
              </div>

              {/* ── CURRENT LETTER ──
                  Displayed visually AND spoken via TTS. The `key` prop
                  forces React to remount this element on each trial,
                  which could be used for entrance animations. */}
              <div className="mb-6 text-center">
                <span
                  className="font-display text-4xl"
                  style={{ color: 'var(--text-primary)' }}
                  key={currentIndex}
                >
                  {currentTrial.letter}
                </span>
              </div>

              {/* ── MATCH BUTTONS ──
                  Two independent buttons. Each flashes green (correct)
                  or red (incorrect) when pressed. The feedback color
                  resets when the next trial begins. */}
              <div className="flex w-full gap-3">
                {/* Position match button (left hand / A key) */}
                <button
                  onClick={handlePosMatch}
                  className="flex-1 rounded-xl py-3 text-sm font-accent font-medium tracking-[0.1em] uppercase transition-all duration-150 active:scale-[0.97]"
                  style={{
                    background: posFeedback ? feedbackColor(posFeedback) : 'var(--surface)',
                    border: `1px solid ${
                      posFeedback === 'correct' ? 'rgba(34,197,94,0.4)'
                      : posFeedback === 'incorrect' ? 'rgba(239,68,68,0.4)'
                      : 'var(--surface-border)'
                    }`,
                    color: 'var(--text-primary)',
                  }}
                >
                  <kbd className="mr-1.5 font-mono text-xs" style={{ color: 'var(--accent-blue)' }}>A</kbd>
                  Position
                </button>

                {/* Audio match button (right hand / L key) */}
                <button
                  onClick={handleAudioMatch}
                  className="flex-1 rounded-xl py-3 text-sm font-accent font-medium tracking-[0.1em] uppercase transition-all duration-150 active:scale-[0.97]"
                  style={{
                    background: audioFeedback ? feedbackColor(audioFeedback) : 'var(--surface)',
                    border: `1px solid ${
                      audioFeedback === 'correct' ? 'rgba(34,197,94,0.4)'
                      : audioFeedback === 'incorrect' ? 'rgba(239,68,68,0.4)'
                      : 'var(--surface-border)'
                    }`,
                    color: 'var(--text-primary)',
                  }}
                >
                  Audio
                  <kbd className="ml-1.5 font-mono text-xs" style={{ color: 'var(--accent-pink)' }}>L</kbd>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              END SCREEN — Results and replay options
              ══════════════════════════════════════════════════════════════ */}
          {gameState === 'end' && (
            <div className="flex flex-col items-center">

              <h3 className="mb-6 font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
                Session Complete
              </h3>

              {/* Score cards — position and audio scores shown separately */}
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

              {/* Summary text */}
              <p className="mb-8 max-w-xs text-center text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Working memory tested at{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{n}-back</strong> across{' '}
                {maxTrials} trials with dual-stream tracking.
              </p>

              {/* Action buttons — go back to settings or retry immediately */}
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
