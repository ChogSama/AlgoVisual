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