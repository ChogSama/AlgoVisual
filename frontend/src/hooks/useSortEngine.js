import { useState, useRef } from "react";

const MAX_FRAMES = 5000;
const MAX_FPS_DELAY = 10;

export default function useSortEngine({
    runAlgorithm,
    array,
    speed,
    setArray,
    setTimeComplexity
}) {
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [frames, setFrames] = useState([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [swaps, setSwaps] = useState(0);
    const [comparisons, setComparisons] = useState(0);
    const [accesses, setAccesses] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [highlight, setHighlight] = useState({ i: null, j: null, swapped: false });
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const pausedRef = useRef(paused);
    const runningRef = useRef(false);
    const abortControllerRef = useRef(null);

    const waitForResume = async () => {
        while (pausedRef.current) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
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

    const applyFrame = (frame) => {
        if (!frame) return;

        setArray(frame.array);
        setSwaps(frame.swaps);
        setComparisons(frame.comparisons);
        setAccesses(frame.accesses || 0);
        setHighlight(frame.highlight || { i: null, j: null, swapped: false });
    };

    const togglePause = () => {
        setPaused(prev => {
            pausedRef.current = !prev;
            return !prev;
        });
    };

    const stopSort = (preserveFrames = false) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setRunning(false);
        setLoading(false);
        runningRef.current = false;

        setPaused(false);
        pausedRef.current = false;

        setFinished(false);
        setError("");
        setTimeComplexity("");

        if (!preserveFrames) {
            setFrames([]);
            setCurrentFrameIndex(0);
        }
        setHighlight({ i: null, j: null, swapped: false });
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
    const startSort = async (externalArray = null) => {
        // 🔁 Resume from persisted frames if they exist
        if (frames.length > 0 && currentFrameIndex < frames.length - 1) {
            if (runningRef.current) return;

            setRunning(true);
            runningRef.current = true;
            setFinished(false);

            for (let i = currentFrameIndex + 1; i < frames.length; i++) {
                if (!runningRef.current) return;

                setCurrentFrameIndex(i);
                applyFrame(frames[i]);

                await waitForResume();

                const extraDelay = frames[i].highlight?.swapped ? speed * 2 : 0;
                const delay = Math.max(speed + extraDelay, MAX_FPS_DELAY);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            await flashSorted();

            setRunning(false);
            runningRef.current = false;
            setPaused(false);
            pausedRef.current = false;
            setFinished(true);

            return; // 🚀 do NOT fetch again
        }

        if (runningRef.current || loading) return;

        if (runningRef.current) return;
        setRunning(true);
        setLoading(true);
        setError("");
        runningRef.current = true;
        setFinished(false);
        // Reset metrics
        setSwaps(0);
        setComparisons(0);
        setAccesses(0);
        setElapsedTime(0);
        setTimeComplexity("");
        setCurrentFrameIndex(0);
        abortControllerRef.current = new AbortController();

        let result;

        try {
            const inputArray = externalArray ?? array;
            result = await runAlgorithm(inputArray, abortControllerRef.current.signal);
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error(err);
                setError(
                    err.message || "Failed to run algorithm."
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
        if (rawFrames.length > MAX_FRAMES) {
            console.warn("Too many frames, truncating for safety");

            alert(
                `⚠️ Large animation detected (${rawFrames.length} frames).\n` +
                `Playback will be optimized to prevent freezing.`
            );
        }
        const optimized = [];

        for (let i = 0; i < rawFrames.length && optimized.length < MAX_FRAMES; i++) {
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
            setAccesses(frame.accesses || 0);
            setHighlight(frame.highlight || { i: null, j: null, swapped: false });

            await waitForResume();

            const extraDelay = frame.highlight?.swapped ? speed * 2 : 0;
            const delay = Math.max(speed + extraDelay, MAX_FPS_DELAY);
            await new Promise(resolve => 
                setTimeout(resolve, delay)
            );
        }

        await flashSorted();

        setTimeComplexity(
            typeof result.timeComplexity === "string"
                ? result.timeComplexity
                : "-"
        );

        setElapsedTime(
            typeof result.executionTime === "number"
                ? Number(result.executionTime.toFixed(3))
                : 0
        );

        setRunning(false);
        runningRef.current = false;
        setPaused(false);
        pausedRef.current = false;
        setFinished(true);
        setLoading(false);
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

    return {
        running,
        paused,
        frames,
        currentFrameIndex,
        swaps,
        comparisons,
        accesses,
        elapsedTime,
        highlight,
        finished,
        loading,
        error,
        startSort,
        stopSort,
        togglePause,
        stepForward,
        stepBackward,
        setCurrentFrameIndex,
        applyFrame,
        setFrames
    };
}