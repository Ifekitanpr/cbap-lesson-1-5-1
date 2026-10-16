import { useEffect } from "react";

export function useLessonAudio(enabled) {
  useEffect(() => {
    const play = (event) => {
      if (!enabled || !event.target.closest("button:not(:disabled)")) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(520, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(650, context.currentTime + 0.055);
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.075);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.08);
      oscillator.addEventListener("ended", () => context.close());
    };
    document.addEventListener("pointerdown", play, true);
    return () => document.removeEventListener("pointerdown", play, true);
  }, [enabled]);
}
