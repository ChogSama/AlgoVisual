import './App.css';
import React, {useState, useEffect} from "react";
import BubbleSortVisualizer from './components/BubbleSortVisualizer.js';
import ErrorBoundary from './components/ErrorBoundary.js';

function App() {
  const [theme, setTheme] = useState("dark");

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  // Apply theme
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="app-container">
      <div className="top-bar">
        <h1 className="app-title">AlgoVisual</h1>

        <button
          className="theme-toggle"
          onClick={() =>
            setTheme(t => (t === "dark" ? "light" : "dark"))
          }
        >
          {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      <ErrorBoundary>
        <BubbleSortVisualizer />
      </ErrorBoundary>
    </div>
  );
}

export default App;