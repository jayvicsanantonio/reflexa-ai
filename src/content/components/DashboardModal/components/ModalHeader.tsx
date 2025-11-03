/**
 * Modal Header Component
 * Header with logo, title, export buttons, and close button
 */

import React from 'react';
import { exportReflections } from '../utils/exportUtils';

interface ModalHeaderProps {
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ onClose }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 20px 8px 20px',
      borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
      gap: 8,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: 'rgba(59,130,246,0.12)',
          color: '#60a5fa',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={chrome.runtime.getURL('icons/reflexa.png')}
          alt=""
          width={22}
          height={22}
          style={{ borderRadius: 999 }}
        />
      </span>
      <div>
        <div
          id="reflexa-dashboard-title"
          style={{ fontSize: 18, fontWeight: 800 }}
        >
          Dashboard
        </div>
        <div style={{ color: '#334155', fontSize: 12 }}>
          Calm reflections, better focus
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        onClick={() => void exportReflections('json')}
        aria-label="Export as JSON"
        style={{
          padding: '6px 10px',
          border: '1px solid rgba(15,23,42,0.15)',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Export JSON
      </button>
      <button
        type="button"
        onClick={() => void exportReflections('markdown')}
        aria-label="Export as Markdown"
        style={{
          padding: '6px 10px',
          border: '1px solid rgba(15,23,42,0.15)',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Export MD
      </button>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="h-8 w-8 cursor-pointer rounded-full border border-slate-900/15 bg-transparent text-slate-900 transition-all duration-150 hover:bg-slate-900/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        ×
      </button>
    </div>
  </div>
);
