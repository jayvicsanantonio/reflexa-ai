import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const App: React.FC = () => {
  return (
    <div className="bg-calm-50 h-[600px] w-96 p-6">
      <h1 className="font-display text-calm-900 mb-4 text-2xl font-bold">
        Reflexa AI
      </h1>
      <p className="text-calm-600">
        Dashboard will be implemented in later tasks
      </p>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
