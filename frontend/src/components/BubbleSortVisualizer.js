import React, { useState, useRef, useEffect } from "react";
import "./BubbleSortVisualizer.css";
import AlgorithmInfo from "./AlgorithmInfo.js";

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
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const pausedRef = useRef(paused);
    const runningRef = useRef(false);

    useEffect(() => {
        stopSort();
        setArray([]);
        setSwaps(0);
        setComparisons(0);
        setTimeComplexity("");
    }, [algorithm]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore typing inside inputs/sliders/selects
            if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;

            switch (e.key) {
                case " ": // Space -> Pause / Resume
                    e.preventDefault();
                    if (running) togglePause();
                    break;

                case "ArrowLeft": // <- Step backward
                    if (paused) stepBackward();
                    break;

                case "ArrowRight": // -> Step forward
                    if (paused) stepForward();
                    break;
                
                case "r":
                case "R": // R -> Generate array
                    if (!running) generateArray();
                    break;

                case "s":
                case "S": // S -> Start sort
                    if (!running && array.length > 0) startSort();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [running, paused, currentFrameIndex, frames, array]);

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

    const stopSort = () => {
        setRunning(false);
        runningRef.current = false;
        setPaused(false);
        pausedRef.current = false;

        setFrames([]);
        setCurrentFrameIndex(0);
        setHighlight({ i: null, j: null, swapped: false });
        setTimeComplexity("");
    };

    const applyFrame = (frame) => {
        if (!frame) return;

        setArray(prev =>
            JSON.stringify(prev) === JSON.stringify(frame.array)
                ? prev
                : frame.array
        );

        setSwaps(frame.swaps);
        setComparisons(frame.comparisons);
        setHighlight(frame.highlight || { i: null, j: null, swapped: false });
    };

    const stepForward = () => {
        if (!paused || currentFrameIndex >= frames.length - 1) return;
        const nextIndex = currentFrameIndex + 1;
        setCurrentFrameIndex(nextIndex);
        applyFrame(frames[nextIndex]);
    };

    const stepBackward = () => {
        if (!paused || currentFrameIndex <= 0) return;
        const prevIndex = currentFrameIndex - 1;
        setCurrentFrameIndex(prevIndex);
        applyFrame(frames[prevIndex]);
    };

    const isSameFrame = (a, b) => {
        if (!a || !b) return false;

        // Compare arrays
        for (let i = 0; i < a.array.length; i++) {
            if (a.array[i] !== b.array[i]) return false;
        }

        // Compare highlights
        return JSON.stringify(a.highlight) === JSON.stringify(b.highlight);
    };

    // All Sort Animation
    const startSort = async () => {
        if (runningRef.current) return;
        setRunning(true);
        runningRef.current = true;
        // Reset metrics
        setSwaps(0);
        setComparisons(0);
        setTimeComplexity("");
        setCurrentFrameIndex(0);
        const map = {
            bubble: "bubble-sort",
            merge: "merge-sort",
            quick: "quick-sort"
        };
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/${map[algorithm]}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ array }),
        });
        const result = await response.json();
        const rawFrames = result.frames;
        const optimized = [];

        for (let i = 0; i < rawFrames.length; i++) {
            if (i === 0 || !isSameFrame(rawFrames[i], rawFrames[i - 1])) {
                optimized.push(rawFrames[i]);
            }
        }

        setFrames(optimized);

        // Animate frames
        for (let i = 0; i < optimized.length; i++) {
            if (!runningRef.current) return;

            setCurrentFrameIndex(i);
            const frame = optimized[i];
            if (!frame || !frame.array) continue;

            setArray(frame.array);
            setSwaps(frame.swaps);
            setComparisons(frame.comparisons);
            setHighlight(frame.highlight || { i: null, j: null, swapped: false });

            await waitForResume();

            const extraDelay = frame.highlight?.swapped ? speed * 2 : 0;
            await new Promise(resolve => 
                setTimeout(resolve, speed + extraDelay)
            );
        }

        await flashSorted();

        setTimeComplexity(result.timeComplexity || "-");

        setRunning(false);
        runningRef.current = false;
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

            {/* Algorithm description */}
            <AlgorithmInfo algorithm={algorithm} />

            <div className="metrics-panel">
                <div className="legend">
                    <div className="legend-item">
                        <span className="legend-color default"></span>
                        <span>Unsorted</span>
                    </div>

                    <div className="legend-item">
                        <span className="legend-color compare"></span>
                        <span>Comparing</span>
                    </div>

                    <div className="legend-item">
                        <span className="legend-color swap"></span>
                        <span>Swap</span>
                    </div>

                    <div className="legend-item">
                        <span className="legend-color region"></span>
                        <span>Active Region</span>
                    </div>

                    <div className="legend-item">
                        <span className="legend-color sorted"></span>
                        <span>Sorted</span>
                    </div>
                </div>

                <div className="hint">
                    Space: Pause/Resume · ← →: Step · S: Start · R: Generate
                </div>

                {paused && (
                    <div className="paused-indicator">
                        ⏸ Paused
                    </div>
                )}

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
                            backgroundColor: getBarColor(idx, highlight),
                            transform:
                                highlight?.swapped && (idx === highlight.i || idx === highlight.j)
                                    ? "translateY(-8px)"
                                    : "translateY(0)"
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
                    disabled={running || paused}
                />

                <label>Speed: {speed} ms</label>
                <input
                    type="range"
                    min="10"
                    max="200"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    disabled={running || paused}
                />

                <label>Algorithm</label>
                <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    disabled={running || paused}
                >
                    <option value="bubble">Bubble Sort</option>
                    <option value="merge">Merge Sort</option>
                    <option value="quick">Quick Sort</option>
                </select>
            </div>

            <button className="button" onClick={generateArray} disabled={running || paused}>
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
            <button
                className="button"
                onClick={stopSort}
                disabled={!running}
            >
                Stop
            </button>
            <button
                className="button"
                onClick={stepBackward}
                disabled={!paused || currentFrameIndex === 0}
            >
                Step Backward
            </button>
            <button
                className="button"
                onClick={stepForward}
                disabled={!paused || currentFrameIndex >= frames.length - 1}
            >
                Step Forward
            </button>
            {frames.length > 0 && (
                <div className="timeline">
                    <div className="timeline-label">
                        Frame {currentFrameIndex + 1} / {frames.length}
                    </div>

                    <div className="timeline-track">
                        <input
                            type="range"
                            className="timeline-slider"
                            min="0"
                            max={frames.length - 1}
                            value={currentFrameIndex}
                            disabled={!paused}
                            onChange={(e) => {
                                const idx = Number(e.target.value);
                                setCurrentFrameIndex(idx);
                                applyFrame(frames[idx]);
                            }}
                        />
                            
                        <div
                            className="timeline-progress"
                            style={{
                                width: `${(currentFrameIndex / (frames.length - 1)) * 100}%`
                            }}
                        />
                    </div> 
                </div>
            )}
        </div>
    );
}

export default BubbleSortVisualizer;