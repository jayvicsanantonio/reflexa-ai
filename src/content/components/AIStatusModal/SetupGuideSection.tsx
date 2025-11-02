/**
 * Setup Guide Section Component
 * Displays instructions and Chrome flags for setting up Chrome AI
 */

import React from 'react';
import { FlagItem } from './FlagItem';

interface SetupGuideSectionProps {
  copiedKey: string | null;
  onCopyFlag: (flagUrl: string) => void;
}

const CHROME_FLAGS = [
  {
    flagId: '#optimization-guide-on-device-model',
    flagUrl: 'chrome://flags/#optimization-guide-on-device-model',
    description: '(Enable + BypassPerfRequirement)',
  },
  {
    flagId: '#prompt-api-for-gemini-nano',
    flagUrl: 'chrome://flags/#prompt-api-for-gemini-nano',
  },
  {
    flagId: '#summarization-api-for-gemini-nano',
    flagUrl: 'chrome://flags/#summarization-api-for-gemini-nano',
  },
  {
    flagId: '#writer-api',
    flagUrl: 'chrome://flags/#writer-api',
  },
  {
    flagId: '#rewriter-api',
    flagUrl: 'chrome://flags/#rewriter-api',
  },
  {
    flagId: '#proofreader-api',
    flagUrl: 'chrome://flags/#proofreader-api',
  },
  {
    flagId: '#translator-api',
    flagUrl: 'chrome://flags/#translator-api',
  },
  {
    flagId: '#language-detection-api',
    flagUrl: 'chrome://flags/#language-detection-api',
  },
];

export const SetupGuideSection: React.FC<SetupGuideSectionProps> = ({
  copiedKey,
  onCopyFlag,
}) => {
  return (
    <div
      style={{
        marginTop: 16,
        borderTop: '1px solid rgba(15,23,42,0.06)',
        paddingTop: 12,
      }}
    >
      <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
        Set Up Chrome AI (Friendly Guide)
      </div>
      <ol
        style={{
          margin: 0,
          paddingLeft: 18,
          color: '#475569',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <li>
          In Chrome's address bar, type <code>chrome://flags</code> and press
          Enter.
        </li>
        <li>
          Use the search field to find each of the items below and set them to{' '}
          <strong>Enabled</strong>:
          <ul
            style={{
              marginTop: 8,
              marginBottom: 8,
              paddingLeft: 0,
              listStyle: 'none',
            }}
          >
            {CHROME_FLAGS.map((flag) => (
              <FlagItem
                key={flag.flagId}
                flagId={flag.flagId}
                flagUrl={flag.flagUrl}
                description={flag.description}
                copiedKey={copiedKey}
                onCopy={onCopyFlag}
              />
            ))}
          </ul>
        </li>
        <li>Click the Relaunch button to restart Chrome.</li>
        <li>Return here to verify everything is available.</li>
      </ol>
      <div style={{ color: '#334155', fontSize: 12, marginTop: 8 }}>
        Tip: If some flags don't appear, make sure Chrome is up to date.
      </div>
    </div>
  );
};
