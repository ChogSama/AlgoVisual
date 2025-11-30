import './App.css';
import React from "react";
import BubbleSortVisualizer from './components/BubbleSortVisualizer.js';

function App() {

  return (
    <div className="app-container">
      <h1 className="app-title">AlgoVisual</h1>
      <BubbleSortVisualizer />
    </div>
  );
}

export default App;