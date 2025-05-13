import { useState, useEffect } from 'react';

export default function DashboardHeader() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="flex items-center justify-between mb-6 px-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Dashboard
      </h1>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 bg-gray-200 dark:bg-gray-700 rounded"
        >
          {darkMode ? '🌞' : '🌙'}
        </button>
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>
    </div>
  );
}