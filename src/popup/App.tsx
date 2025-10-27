import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReflectionCard } from './ReflectionCard';
import type { Reflection } from '../types';
import './styles.css';

// Sample reflection data for demonstration
const sampleReflection: Reflection = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  url: 'https://example.com/article',
  title: 'The Art of Mindful Reading',
  createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
  summary: [
    'Reading mindfully helps retain information better than skimming',
    'Taking breaks during reading improves comprehension by 40%',
    'Start with 5-minute reflection sessions after each article',
  ],
  reflection: [
    'I realize I often rush through articles without truly absorbing the content. This approach of pausing to reflect could help me remember key insights.',
    'I will try setting a timer for focused reading sessions and take brief reflection breaks.',
  ],
};

const App: React.FC = () => {
  const handleDelete = (id: string) => {
    console.log('Delete reflection:', id);
    // Actual deletion logic will be implemented in later tasks
  };

  return (
    <div className="bg-calm-50 h-[600px] w-96 overflow-y-auto p-6">
      <h1 className="font-display text-calm-900 mb-6 text-2xl font-bold">
        Reflexa AI
      </h1>
      <div className="space-y-4">
        {/* Normal reflection card */}
        <ReflectionCard reflection={sampleReflection} onDelete={handleDelete} />

        {/* Loading state example (uncomment to test) */}
        {/* <ReflectionCard reflection={sampleReflection} isLoading={true} /> */}

        {/* Error state example (uncomment to test) */}
        {/* <ReflectionCard reflection={{} as Reflection} onDelete={handleDelete} /> */}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
