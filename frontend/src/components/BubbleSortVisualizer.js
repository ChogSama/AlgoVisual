import React, { useState } from "react";
import "./BubbleSortVisualizer.css";

function BubbleSortVisualizer() {
    const [array, setArray] = useState([]);
    const [running, setRunning] = useState(false);
    const [arraySize, setArraySize] = useState(10);
    const [speed, setSpeed] = useState(50); // ms
    const [algorithm, setAlgorithm] = useState("bubble");

    // Generate random array
    const generateArray = () => {
        const newArr = Array.from({ length: arraySize }, () =>
            Math.floor(Math.random() * 100) + 5
        );
    setArray(newArr);
    };

    // All Sort Animation
    const startSort = async () => {
        setRunning(true);
        const map = {
            bubble: "bubble-sort",
            merge: "merge-sort",
            quick: "quick-sort"
        };
        const response = await fetch(`http://localhost:5000/api/${map[algorithm]}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ array }),
        });
        const result = await response.json();
        const { frames } = result;

        // Animate frames
        for (let frame of frames) {
            setArray(frame);
            await new Promise(resolve => setTimeout(resolve, speed));
        }

        console.log(result);
        setRunning(false);
    };

    return (
        <div className="visualizer-container">
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
                    <option value="bubble">Bubble Sort</option>
                    <option value="merge">Merge Sort</option>
                    <option value="quick">Quick Sort</option>
                </select>
            </div>

            <button className="button" onClick={generateArray} disabled={running}>
                Generate Array
            </button>
            <button 
                className="button"
                onClick={startSort}
                disabled={running || array.length === 0}
            >
                Start Bubble Sort
            </button>
        </div>
    );
}

export default BubbleSortVisualizer;