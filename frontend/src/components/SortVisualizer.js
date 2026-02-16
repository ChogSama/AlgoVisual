import React, { useState, useRef, useEffect } from "react";
import "./SortVisualizer.css";
import AlgorithmInfo from "./AlgorithmInfo.js";
import useSortEngine from "../hooks/useSortEngine.js";
import { runBackendSort } from "../algorithms/runBackendSort.js";

const MAX_TIMELINE_FRAMES = 3000;

const algorithmRunnerMap = {
    bubble: runBackendSort("bubble-sort"),
    merge: runBackendSort("merge-sort"),
    quick: runBackendSort("quick-sort")
};

const getInitialSettings = () => {
    try {
        const raw = localStorage.getItem("algo-settings");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

function SortVisualizer({ initialAlgorithm = "bubble"}) {
    const [array, setArray] = useState([]);
    const initialSettings = getInitialSettings();
    const [arraySize, setArraySize] = useState(
        initialSettings?.arraySize ?? 10
    );
    const [speed, setSpeed] = useState(
        initialSettings?.speed ?? 50
    );
    const [algorithm, setAlgorithm] = useState(
        initialSettings?.algorithm ?? initialAlgorithm
    );
    const [timeComplexity, setTimeComplexity] = useState("");
    const [showHelp, setShowHelp] = useState(false);
    const containerRef = useRef(null);
    const originalArrayRef = useRef([]);
    const didRestoreRef = useRef(false);
    const didInitAlgorithmRef = useRef(false);
    const engine = useSortEngine({
        runAlgorithm: algorithmRunnerMap[algorithm],
        array,
        speed,
        setArray,
        setTimeComplexity
    });

    useEffect(() => {
        if (!didRestoreRef.current) return;

        // Skip first mount
        if (!didInitAlgorithmRef.current) {
            didInitAlgorithmRef.current = true;
            return;
        }

        hardResetExecution();

        setArray([]);
        originalArrayRef.current = [];
        setTimeComplexity("");
    }, [algorithm]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore typing inside inputs/sliders/selects
            if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;

            const controlledKeys = [
                " ",
                "n",
                "b",
                "arrowleft",
                "arrowright",
                "arrowup",
                "arrowdown",
                "r",
                "s"
            ];

            if (controlledKeys.includes(e.key.toLowerCase())) {
                e.preventDefault();
            }

            switch (e.key.toLowerCase()) {
                case " ": // Space -> Pause / Resume
                    if (engine.running) engine.togglePause();
                    break;

                case "n": // N -> Step forward
                    if (engine.paused) engine.stepForward();
                    break;

                case "b": // B -> Step backward
                    if (engine.paused) engine.stepBackward();
                    break;

                case "arrowleft": // <- Step backward
                    if (engine.paused) engine.stepBackward();
                    break;

                case "arrowright": // -> Step forward
                    if (engine.paused) engine.stepForward();
                    break;

                case "arrowup":
                    setSpeed(s => Math.min(s + 10, 200));
                    break;

                case "arrowdown":
                    setSpeed(s => Math.max(s - 10, 10));
                    break;
                
                case "r": // R -> Generate array
                    if (!engine.running) generateArray();
                    break;

                case "s": // S -> Start sort
                    if (!engine.running && array.length > 0) engine.startSort();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [engine.running, engine.paused, engine.currentFrameIndex, engine.frames, array]);

    useEffect(() => {
        const settings = getInitialSettings();
        if (!settings) return;

        if (Array.isArray(settings.array)) {
            setArray(settings.array);
            originalArrayRef.current = [...settings.array];
        }

        if (Array.isArray(settings.frames) && settings.frames.length > 0) {
            engine.setFrames(settings.frames); // 🔥 hydrate engine
            const idx = settings.currentFrameIndex || 0;
            engine.setCurrentFrameIndex(idx);
            engine.applyFrame(settings.frames[idx]);
        }

        didRestoreRef.current = true;
    }, []);

    useEffect(() => {
        // Skip recovery logic while restoring
        if (!didRestoreRef.current) return;

        // Recovery guard: if paused but array is empty or frames are missing
        const invalidRunningState =
            engine.running &&
            engine.paused &&
            (
                !Array.isArray(array) || array.length === 0 ||
                !Array.isArray(engine.frames) || engine.frames.length === 0
            );
        if (invalidRunningState) {
            console.warn("Recovery: invalid paused-running state, resetting...");

            engine.setCurrentFrameIndex(0);
            engine.stopSort();
        }
    }, [engine.running, engine.paused, array, engine.frames]);

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
        if (engine.running && !engine.paused && engine.frames.length === 0) {
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
                currentFrameIndex: engine.currentFrameIndex,
                paused: engine.paused,
                running: engine.paused ? true : engine.running,
                frames: engine.frames,
                array,
                swaps: engine.swaps,
                comparisons: engine.comparisons,
                highlight: engine.highlight
            })
        );
    }, [arraySize,
        speed,
        algorithm,
        engine.currentFrameIndex,
        engine.paused,
        engine.running,
        engine.frames,
        array,
        engine.swaps,
        engine.comparisons,
        engine.highlight
    ]);

    useEffect(() => {
        const settings = getInitialSettings();
        if (
            settings?.currentFrameIndex != null &&
            engine.frames.length > 0 &&
            settings.currentFrameIndex < engine.frames.length
        ) {
            const idx = settings.currentFrameIndex;
            engine.setCurrentFrameIndex(idx);
            engine.applyFrame(engine.frames[idx]);
        }
    }, [engine.frames]);

    useEffect(() => {
        return () => {
            engine.stopSort(true);
        };
    }, []);

    useEffect(() => {
        if (engine.running && engine.frames.length === 0 && !engine.loading) {
            console.warn("Frames lost during run - stopping safely");
            engine.stopSort();
        }
    }, [engine.frames, engine.running, engine.loading]);

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

        hardResetExecution();

        const newArr = Array.from({ length: arraySize }, () =>
            Math.floor(Math.random() * 100) + 5
        );

        originalArrayRef.current = [...newArr];
        setArray(newArr);

        setTimeComplexity("");
        engine.stopSort();
    };

    const resetArray = () => {
        if (engine.running || engine.loading) return;
        
        const base = originalArrayRef.current;
        if (!base || base.length === 0) return;

        setArray([...base]);
        setTimeComplexity("");
        engine.setCurrentFrameIndex(0);
        engine.stopSort();
    };

    const shuffleArray = () => {
        if (engine.running || engine.loading) return;

        const shuffled = [...array]
            .map(v => ({ v, r: Math.random() }))
            .sort((a, b) => a.r - b.r)
            .map(o => o.v);

        originalArrayRef.current = [...shuffled];
        setArray(shuffled);

        setTimeComplexity("");
        engine.setCurrentFrameIndex(0);
        engine.stopSort();
    };

    const hardResetExecution = () => {
        engine.stopSort();

        setTimeComplexity("");

        // Clear persisted execution state
        const settings = getInitialSettings();
        if (settings) {
            localStorage.setItem(
                "algo-settings",
                JSON.stringify({
                    ...settings,
                    frames: [],
                    currentFrameIndex: 0,
                    paused: false,
                    running: false
                })
            );
        }
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
                    backgroundColor: getBarColor(idx, engine.highlight),
                    transform:
                        engine.highlight?.swapped && (idx === engine.highlight.i || idx === engine.highlight.j)
                            ? "translateY(-8px)"
                            : "translateY(0)"
                }}
            />
        ));
    }, [array, engine.highlight]);

    return (
        <div className="visualizer-container">
            <h2 className="visualizer-title">
                {algorithm.charAt(0).toUpperCase() + algorithm.slice(1)} Sort
            </h2>

            {/* Algorithm description */}
            <AlgorithmInfo algorithm={algorithm} />

            <div className="status-indicator">
                {engine.running ? "🔄 Sorting..." : engine.finished ? "✅ Ready" : "🟢 Idle"}
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

                {showHelp && !engine.running && !engine.loading && (
                    <div className="hint">
                        ⌨ Space = Pause/Resume · N/B = Step · ← → = Step · ↑ ↓ = Speed · S = Start · R = Generate
                    </div>
                )}

                {engine.paused && (
                    <div className="paused-indicator" aria-live="polite">
                        ⏸ Paused
                    </div>
                )}

                <div className="metric-box" aria-label="Number of swaps">
                    <label>Swaps</label>
                    <span>{engine.swaps}</span>
                </div>
                <div className="metric-box" aria-label="Number of comparisons">
                    <label>Comparisons</label>
                    <span>{engine.comparisons}</span>
                </div>
                <div className="metric-box" aria-label="Time complexity">
                    <label>Time Complexity</label>
                    <span>{timeComplexity || "-"}</span>
                </div>
            </div>

            {engine.finished && (
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
                    disabled={engine.running || engine.paused || engine.loading}
                />

                <label>Speed: {speed} ms</label>
                <input
                    type="range"
                    min="10"
                    max="200"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    disabled={engine.running || engine.paused || engine.loading}
                />

                <label>Algorithm</label>
                <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    disabled={engine.running || engine.paused || engine.loading}
                >
                    <option value="bubble">Bubble Sort</option>
                    <option value="merge">Merge Sort</option>
                    <option value="quick">Quick Sort</option>
                </select>
            </div>

            <button 
                className="button"
                onClick={generateArray}
                disabled={engine.running || engine.paused || engine.loading}
                aria-label="Generate new random array"
            >
                Generate Array
            </button>
            <button 
                className="button"
                onClick={
                    engine.running
                        ? engine.togglePause
                        : engine.frames.length > 0 &&
                          engine.currentFrameIndex < engine.frames.length - 1
                            ? engine.startSort
                            : engine.startSort
                }
                disabled={
                    engine.loading ||
                    (array.length === 0)
                }
                aria-label="Start sorting algorithm"
            >
                {engine.running
                    ? engine.paused
                        ? `Resume ${algorithm.charAt(0).toUpperCase() + algorithm.slice(1)} Sort`
                        : `Pause ${algorithm.charAt(0).toUpperCase() + algorithm.slice(1)} Sort`
                    : engine.frames.length > 0 &&
                      engine.currentFrameIndex < engine.frames.length - 1
                        ? `Resume ${algorithm.charAt(0).toUpperCase() + algorithm.slice(1)} Sort`
                        : `Start ${algorithm.charAt(0).toUpperCase() + algorithm.slice(1)} Sort`}
            </button>
            <button
                className="button"
                onClick={shuffleArray}
                disabled={engine.running || engine.paused || engine.loading || array.length === 0}
            >
                Shuffle
            </button>
            <button
                className="button"
                onClick={resetArray}
                disabled={engine.running || engine.paused || engine.loading}
            >
                Reset
            </button>
            <button
                className="button"
                onClick={copyShareLink}
                disabled={engine.running || engine.loading}
                aria-label="Share current visualizer state"
            >
                🔗 Share State
            </button>
            <button
                className="button"
                onClick={engine.stopSort}
                disabled={!engine.running && !engine.loading}
                aria-label="Stop sorting"
            >
                Stop
            </button>
            <button
                className="button"
                onClick={engine.stepBackward}
                disabled={!engine.paused || engine.currentFrameIndex === 0 || engine.frames.length === 0}
                aria-label="Step backward"
            >
                Step Backward
            </button>
            <button
                className="button"
                onClick={engine.stepForward}
                disabled={!engine.paused || engine.currentFrameIndex >= engine.frames.length - 1 || engine.frames.length === 0}
                aria-label="Step forward"
            >
                Step Forward
            </button>

            {engine.loading && (
                <div className="loading-indicator" aria-live="polite">
                    ⏳ Loading frames from backend...
                </div>
            )}

            {engine.error && (
                <div className="error-indicator" role="alert">
                    ❌ {engine.error}
                    <div style={{ marginTop: "8px" }}>
                        <button
                            className="button"
                            onClick={engine.startSort}
                            disabled={engine.loading}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {engine.frames.length > MAX_TIMELINE_FRAMES && (
                <div className="hint">
                    ⚠️ Timeline disabled for large animations
                </div>
            )}

            {engine.frames.length > 0 && (
                <div className="timeline" role="region" aria-label="Timeline scrubber">
                    <div className="timeline-label">
                        Frame {engine.currentFrameIndex + 1} / {engine.frames.length}
                    </div>

                    <div className="timeline-track">
                        <input
                            type="range"
                            className="timeline-slider"
                            min="0"
                            max={engine.frames.length - 1}
                            value={engine.currentFrameIndex}
                            disabled={
                                !engine.paused ||
                                engine.loading ||
                                engine.frames.length > MAX_TIMELINE_FRAMES
                            }
                            onChange={(e) => {
                                const idx = Number(e.target.value);
                                engine.setCurrentFrameIndex(idx);
                                engine.applyFrame(engine.frames[idx]);
                            }}
                        />
                            
                        <div
                            className="timeline-progress"
                            style={{
                                width: `${(engine.currentFrameIndex / (engine.frames.length - 1)) * 100}%`
                            }}
                        />
                    </div> 
                </div>
            )}

            {engine.loading && (
                <div className="global-loading-overlay">
                    <div className="loading-box">
                        ⏳ Processing algorithm...
                    </div>
                </div>
            )}
        </div>
    );
}

export default SortVisualizer;