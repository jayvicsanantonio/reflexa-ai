import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

export const App: React.FC = () => {
  return (
    <div className="bg-calm-50 min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-calm-900 mb-6 text-3xl font-bold">
          Reflexa AI Settings
        </h1>
        <p className="text-calm-600">
          Settings interface will be implemented in later tasks
        </p>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
