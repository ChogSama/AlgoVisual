import './App.css';
import React, { useState } from "react";
import BubbleSortVisualizer from './components/BubbleSortVisualizer.js';

function App() {
  const [algorithm, setAlgorithm] = useState("bubble");

  return (
    <div className="app-container">
      <h1 className="app-title">AlgoVisual</h1>
      <BubbleSortVisualizer algorithm={algorithm} />
    </div>
  );
}

export default App;