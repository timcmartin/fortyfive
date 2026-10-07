import { useCallback, useEffect, useRef, useState } from "react";
import { Hand, Minus, Play, Plus, Square } from "lucide-react";

const MIN_BPM = 30;
const MAX_BPM = 300;
const BEATS_PER_MEASURE = 4;

function getPlayableBpm(value) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value >= MIN_BPM && value <= MAX_BPM ? value : null;
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const bpm = Number(value);
    return bpm >= MIN_BPM && bpm <= MAX_BPM ? bpm : null;
  }
  return null;
}

function createAudioContext() {
  const AudioContextConstructor =
    window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextConstructor) {
    throw new Error("This browser does not support audio playback.");
  }
  return new AudioContextConstructor();
}

export function MetronomeControl({ tempo }) {
  const audioContextRef = useRef(null);
  const tapTimesRef = useRef([]);
  const [bpm, setBpm] = useState(() => String(getPlayableBpm(tempo) ?? ""));
  const [isRunning, setIsRunning] = useState(false);
  const [activeBeat, setActiveBeat] = useState(0);
  const [audioError, setAudioError] = useState(null);
  const parsedBpm = /^\d+$/.test(bpm) ? Number(bpm) : null;
  const playableBpm =
    parsedBpm >= MIN_BPM && parsedBpm <= MAX_BPM ? parsedBpm : null;

  const closeAudioContext = useCallback(() => {
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== "closed") {
      void context.close();
    }
  }, []);

  useEffect(() => {
    if (!isRunning || !playableBpm || !audioContextRef.current) return undefined;

    const context = audioContextRef.current;
    const oscillators = new Set();
    let beat = 0;
    let nextBeatTime = context.currentTime + 0.05;
    const timers = new Set();

    const scheduleBeat = (when, beatNumber) => {
      const accent = beatNumber === 1;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = accent ? 880 : 660;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(accent ? 0.22 : 0.13, when + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.055);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => oscillators.delete(oscillator);
      oscillators.add(oscillator);
      oscillator.start(when);
      oscillator.stop(when + 0.06);

      const timer = window.setTimeout(() => {
        timers.delete(timer);
        setActiveBeat(beatNumber);
      }, Math.max(0, (when - context.currentTime) * 1000));
      timers.add(timer);
    };

    const scheduleAhead = () => {
      while (nextBeatTime < context.currentTime + 0.1) {
        beat = (beat % BEATS_PER_MEASURE) + 1;
        scheduleBeat(nextBeatTime, beat);
        nextBeatTime += 60 / playableBpm;
      }
    };

    scheduleAhead();
    const interval = window.setInterval(scheduleAhead, 25);
    return () => {
      window.clearInterval(interval);
      timers.forEach(window.clearTimeout);
      oscillators.forEach((oscillator) => oscillator.stop());
      if (audioContextRef.current === context) closeAudioContext();
    };
  }, [closeAudioContext, isRunning, playableBpm]);

  useEffect(
    () => () => {
      closeAudioContext();
    },
    [closeAudioContext],
  );

  const handleStart = async () => {
    setAudioError(null);
    if (!playableBpm) {
      setAudioError(`Enter a whole-number tempo from ${MIN_BPM} to ${MAX_BPM} BPM.`);
      return;
    }

    try {
      const context = createAudioContext();
      audioContextRef.current = context;
      await context.resume();
      setActiveBeat(0);
      setIsRunning(true);
    } catch (error) {
      closeAudioContext();
      setAudioError(error.message);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setActiveBeat(0);
  };

  const handleBpmChange = (event) => {
    setBpm(event.target.value);
    setIsRunning(false);
    setActiveBeat(0);
    setAudioError(null);
  };

  const adjustBpm = (amount) => {
    const currentBpm = playableBpm ?? 120;
    const nextBpm = Math.min(
      MAX_BPM,
      Math.max(MIN_BPM, currentBpm + amount),
    );
    setBpm(String(nextBpm));
    setIsRunning(false);
    setActiveBeat(0);
    setAudioError(null);
  };

  const handleTapTempo = () => {
    const now = performance.now();
    setIsRunning(false);
    setActiveBeat(0);
    const recentTaps = tapTimesRef.current.filter((time) => now - time < 2000);
    recentTaps.push(now);
    tapTimesRef.current = recentTaps.slice(-5);
    setAudioError(null);

    if (recentTaps.length < 2) return;

    const intervals = recentTaps
      .slice(1)
      .map((time, index) => time - recentTaps[index]);
    const tappedBpm = Math.round(
      60000 / (intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length),
    );
    if (tappedBpm < MIN_BPM || tappedBpm > MAX_BPM) {
      setAudioError(`Tap a steady tempo from ${MIN_BPM} to ${MAX_BPM} BPM.`);
      return;
    }

    setBpm(String(tappedBpm));
  };

  return (
    <section
      className="rounded-xl border border-base-300 bg-base-100 p-3 sm:p-4"
      aria-label="Metronome"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h3 className="font-semibold">Metronome</h3>
          <p className="text-xs text-base-content/60">
            {tempo
              ? `Catalog tempo: ${tempo}`
              : "No catalog tempo"}
            {getPlayableBpm(tempo) === null && !playableBpm
              ? " · choose a click tempo"
              : ""}
          </p>
        </div>
        <div className="join">
          <button
            type="button"
            className="btn btn-sm join-item"
            aria-label="Decrease tempo by 1 BPM"
            onClick={() => adjustBpm(-1)}
          >
            <Minus className="size-4" />
          </button>
          <input
            className="input input-bordered input-sm join-item w-20 text-center"
            type="number"
            min={MIN_BPM}
            max={MAX_BPM}
            step="1"
            value={bpm}
            aria-label="Metronome tempo in beats per minute"
            onChange={handleBpmChange}
          />
          <button
            type="button"
            className="btn btn-sm join-item"
            aria-label="Increase tempo by 1 BPM"
            onClick={() => adjustBpm(1)}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <span className="text-sm text-base-content/60">BPM</span>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          aria-label="Tap to set tempo"
          onClick={handleTapTempo}
        >
          <Hand className="size-4" />
          Tap
        </button>
        <button
          type="button"
          className={`btn btn-sm ${isRunning ? "btn-error" : "btn-primary"}`}
          onClick={isRunning ? handleStop : handleStart}
        >
          {isRunning ? (
            <>
              <Square className="size-4" />
              Stop
            </>
          ) : (
            <>
              <Play className="size-4" />
              Start
            </>
          )}
        </button>
      </div>
      <div
        className="mt-3 flex items-center gap-2"
        aria-label={`Beat ${activeBeat || "idle"} of ${BEATS_PER_MEASURE}`}
      >
        {Array.from({ length: BEATS_PER_MEASURE }, (_, index) => {
          const beat = index + 1;
          return (
            <span
              key={beat}
              className={`h-2 flex-1 rounded-full ${
                activeBeat === beat ? "bg-primary" : "bg-base-300"
              }`}
              aria-hidden="true"
            />
          );
        })}
        <span className="ml-1 text-xs text-base-content/50">4/4</span>
      </div>
      {audioError && (
        <p className="mt-2 text-sm text-error" role="alert">
          {audioError}
        </p>
      )}
    </section>
  );
}
