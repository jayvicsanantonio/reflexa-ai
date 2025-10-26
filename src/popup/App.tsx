import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const App: React.FC = () => {
  return (
    <div className="w-96 h-[600px] bg-calm-50 p-6">
      <h1 className="text-2xl font-display font-bold text-calm-900 mb-4">
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
