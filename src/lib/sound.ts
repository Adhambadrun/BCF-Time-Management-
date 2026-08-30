// Glassy/soft synthetic audio synthesizer using Web Audio API

let audioCtx: AudioContext | null = null;
let currentAlertToneTheme: 'cyber' | 'radar' | 'siren' = 'cyber';

// Load stored preference from localStorage if available in browser
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('break_app_alert_tone');
  if (saved === 'cyber' || saved === 'radar' || saved === 'siren') {
    currentAlertToneTheme = saved;
  }
}

export const setAlertToneTheme = (theme: 'cyber' | 'radar' | 'siren') => {
  currentAlertToneTheme = theme;
  if (typeof window !== 'undefined') {
    localStorage.setItem('break_app_alert_tone', theme);
  }
};

export const getAlertToneTheme = (): 'cyber' | 'radar' | 'siren' => {
  return currentAlertToneTheme;
};

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export type SoundType =
  | 'break_start'
  | 'break_end'
  | 'bonus'
  | 'warning'
  | 'click'
  | 'hover_tick'
  | 'rally'
  | 'message'
  | 'notification'
  | 'heartbeat'
  | 'limit_exceeded'
  | 'overtime_alert'
  | 'floor_alert_non_critical'
  | 'floor_alert_critical';

export const playSound = (
  type: SoundType,
  overrideTheme?: 'cyber' | 'radar' | 'siren'
) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const activeTheme = overrideTheme || currentAlertToneTheme;

    // 1. FLOOR ALERTS (3 Distinct Audio Notification Tones for Supervisors & Floor Alerts)
    if (type === 'floor_alert_non_critical') {
      if (activeTheme === 'radar') {
        // RADAR THEME: Ascending pleasant 3-bell radar chime
        [659.25, 880.0, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.08, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.31);
        });
      } else if (activeTheme === 'siren') {
        // SIREN THEME: Two-tone urgent chirp
        [440, 587.33].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.09, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.16);
        });
      } else {
        // CYBER THEME (Default): Soft dual cyber harmonic glass ping
        [523.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.07, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.26);
        });
      }
      return;
    }

    if (type === 'floor_alert_critical' || type === 'limit_exceeded' || type === 'overtime_alert') {
      if (activeTheme === 'radar') {
        // RADAR CRITICAL: Staccato dual sonar radar ping with rapid decay
        [1560, 1240, 1560].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.11);
          gain.gain.setValueAtTime(0.12, now + idx * 0.11);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.11);
          osc.stop(now + idx * 0.11 + 0.21);
        });
      } else if (activeTheme === 'siren') {
        // SIREN CRITICAL: High-visibility dual frequency sweeping alert pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.12);
        osc.frequency.linearRampToValueAtTime(440, now + 0.24);
        osc.frequency.linearRampToValueAtTime(880, now + 0.36);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.43);
      } else {
        // CYBER CRITICAL: High-priority crisp triple harmonic glass cascade + low sub-bass alert pulse
        const frequencies = [880, 1320, 1760];
        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.08, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.36);
        });

        // Low resonant sub-bass undertone
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(220, now);
        subOsc.frequency.exponentialRampToValueAtTime(110, now + 0.45);
        subGain.gain.setValueAtTime(0.09, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.46);
      }
      return;
    }

    if (type === 'hover_tick') {
      // Crisp 15ms cyber micro-tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.015);
    } else if (type === 'click') {
      // Crisp glass tap (30ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'break_start') {
      // Soft metallic chime (cyan chord, 120ms)
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.03);
        gain.gain.setValueAtTime(0.06, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + 0.25);
      });
    } else if (type === 'break_end') {
      // Warm chime return (gold chord)
      [783.99, 659.25, 523.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.03);
        gain.gain.setValueAtTime(0.06, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + 0.22);
      });
    } else if (type === 'bonus') {
      // Celebratory sparkle sequence
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.09, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.35);
      });
    } else if (type === 'warning') {
      // Gentle warning double pulse (warm low alert)
      [320, 280].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.08, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.09);
      });
    } else if (type === 'rally') {
      // Urgent siren pulse (crimson rally)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.15);
      osc.frequency.linearRampToValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'heartbeat') {
      // Single gentle heartbeat pulse (at 13-15m on break)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } else {
      // Notification / message pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.06);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch {
    // Gracefully ignore audio autoplay restrictions
  }
};
