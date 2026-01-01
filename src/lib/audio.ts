/**
 * Audio utility for playing procedural sounds using Web Audio API.
 */

export type SoundType = 'default' | 'bell' | 'chime' | 'beep' | 'success';

let sharedCtx: AudioContext | null = null;

/**
 * Initializes or resumes the audio context.
 * Should be called on a user gesture (click/keypress).
 */
export function initAudio() {
  if (typeof window === 'undefined') return;
  if (!sharedCtx) {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (AudioContextClass) sharedCtx = new AudioContextClass();
  }
  if (sharedCtx?.state === 'suspended') {
    sharedCtx.resume();
  }
}

export function playSound(type: SoundType = 'default', volume: number = 0.3, title?: string, body?: string) {
  if (typeof window === 'undefined') return;

  initAudio();
  const ctx = sharedCtx;
  if (!ctx) return;

  // Trigger Desktop Notification if title is provided
  if (title && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }

  const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine', ramp: boolean = true) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(volume, start);
    if (ramp) {
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
    } else {
      gain.gain.setValueAtTime(0, start + duration);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration);
  };

  switch (type) {
    case 'bell':
      // Longer resonant bell sound
      playTone(440, ctx.currentTime, 2.0, 'sine');
      playTone(880, ctx.currentTime, 1.5, 'sine');
      playTone(1320, ctx.currentTime, 1.0, 'sine');
      break;

    case 'chime':
      // A pleasant three-note melody
      playTone(523.25, ctx.currentTime, 0.5, 'sine'); // C5
      playTone(659.25, ctx.currentTime + 0.3, 0.5, 'sine'); // E5
      playTone(783.99, ctx.currentTime + 0.6, 1.0, 'sine'); // G5
      break;

    case 'beep':
      // Short system beep
      playTone(800, ctx.currentTime, 0.1, 'sine');
      break;

    case 'success':
      // Upward success sound
      playTone(440, ctx.currentTime, 0.2, 'triangle');
      playTone(880, ctx.currentTime + 0.1, 0.4, 'triangle');
      break;

    case 'default':
    default:
      // A slightly longer "ping" than a simple beep
      playTone(600, ctx.currentTime, 0.8, 'sine');
      playTone(1200, ctx.currentTime, 0.4, 'sine');
      break;
  }
}


