import './App.css';
import React, {useState, useEffect} from "react";
import SortVisualizer from './components/SortVisualizer.js';
import ErrorBoundary from './components/ErrorBoundary.js';

function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme + persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="app-container">
      <div className="top-bar">
        <h1 className="app-title">AlgoVisual</h1>

        <button
          className="theme-toggle"
          aria-label="Toggle dark mode"
          onClick={() =>
            setTheme(t => (t === "dark" ? "light" : "dark"))
          }
        >
          {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      <ErrorBoundary>
        <SortVisualizer />
      </ErrorBoundary>
    </div>
  );
}

export default App;