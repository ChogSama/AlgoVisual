require("dotenv").config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

/* =======================
   CONFIG
======================= */

app.use(cors({
    origin: process.env.ClIENT_URL || "http://localhost:3000"
}));
app.use(express.json());

const MAX_ARRAY_SIZE = 200;

/* =======================
   HELPER: INPUT VALIDATION
======================= */
function validateArray(array) {
    if (!Array.isArray(array)) {
        return "Input must be an array.";
    }

    if (array.length === 0) {
        return "Array cannot be empty.";
    }

    if (array.length > MAX_ARRAY_SIZE) {
        return `Array size must be <= ${MAX_ARRAY_SIZE}.`;
    }

    if (!array.every(n => typeof n === "number")) {
        return "Array must contain only numbers.";
    }

    return null;
}

/* =======================
   API ROUTES
======================= */

// Bubble Sort
app.post("/api/bubble-sort", (req, res) => {
    try {
        const { array } = req.body;
        const error = validateArray(array);
        if (error) return res.status(400).json({ error });

        let arr = [...array];
        let swaps = 0;
        let comparisons = 0;
        let frames = [];

        const pushFrame = (i = null, j = null, swapped = false) => {
            frames.push({
                array: [...arr],
                swaps,
                comparisons,
                highlight: { i, j, swapped }
            });
        };

        pushFrame();

        for (let i = 0; i < arr.length - 1; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
                comparisons++;
                pushFrame(j, j + 1, false);

                if (arr[j] > arr[j + 1]) {
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                    swaps++;
                    pushFrame(j, j + 1, true);
                }
            }
        }

        res.json({ frames, timeComplexity: "O(n^2)" });
    } catch (err) {
        res.status(500).json({ error: "Bubble Sort failed." });
    }
});

// Merge Sort
app.post("/api/merge-sort", (req, res) => {
    try {
        const { array } = req.body;
        const error = validateArray(array);
        if (error) return res.status(400).json({ error });

        let arr = [...array];
        let frames = [];
        let comparisons = 0;

        const pushFrame = (highlight = {}) => {
            frames.push({
                array: [...arr],
                swaps: 0, // Merge sort has no swaps
                comparisons,
                highlight
            });
        };

        const mergeSort = (l, r) => {
            if (l >= r) return;
            const m = Math.floor((l + r) / 2);
            mergeSort(l, m);
            mergeSort(m + 1, r);
            merge(l, m, r);
        };

        const merge = (l, m, r) => {
            let left = arr.slice(l, m + 1);
            let right = arr.slice(m + 1, r + 1);
            let i = 0, j = 0, k = l;

            while (i < left.length && j < right.length) {
                comparisons++;
                pushFrame({
                    region: {l, m, r},
                    leftIndex: l + i,
                    rightIndex: m + 1 + j,
                    writeIndex: k
                });

                if (left[i] < right[j]) {
                    arr[k++] = left[i++];
                } else {
                    arr[k++] = right[j++];
                }

                pushFrame({
                    region: {l, m, r},
                });
            }

            while (i < left.length) {
                arr[k++] = left[i++];
                pushFrame({
                    region: {l, m, r},
                });
            }

            while (j < right.length) {
                arr[k++] = right[j++];
                pushFrame({
                region: {l, m, r},
                });
            }
        };

        pushFrame();
        mergeSort(0, arr.length - 1);

        res.json({ frames, timeComplexity: "O(n log n)" });
    } catch (err) {
        res.status(500).json({ error: "Merge Sort failed." });
    }
});

// Quick Sort
app.post("/api/quick-sort", (req, res) => {
    try {
        const { array } = req.body;
        const error = validateArray(array);
        if (error) return res.status(400).json({ error });

        let arr = [...array];
        let frames = [];
        let comparisons = 0;
        let swaps = 0;

        const pushFrame = (highlight = {}) => {
            frames.push({
                array: [...arr],
                swaps,
                comparisons,
                highlight
            });
        };

        const quickSort = (l, r) => {
            if (l >= r) return;
            let pivot = arr[r];
            let i = l - 1;

            for (let j = l; j < r; j++) {
                comparisons++;
                if (arr[j] < pivot) {
                    i++;
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                    swaps++;
                    pushFrame({
                        i,
                        j,
                        swapped: true
                    });
                }
            }

            [arr[i + 1], arr[r]] = [arr[r], arr[i + 1]];
            swaps++;
            pushFrame({
                i: i + 1,
                j: r,
                swapped: true
            });

            quickSort(l, i);
            quickSort(i + 2, r);
        };

        pushFrame();
        quickSort(0, arr.length - 1);

        res.json({ frames, timeComplexity: "O(n log n)" });
    } catch (err) {
        res.status(500).json({ error: "Quick Sort failed." });
    }
});

/* =======================
   SERVE REACT BUILD
======================= */

app.use(express.static(path.join(__dirname, "build")));
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

/* =======================
   START SERVER
======================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));