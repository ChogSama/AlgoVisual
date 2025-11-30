const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Sample endpoint for Bubble Sort
app.post("/api/bubble-sort", (req, res) => {
    const { array } = req.body;
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

    pushFrame(); // initial frame

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
});

app.post("/api/merge-sort", (req, res) => {
    const { array } = req.body;
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
        const mid = Math.floor((l + r) / 2);
        mergeSort(l, mid);
        mergeSort(mid + 1, r);
        merge(l, mid, r);
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
                arr[k] = left[i];
                i++;
            } else {
                arr[k] = right[j];
                j++;
            }

            pushFrame({
                region: {l, m, r},
                leftIndex: l + i,
                rightIndex: m + 1 + j,
                writeIndex: k
            });
            k++;
        }

        while (i < left.length) {
            arr[k] = left[i];
            pushFrame({
                region: {l, m, r},
                leftIndex: l + i,
                rightIndex: null,
                writeIndex: k
            });
            i++;
            k++;
        }

        while (j < right.length) {
            arr[k] = right[j];
            pushFrame({
                region: {l, m, r},
                leftIndex: null,
                rightIndex: m + 1 + j,
                writeIndex: k
            });
            j++;
            k++;
        }
    };

    pushFrame();
    mergeSort(0, arr.length - 1);

    res.json({ frames, timeComplexity: "O(n log n)" });
});

app.post("/api/quick-sort", (req, res) => {
    const { array } = req.body;
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
        let pivotIndex = r;
        let pivot = arr[pivotIndex];
        let i = l - 1;

        pushFrame({
            region: {l, r},
            rightIndex: pivotIndex
        });

        for (let j = l; j < r; j++) {
            comparisons++;
            pushFrame({
                region: {l, r},
                leftIndex: j,
                rightIndex: pivotIndex
            });

            if (arr[j] < pivot) {
                i++;
                [arr[i], arr[j]] = [arr[j], arr[i]];
                swaps++;
                pushFrame({
                    i,
                    j,
                    swapped: true,
                    region: {l, r},
                    rightIndex: pivotIndex
                });
            }
        }

        [arr[i + 1], arr[pivotIndex]] = [arr[pivotIndex], arr[i + 1]];
        swaps++;
        pushFrame({
            i: i + 1,
            j: pivotIndex,
            swapped: true
        });

        const pivotFinal = i + 1;
        quickSort(l, pivotFinal - 1);
        quickSort(pivotFinal + 1, r);
    };

    pushFrame();
    quickSort(0, arr.length - 1);

    res.json({ frames, timeComplexity: "O(n log n)" });
});

app.get('/', (req, res) => {
    res.send('AlgoVisual Backend Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));