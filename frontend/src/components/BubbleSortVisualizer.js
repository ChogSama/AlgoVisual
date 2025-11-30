import React, { useState, useRef } from "react";
import "./BubbleSortVisualizer.css";

function BubbleSortVisualizer() {
    const [array, setArray] = useState([]);
    const [running, setRunning] = useState(false);
    const [arraySize, setArraySize] = useState(10);
    const [speed, setSpeed] = useState(50);
    const [algorithm, setAlgorithm] = useState("bubble");
    const [swaps, setSwaps] = useState(0);
    const [comparisons, setComparisons] = useState(0);
    const [timeComplexity, setTimeComplexity] = useState("");
    const [highlight, setHighlight] = useState({ i: null, j: null, swapped: false });
    const [paused, setPaused] = useState(false);
    const [frames, setFrames] = useState([]);
    const pausedRef = useRef(paused);

    // Generate random array
    const generateArray = () => {
        const newArr = Array.from({ length: arraySize }, () =>
            Math.floor(Math.random() * 100) + 5
        );
    setArray(newArr);
    setSwaps(0);
    setComparisons(0);
    setTimeComplexity("");
    setHighlight({ i: null, j: null, swapped: false });
    };

    const flashSorted = async () => {
        const duration = 500;
        setHighlight({
            region: {l: 0, r: array.length - 1},
            color: "green"
        });
        await new Promise(resolve => setTimeout(resolve, duration));

        setHighlight({
            i: null,
            j: null,
            swapped: false,
            region: null,
            leftIndex: null,
            rightIndex: null
        });
    };

    const waitForResume = async () => {
        while (pausedRef.current) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    };

    const togglePause = () => {
        setPaused(prev => {
            pausedRef.current = !prev;
            return !prev;
        });
    };

    // All Sort Animation
    const startSort = async () => {
        if (running) return;
        setRunning(true);
        // Reset metrics
        setSwaps(0);
        setComparisons(0);
        setTimeComplexity("");
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
        setFrames(frames);

        // Animate frames
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            if (!frame || !frame.array) continue;
            setArray(frame.array);
            setSwaps(frame.swaps);
            setComparisons(frame.comparisons);
            setHighlight(frame.highlight || { i: null, j: null, swapped: false });
            await waitForResume();
            await new Promise(resolve => setTimeout(resolve, speed));
        }

        await flashSorted();

        setTimeComplexity(result.timeComplexity || "-");

        console.log(result);
        setRunning(false);
    };

    function getBarColor(index, h) {
        if (!h) return "#4ea3ff";

        if (h.color === "green" && h.region && index >= h.region.l && index <= h.region.r) {
            return "green";
        }

        // Highlight comparisons and swaps
        if (h.i !== undefined && h.j !== undefined) {
            if (index === h.i || index === h.j) {
                return h.swapped ? "red" : "yellow";
            }
        }

        // Highlight regions for merge and quick sort
        if (h.region && index >= h.region.l && index <= h.region.r) {
            return "rgba(0, 150, 255, 0.25)";
        }

        // Highlight left and right indices
        if (h.leftIndex === index) {
            return "yellow";
        }

        if (h.rightIndex === index) {
            return "orange";
        }

        return "#4ea3ff";
    }

    return (
        <div className="visualizer-container">

            <div className="metrics-panel">
                <div className="metric-box">
                    <label>Swaps</label>
                    <span>{swaps}</span>
                </div>
                <div className="metric-box">
                    <label>Comparisons</label>
                    <span>{comparisons}</span>
                </div>
                <div className="metric-box">
                    <label>Time Complexity</label>
                    <span>{timeComplexity || "-"}</span>
                </div>
            </div>

            <div className="array-container">
                {array.map((num, idx) => (
                    <div
                        key={idx}
                        className="array-bar"
                        style={{
                            height: `${num * 3}px`,
                            backgroundColor: getBarColor(idx, highlight)
                        }}
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
                Start {algorithm.charAt(0).toUpperCase() + algorithm.slice(1)} Sort
            </button>
            <button
                className="button"
                onClick={togglePause}
                disabled={!running || frames.length === 0}
            >
                {paused ? "Resume" : "Pause"}
            </button>
        </div>
    );
}

export default BubbleSortVisualizer;