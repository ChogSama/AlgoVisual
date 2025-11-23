import React, { useState } from "react";
import "./BubbleSortVisualizer.css";

function BubbleSortVisualizer() {
    const [array, setArray] = useState([]);
    const [running, setRunning] = useState(false);

    // Generate random array
    const generateArray = () => {
        const newArr = Array.from({ length: 10 }, () =>
            Math.floor(Math.random() * 100) + 5
        );
    setArray(newArr);
    };

    // Bubble Sort Animation
    const bubbleSort = async () => {
        setRunning(true);
        let arr = [...array];
        for (let i = 0; i < arr.length - 1; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                    setArray([...arr]);
                    await new Promise((r) => setTimeout(r, 300)); // animation delay
                }
            }
        }
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