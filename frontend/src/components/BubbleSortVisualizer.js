import React, { useState } from "react";
import "./BubbleSortVisualizer.css";

function BubbleSortVisualizer() {
    const [array, setArray] = useState([]);
    const [running, setRunning] = useState(false);
    const [arraySize, setArraySize] = useState(10);
    const [speed, setSpeed] = useState(50); // ms
    const [algorithm, setAlgorithm] = useState("bubbleSort");

    // Generate random array
    const generateArray = () => {
        const newArr = Array.from({ length: arraySize }, () =>
            Math.floor(Math.random() * 100) + 5
        );
    setArray(newArr);
    };

    // Bubble Sort Animation
    const bubbleSort = async () => {
        setRunning(true);
        const response = await fetch("http://localhost:5000/api/bubble-sort", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ array }),
        });
        const result = await response.json();
        setArray(result.sortedArray);
        console.log(`Swaps: ${result.swaps}, Comparisons: ${result.comparisons}, Time Complexity: ${result.timeComplexity}`);
        setRunning(false);
    };

    return (
        <div className="visualizer-container">
            <h2 className="visualizer-title">Bubble Sort Visualizer</h2>
            <div className="array-container">
                {array.map((num, idx) => (
                    <div
                        key={idx}
                        className="array-bar"
                        style={{ height: `${num * 3}px` }}
                    ></div>
                ))}
            </div>

            <div className="controls">
                <label>Array Size: {arraySize}</label>
                <input
                    type="range"
                    min="5"
                    max="100"
                    value={arraySize}
                    onChange={(e) => setArraySize(Number(e.target.value))}
                    disabled={running}
                />

                <label>Speed: {speed} ms</label>
                <input
                    type="range"
                    min="10"
                    max="200"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    disabled={running}
                />

                <label>Algorithm</label>
                <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    disabled={running}
                >
                    <option value="bubbleSort">Bubble Sort</option>
                    <option value="mergeSort">Merge Sort</option>
                    <option value="quickSort">Quick Sort</option>
                </select>
            </div>

            <button className="button" onClick={generateArray} disabled={running}>
                Generate Array
            </button>
            <button 
                className="button"
                onClick={bubbleSort}
                disabled={running || array.length === 0}
            >
                Start Bubble Sort
            </button>
        </div>
    );
}

export default BubbleSortVisualizer;