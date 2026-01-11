import './App.css';
import React from "react";
import BubbleSortVisualizer from './components/BubbleSortVisualizer.js';
import ErrorBoundary from './components/ErrorBoundary.js';

function App() {
  return (
    <div className="app-container">
      <h1 className="app-title">AlgoVisual</h1>

      <ErrorBoundary>
        <BubbleSortVisualizer />
      </ErrorBoundary>
    </div>
  );
}

export default App;