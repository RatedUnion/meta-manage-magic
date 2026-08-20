import { useCallback, useEffect, useRef, useState } from "react";
import { Music, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dua.lofi.enabled";

/** Warm jazzy chord voicings (Hz), looped as a slow lofi progression. */
const PROGRESSION: number[][] = [
  [174.61, 220.0, 261.63, 329.63], // Fmaj9-ish
  [130.81, 196.0, 246.94, 329.63], // Cmaj7
  [146.83, 220.0, 261.63, 349.23], // Dm7
  [196.0, 246.94, 293.66, 392.0], // G7sus
];

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  stop: () => void;
};

function buildEngine(): Engine {
  const Ctor: typeof AudioContext =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctor();

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Soft lofi tape filter
  const tape = ctx.createBiquadFilter();
  tape.type = "lowpass";
  tape.frequency.value = 1800;
  tape.Q.value = 0.6;
  tape.connect(master);

  // Vinyl crackle bed
  const noiseLen = 2 * ctx.sampleRate;
  const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    nd[i] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.7 : (Math.random() * 2 - 1) * 0.02;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.06;
  const noiseHp = ctx.createBiquadFilter();
  noiseHp.type = "highpass";
  noiseHp.frequency.value = 900;
  noise.connect(noiseHp).connect(noiseGain).connect(master);
  noise.start();

  const bpm = 72;
  const beat = 60 / bpm;
  const bar = beat * 4;

  const playChord = (freqs: number[], at: number) => {
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "triangle" : "sine";
      osc.frequency.value = f;
      // subtle tape wobble
      osc.detune.setValueAtTime(-6 + Math.random() * 12, at);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.09 / (i + 1), at + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0008, at + bar * 0.95);
      osc.connect(g).connect(tape);
      osc.start(at);
      osc.stop(at + bar);
    });
  };

  const playKick = (at: number) => {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(120, at);
    osc.frequency.exponentialRampToValueAtTime(45, at + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.28, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.28);
    osc.connect(g).connect(master);
    osc.start(at);
    osc.stop(at + 0.3);
  };

  const playHat = (at: number) => {
    const len = Math.floor(0.05 * ctx.sampleRate);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    src.connect(hp).connect(g).connect(master);
    src.start(at);
  };

  let barIndex = 0;
  let nextTime = ctx.currentTime + 0.15;

  const scheduler = window.setInterval(() => {
    while (nextTime < ctx.currentTime + 1.5) {
      const chord = PROGRESSION[barIndex % PROGRESSION.length]!;
      playChord(chord, nextTime);
      playKick(nextTime);
      playKick(nextTime + beat * 2.5);
      for (let b = 0; b < 4; b++) playHat(nextTime + beat * b + beat / 2);
      nextTime += bar;
      barIndex++;
    }
  }, 250);

  return {
    ctx,
    master,
    stop: () => {
      window.clearInterval(scheduler);
      try {
        noise.stop();
      } catch {
        /* already stopped */
      }
      void ctx.close();
    },
  };
}

export function LofiPlayer() {
  const engineRef = useRef<Engine | null>(null);
  const [playing, setPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  const start = useCallback(() => {
    if (engineRef.current) {
      void engineRef.current.ctx.resume();
    } else {
      engineRef.current = buildEngine();
    }
    const eng = engineRef.current;
    eng.master.gain.cancelScheduledValues(eng.ctx.currentTime);
    eng.master.gain.setValueAtTime(eng.master.gain.value, eng.ctx.currentTime);
    eng.master.gain.linearRampToValueAtTime(0.5, eng.ctx.currentTime + 2.5);
    setPlaying(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const stop = useCallback(() => {
    const eng = engineRef.current;
    if (eng) {
      eng.master.gain.cancelScheduledValues(eng.ctx.currentTime);
      eng.master.gain.setValueAtTime(eng.master.gain.value, eng.ctx.currentTime);
      eng.master.gain.linearRampToValueAtTime(0, eng.ctx.currentTime + 0.6);
      window.setTimeout(() => void eng.ctx.suspend(), 700);
    }
    setPlaying(false);
    try {
      localStorage.setItem(STORAGE_KEY, "0");
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Autostart on the visitor's first interaction (browsers block silent autoplay).
  useEffect(() => {
    if (!mounted) return;
    let optedOut = false;
    try {
      optedOut = localStorage.getItem(STORAGE_KEY) === "0";
    } catch {
      /* storage unavailable */
    }
    if (optedOut) return;

    const kick = () => {
      start();
      remove();
    };
    const remove = () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("touchstart", kick);
    };
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    window.addEventListener("scroll", kick, { once: true, passive: true });
    window.addEventListener("touchstart", kick, { once: true, passive: true });
    return remove;
  }, [mounted, start]);

  useEffect(() => () => engineRef.current?.stop(), []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-3 py-2 shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={playing ? stop : start}
        aria-label={playing ? "Pause lofi beats" : "Play lofi beats"}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Music className="h-4 w-4" />}
      </button>
      <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
        {playing ? "Lofi beats" : "Lofi off"}
      </span>
      <span className={cn("text-muted-foreground", playing ? "opacity-100" : "opacity-50")}>
        {playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </span>
    </div>
  );
}
