// Spatial audio engine using Web Audio API for whale events & market feedback
// All sounds are procedurally generated — no audio files needed

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.15; // subtle master volume
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return { ctx: audioCtx, master: masterGain! };
}

/** Deep sonar ping for whale events — pitch varies by score */
export function playWhaleSound(score: number, side: 'long' | 'short') {
  try {
    const { ctx, master } = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Long = lower warm tone, Short = higher tense tone
    const baseFreq = side === 'long' ? 120 : 180;
    const freq = baseFreq + score * 1.5;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(5, now);

    // Volume envelope — gentle attack, slow decay
    const volume = 0.1 + (score / 100) * 0.25;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 1.3);
  } catch {
    // Audio not available
  }
}

/** Shockwave rumble for high-score whale events (score > 70) */
export function playShockwave(score: number) {
  try {
    const { ctx, master } = getAudioContext();
    const now = ctx.currentTime;

    // Sub-bass rumble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(50 + score * 0.3, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.9);

    // Noise burst layer
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }

    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();

    noise.buffer = buffer;
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(200, now);
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);

    noise.start(now);
    noise.stop(now + 0.5);
  } catch {
    // Audio not available
  }
}

/** Subtle ambient tone shift when momentum changes significantly */
let lastMomentumTone = 0;
export function playMomentumShift(momentum: number) {
  const direction = momentum > 0.3 ? 1 : momentum < -0.3 ? -1 : 0;
  if (direction === lastMomentumTone || direction === 0) return;
  lastMomentumTone = direction;

  try {
    const { ctx, master } = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const startFreq = direction > 0 ? 300 : 400;
    const endFreq = direction > 0 ? 500 : 250;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.4);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.7);
  } catch {
    // Audio not available
  }
}

/** Toggle master audio on/off */
export function setAudioEnabled(enabled: boolean) {
  if (masterGain) {
    masterGain.gain.value = enabled ? 0.15 : 0;
  }
}

export function isAudioInitialized() {
  return audioCtx !== null && audioCtx.state === 'running';
}
