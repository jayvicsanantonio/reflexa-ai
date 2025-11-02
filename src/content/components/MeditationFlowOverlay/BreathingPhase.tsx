/**
 * Breathing Phase Component (Step 0)
 * Displays meditation breathing animation and loading state
 */

import React, { useEffect } from 'react';
import { LotusOrb } from '../LotusOrb';
import type { Settings } from '../../../types';

interface BreathingPhaseProps {
  isLoadingSummary: boolean;
  settings: Settings;
  breathCue: 'inhale' | 'hold' | 'exhale';
  setBreathCue: (cue: 'inhale' | 'hold' | 'exhale') => void;
  currentPhraseIndex: number;
  setCurrentPhraseIndex: (index: number | ((prev: number) => number)) => void;
}

// Meditative phrases that rotate during loading
const MEDITATIVE_PHRASES = [
  'Crafting your insights...',
  'Take a deep breath...',
  'Let your mind settle...',
  'Finding clarity in the moment...',
  'Gathering your thoughts...',
  'Embracing the present...',
  'Breathing in calm...',
  'Releasing tension...',
  'Centering your awareness...',
  'Cultivating stillness...',
  'Honoring this pause...',
  'Welcoming tranquility...',
  'Grounding in the now...',
  'Softening into ease...',
  'Discovering inner peace...',
  'Nurturing mindfulness...',
  'Flowing with patience...',
  'Resting in awareness...',
  'Opening to insight...',
  'Trusting the process...',
];

export const BreathingPhase: React.FC<BreathingPhaseProps> = ({
  isLoadingSummary,
  settings,
  breathCue,
  setBreathCue,
  currentPhraseIndex,
  setCurrentPhraseIndex,
}) => {
  // Rotate meditative phrases during loading
  useEffect(() => {
    if (!isLoadingSummary) return;

    const interval = setInterval(() => {
      setCurrentPhraseIndex(
        (prev: number) => (prev + 1) % MEDITATIVE_PHRASES.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoadingSummary, setCurrentPhraseIndex]);

  // Breathing cue animation (inhale, hold, exhale cycle)
  useEffect(() => {
    if (isLoadingSummary) return;

    const cycle = () => {
      setBreathCue('inhale');
      setTimeout(() => setBreathCue('hold'), 3000);
      setTimeout(() => setBreathCue('exhale'), 5000);
      setTimeout(() => setBreathCue('inhale'), 7000);
    };

    cycle();
    const interval = setInterval(cycle, 8000);

    return () => clearInterval(interval);
  }, [isLoadingSummary, setBreathCue]);

  return (
    <div className="reflexa-meditation-fade">
      <div style={{ marginBottom: 60 }}>
        <LotusOrb
          enabled={!settings?.reduceMotion}
          duration={8}
          iterations={isLoadingSummary ? Infinity : 2}
          size={200}
        />
      </div>
      <h1
        style={{
          fontSize: 28,
          margin: 0,
          fontWeight: 800,
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        {isLoadingSummary
          ? MEDITATIVE_PHRASES[currentPhraseIndex]
          : 'Find your breath'}
      </h1>
      {!isLoadingSummary && (
        <p
          style={{
            marginTop: 12,
            color: '#cbd5e1',
            fontSize: 16,
          }}
        >
          {breathCue === 'inhale' && 'Inhale…'}
          {breathCue === 'exhale' && 'Exhale…'}
        </p>
      )}
    </div>
  );
};
