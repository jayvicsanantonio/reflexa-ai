/**
 * Capability Grid Component
 * Displays all AI capabilities in a grid layout
 */

import React from 'react';
import type { AICapabilities } from '../../../types';
import { StatusCard } from './StatusCard';
import {
  IconList,
  IconPen,
  IconRepeat,
  IconBookCheck,
  IconGlobe,
  IconTranslate,
  IconSpark,
} from './icons';

interface CapabilityGridProps {
  capabilities: AICapabilities | null;
}

export const CapabilityGrid: React.FC<CapabilityGridProps> = ({
  capabilities,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}
    >
      <StatusCard
        label="Summarizer"
        ok={capabilities?.summarizer}
        icon={IconList}
      />
      <StatusCard label="Writer" ok={capabilities?.writer} icon={IconPen} />
      <StatusCard
        label="Rewriter"
        ok={capabilities?.rewriter}
        icon={IconRepeat}
      />
      <StatusCard
        label="Proofreader"
        ok={capabilities?.proofreader}
        icon={IconBookCheck}
      />
      <StatusCard
        label="Language Detector"
        ok={capabilities?.languageDetector}
        icon={IconGlobe}
      />
      <StatusCard
        label="Translator"
        ok={capabilities?.translator}
        icon={IconTranslate}
      />
      <StatusCard
        label="Prompt API"
        ok={capabilities?.prompt}
        icon={IconSpark}
      />
    </div>
  );
};
