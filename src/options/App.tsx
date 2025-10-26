import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-calm-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-calm-900 mb-6">
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
