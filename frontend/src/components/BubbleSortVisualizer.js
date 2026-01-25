import React, { useState, useRef, useEffect } from "react";
import "./BubbleSortVisualizer.css";
import AlgorithmInfo from "./AlgorithmInfo.js";

const getInitialSettings = () => {
    try {
        const raw = localStorage.getItem("algo-settings");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

function BubbleSortVisualizer() {
    const [array, setArray] = useState([]);
    const [running, setRunning] = useState(false);
    const initialSettings = getInitialSettings();
    const [arraySize, setArraySize] = useState(
        initialSettings?.arraySize ?? 10
    );
    const [speed, setSpeed] = useState(
        initialSettings?.speed ?? 50
    );
    const [algorithm, setAlgorithm] = useState(
        initialSettings?.algorithm ?? "bubble"
    );
    const [swaps, setSwaps] = useState(0);
    const [comparisons, setComparisons] = useState(0);
    const [timeComplexity, setTimeComplexity] = useState("");
    const [highlight, setHighlight] = useState({ i: null, j: null, swapped: false });
    const [paused, setPaused] = useState(
        initialSettings?.paused ?? false
    );
    const [frames, setFrames] = useState([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(
        initialSettings?.currentFrameIndex ?? 0
    );
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showHelp, setShowHelp] = useState(false);
    const pausedRef = useRef(paused);
    const runningRef = useRef(false);
    const abortControllerRef = useRef(null);
    const containerRef = useRef(null);
    const originalArrayRef = useRef([]);
    const didRestoreRef = useRef(false);

    useEffect(() => {
        // Don't intefere while restoring persisted state
        if (!didRestoreRef.current) return;

        // If we restored a paused state but nothing is running, unlock UI
        if (paused && !runningRef.current && !running) {
            setPaused(false);
            pausedRef.current = false;
        }
    }, [paused, running]);

    useEffect(() => {
        if (!didRestoreRef.current) return;

        const restored = getInitialSettings();

        if (restored?.algorithm === algorithm) {
            return;
        }

        setRunning(false);
        runningRef.current = false;

        setArray([]);
        setSwaps(0);
        setComparisons(0);
        setTimeComplexity("");
        setFinished(false);
        setError("");
    }, [algorithm]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore typing inside inputs/sliders/selects
            if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;

            switch (e.key.toLowerCase()) {
                case " ": // Space -> Pause / Resume
                    e.preventDefault();
                    if (running) togglePause();
                    break;

                case "arrowleft": // <- Step backward
                    if (paused) stepBackward();
                    break;

                case "arrowright": // -> Step forward
                    if (paused) stepForward();
                    break;

                case "arrowup":
                    setSpeed(s => Math.min(s + 10, 200));
                    break;

                case "arrowdown":
                    setSpeed(s => Math.max(s - 10, 10));
                    break;
                
                case "r": // R -> Generate array
                    if (!running) generateArray();
                    break;

                case "s": // S -> Start sort
                    if (!running && array.length > 0) startSort();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [running, paused, currentFrameIndex, frames, array]);

    useEffect(() => {
        const settings = getInitialSettings();
        if (!settings) return;

        if (settings.running === true && settings.frames?.length > 0) {
            setRunning(true);
            runningRef.current = true;
        }

        if (Array.isArray(settings.array)) {
            setArray(settings.array);
            originalArrayRef.current = [...settings.array];
        }

        if (Array.isArray(settings.frames)) {
            setFrames(settings.frames);
        }

        if (typeof settings.swaps === "number") {
            setSwaps(settings.swaps);
        }

        if (typeof settings.comparisons === "number") {
            setComparisons(settings.comparisons);
        }

        if (settings.highlight) {
            setHighlight(settings.highlight);
        }

        if (
            settings.paused === true &&
            Array.isArray(settings.frames) &&
            settings.frames.length > 0 &&
            Array.isArray(settings.array) &&
            settings.array.length > 0
        ) {
            setPaused(true);
            pausedRef.current = true;
        }

        if (
            typeof settings.currentFrameIndex === "number" &&
            settings.frames?.length > 0 &&
            settings.currentFrameIndex < settings.frames.length
        ) {
            const idx = settings.currentFrameIndex;
            setCurrentFrameIndex(idx);
            applyFrame(settings.frames[idx]);
        }

        didRestoreRef.current = true;
    }, []);

    useEffect(() => {
        // Skip recovery logic while restoring
        if (!didRestoreRef.current) return;

        // Recovery guard: if paused but array is empty or frames are missing
        const invalidRunningState =
            running &&
            paused &&
            (
                !Array.isArray(array) || array.length === 0 ||
                !Array.isArray(frames) || frames.length === 0
            );
        if (invalidRunningState) {
            console.warn("Recovery: invalid paused-running state, resetting...");

            setRunning(false);
            runningRef.current = false;

            setPaused(false);
            pausedRef.current = false;

            setFrames([]);
            setCurrentFrameIndex(0);
            setHighlight({ i: null, j: null, swapped: false });
            setFinished(false);
            setLoading(false);
            setError("");
        }
    }, [running, paused, array, frames]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const sizeParam = params.get("size");
        const speedParam = params.get("speed");
        const algoParam = params.get("algo");

        let restoredSize = null;
        let restoredSpeed = null;
        let restoredAlgo = null;

        if (sizeParam !== null) {
            const size = Number(sizeParam);
            if (!Number.isNaN(size) && size >= 5 && size <= 100){
                restoredSize = size;
                setArraySize(size);
            }
        }

        if (speedParam !== null) {
            const spd = Number(speedParam);
            if (!Number.isNaN(spd) && spd >= 10 && spd <= 200) {
                restoredSpeed = spd;
                setSpeed(spd);
            }
        }

        if (
            typeof algoParam === "string" &&
            ["bubble", "merge", "quick"].includes(algoParam)
        ) {
            restoredAlgo = algoParam;
            setAlgorithm(algoParam);
        }

        // Delay generation so state updates apply first
        const restored = getInitialSettings();

        if (!restored?.array || restored.array.length === 0) {
            setTimeout(() => {
                if (!didRestoreRef.current) {
                    generateArray();
                }
            }, 0);
        }

        // Dev sanity log
        console.log("Restored from URL:", {
            size: restoredSize,
            speed: restoredSpeed,
            algo: restoredAlgo
        });

        // Clear URL after applying
        if (window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    useEffect(() => {
        if (running && !paused) {
            return;
        }
        if (!array || array.length === 0) {
            return;
        }

        localStorage.setItem(
            "algo-settings",
            JSON.stringify({
                arraySize,
                speed,
                algorithm,
                currentFrameIndex,
                paused,
                running: paused ? true : running,
                frames,
                array,
                swaps,
                comparisons,
                highlight
            })
        );
    }, [arraySize,
        speed,
        algorithm,
        currentFrameIndex,
        paused,
        running,
        frames,
        array,
        swaps,
        comparisons,
        highlight
    ]);

    useEffect(() => {
        pausedRef.current = paused;
    }, [paused]);

    useEffect(() => {
        const settings = getInitialSettings();
        if (
            settings?.currentFrameIndex != null &&
            frames.length > 0 &&
            settings.currentFrameIndex < frames.length
        ) {
            const idx = settings.currentFrameIndex;
            setCurrentFrameIndex(idx);
            applyFrame(frames[idx]);
        }
    }, [frames]);

    useEffect(() => {
        if (!didRestoreRef.current) return;
        if (!running) return;
        if (paused) return;
        if (!frames.length) return;
        if (currentFrameIndex >= frames.length - 1) return;

        // resume animation loop after refresh + resume click
        resumePlayback();
    }, [running, paused]);

    const buildShareUrl = () => {
        const params = new URLSearchParams({
            size: arraySize,
            speed,
            algo: algorithm
        });

        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    };

    const copyShareLink = async () => {
        try {
            const url = buildShareUrl();
            await navigator.clipboard.writeText(url);
            alert("🔗 Share link copied!");
        } catch {
            alert("❌ Failed to copy link.");
        }
    };

    // Generate random array
    const generateArray = () => {
        if (arraySize > 200) return;

        const newArr = Array.from({ length: arraySize }, () =>
            Math.floor(Math.random() * 100) + 5
        );

        originalArrayRef.current = [...newArr];
        setArray(newArr);

        setSwaps(0);
        setComparisons(0);
        setTimeComplexity("");
        setHighlight({ i: null, j: null, swapped: false });
        setFinished(false);

        if (!getInitialSettings()?.frames) {
            setFrames([]);
        }

        const restored = getInitialSettings();
        if (restored?.currentFrameIndex != null) {
            setCurrentFrameIndex(restored.currentFrameIndex);
        } else {
            setCurrentFrameIndex(0);
        }

        // only reset pause if user manually generates
        if (!getInitialSettings()?.paused) {
            setPaused(false);
            pausedRef.current = false;
        }
    };

    const resetArray = () => {
        if (running || loading) return;
        
        const base = originalArrayRef.current;
        if (!base || base.length === 0) return;

        setArray([...base]);
        setSwaps(0);
        setComparisons(0);
        setTimeComplexity("");
        setHighlight({ i: null, j: null, swapped: false });
        setFinished(false);
        setFrames([]);
        setCurrentFrameIndex(0);
    };

    const shuffleArray = () => {
        if (running || loading) return;

        const shuffled = [...array]
            .map(v => ({ v, r: Math.random() }))
            .sort((a, b) => a.r - b.r)
            .map(o => o.v);

        originalArrayRef.current = [...shuffled];
        setArray(shuffled);

        setSwaps(0);
        setComparisons(0);
        setTimeComplexity("");
        setHighlight({ i: null, j: null, swapped: false });
        setFinished(false);
        setFrames([]);
        setCurrentFrameIndex(0);
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

    const resumePlayback = async () => {
        if (!frames.length) return;
        if (!runningRef.current) return;

        for (let i = currentFrameIndex; i < frames.length; i++) {
            if (!runningRef.current) return;

            setCurrentFrameIndex(i);
            const frame = frames[i];
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

        setRunning(false);
        runningRef.current = false;
        setPaused(false);
        pausedRef.current = false;
        setFinished(true);
        setLoading(false);
    };

    const stopSort = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setRunning(false);
        setLoading(false);
        runningRef.current = false;

        setPaused(false);
        pausedRef.current = false;

        didRestoreRef.current = false;

        setFinished(false);
        setError("");
        setTimeComplexity("");

        setFrames([]);
        setCurrentFrameIndex(0);
        setHighlight({ i: null, j: null, swapped: false });
    };

    const applyFrame = (frame) => {
        if (!frame) return;

        setArray(frame.array);
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
        if (arraySize > 80) {
            const ok = window.confirm(
                "Large array may be slow. Continue?"
            );
            if (!ok) {
                setRunning(false);
                setLoading(false);
                runningRef.current = false;
                return;
            }
        }
        if (runningRef.current) return;
        setRunning(true);
        setLoading(true);
        setError("");
        runningRef.current = true;
        setFinished(false);
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
        abortControllerRef.current = new AbortController();

        let result;

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/${map[algorithm]}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ array }),
                    signal: abortControllerRef.current.signal
                }
            );

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            result = await response.json();
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error(err);
                setError(
                    err.message.includes("Invalid response")
                        ? "Backend returned invalid data."
                        : "Failed to run sort. Is the backend running?"
                );
            }
            setRunning(false);
            setLoading(false);
            runningRef.current = false;
            return;
        }

        if (
            !result ||
            !Array.isArray(result.frames) ||
            result.frames.length === 0
        ) {
            throw new Error("Invalid response from backend");
        }

        const rawFrames = result.frames;
        const optimized = [];

        for (let i = 0; i < rawFrames.length; i++) {
            if (i === 0 || !isSameFrame(rawFrames[i], rawFrames[i - 1])) {
                optimized.push(rawFrames[i]);
            }
        }

        setFrames(optimized);
        setLoading(false);

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

        setTimeComplexity(
            typeof result.timeComplexity === "string"
                ? result.timeComplexity
                : "-"
        );

        setRunning(false);
        runningRef.current = false;
        setPaused(false);
        pausedRef.current = false;
        setFinished(true);
        setLoading(false);
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

    const barWidth = React.useMemo(() => {
        if (!containerRef.current || array.length === 0) return 10;
        
        const containerWidth = containerRef.current.clientWidth;
        const gap = 2;
        const maxBars = array.length;
        
        return Math.max(
            2,
            Math.floor(containerWidth / maxBars) - gap
        );
    }, [array.length]);

    const bars = React.useMemo(() => {
        return array.map((num, idx) => (
            <div
                key={idx}
                className="array-bar"
                style={{
                    height: `${num * 3}px`,
                    width: `${barWidth}px`,
                    backgroundColor: getBarColor(idx, highlight),
                    transform:
                        highlight?.swapped && (idx === highlight.i || idx === highlight.j)
                            ? "translateY(-8px)"
                            : "translateY(0)"
                }}
            />
        ));
    }, [array, highlight]);

    return (
        <div className="visualizer-container">
            <h2 className="visualizer-title">
                {algorithm.charAt(0).toUpperCase() + algorithm.slice(1)} Sort
            </h2>

            {/* Algorithm description */}
            <AlgorithmInfo algorithm={algorithm} />

            <div className="status-indicator">
                {running ? "🔄 Sorting..." : finished ? "✅ Ready" : "🟢 Idle"}
            </div>

            <div className="metrics-panel" role="status" aria-live="polite">
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

                {showHelp && !running && !loading && (
                    <div className="hint">
                        ⌨ Space = Pause/Resume · ← → = Step · ↑ ↓ = Speed · S = Start · R = Generate
                    </div>
                )}

                {paused && (
                    <div className="paused-indicator" aria-live="polite">
                        ⏸ Paused
                    </div>
                )}

                <div className="metric-box" aria-label="Number of swaps">
                    <label>Swaps</label>
                    <span>{swaps}</span>
                </div>
                <div className="metric-box" aria-label="Number of comparisons">
                    <label>Comparisons</label>
                    <span>{comparisons}</span>
                </div>
                <div className="metric-box" aria-label="Time complexity">
                    <label>Time Complexity</label>
                    <span>{timeComplexity || "-"}</span>
                </div>
            </div>

            {finished && (
                <div className="finished-indicator" aria-live="polite">
                    ✅ Sorting Complete
                </div>
            )}

            <div className="array-container" ref={containerRef}>
                {array.length === 0 ? (
                    <div className="empty-state">
                        Generate an array to begin
                    </div>
                ) : (
                    bars
                )}
            </div>

            <button
                className="button"
                onClick={() => setShowHelp(v => !v)}
                title="Show keyboard shortcuts"
                aria-label="Toggle keyboard shortcuts help"
            >
                ❓ Shortcuts
            </button>

            <div className="controls" role="group" aria-label="Sorting controls">
                <label>Array Size: {arraySize}</label>
                <input
                    type="range"
                    min="5"
                    max="100"
                    value={arraySize}
                    onChange={(e) => setArraySize(Number(e.target.value))}
                    disabled={running || paused || loading}
                />

                <label>Speed: {speed} ms</label>
                <input
                    type="range"
                    min="10"
                    max="200"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    disabled={running || paused || loading}
                />

                <label>Algorithm</label>
                <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    disabled={running || paused || loading}
                >
                    <option value="bubble">Bubble Sort</option>
                    <option value="merge">Merge Sort</option>
                    <option value="quick">Quick Sort</option>
                </select>
            </div>

            <button 
                className="button"
                onClick={generateArray}
                disabled={running || paused || loading}
                aria-label="Generate new random array"
            >
                Generate Array
            </button>
            <button 
                className="button"
                onClick={startSort}
                disabled={running || loading || array.length === 0}
                aria-label="Start sorting algorithm"
            >
                Start {algorithm.charAt(0).toUpperCase() + algorithm.slice(1)} Sort
            </button>
            <button
                className="button"
                onClick={shuffleArray}
                disabled={running || paused || loading || array.length === 0}
            >
                Shuffle
            </button>
            <button
                className="button"
                onClick={resetArray}
                disabled={running || paused || loading}
            >
                Reset
            </button>
            <button
                className="button"
                onClick={copyShareLink}
                disabled={running || loading}
                aria-label="Share current visualizer state"
            >
                🔗 Share State
            </button>
            <button
                className="button"
                onClick={togglePause}
                disabled={!running}
                aria-label="Pause or resume sorting"
            >
                {paused ? "Resume" : "Pause"}
            </button>
            <button
                className="button"
                onClick={stopSort}
                disabled={!running && !loading}
                aria-label="Stop sorting"
            >
                Stop
            </button>
            <button
                className="button"
                onClick={stepBackward}
                disabled={!paused || currentFrameIndex === 0 || frames.length === 0}
                aria-label="Step backward"
            >
                Step Backward
            </button>
            <button
                className="button"
                onClick={stepForward}
                disabled={!paused || currentFrameIndex >= frames.length - 1 || frames.length === 0}
                aria-label="Step forward"
            >
                Step Forward
            </button>

            {loading && (
                <div className="loading-indicator" aria-live="polite">
                    ⏳ Loading frames from backend...
                </div>
            )}

            {error && (
                <div className="error-indicator" role="alert">
                    ❌ {error}
                    <div style={{ marginTop: "8px" }}>
                        <button
                            className="button"
                            onClick={startSort}
                            disabled={loading}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {frames.length > 0 && (
                <div className="timeline" role="region" aria-label="Timeline scrubber">
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
                            disabled={!paused || loading}
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

            {loading && (
                <div className="global-loading-overlay">
                    <div className="loading-box">
                        ⏳ Processing algorithm...
                    </div>
                </div>
            )}
        </div>
    );
}

export default BubbleSortVisualizer;