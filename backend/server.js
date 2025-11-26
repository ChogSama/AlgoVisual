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

    const pushFrame = () => {
        frames.push({
            array: [...arr],
            swaps,
            comparisons
        });
    };

    pushFrame(); // initial frame

    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            comparisons++;
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swaps++;
            }
            pushFrame(); // record each step
        }
    }

    res.json({ frames, timeComplexity: "O(n^2)" });
});

app.post("/api/merge-sort", (req, res) => {
    const { array } = req.body;
    let frames = [];
    let comparisons = 0;

    const pushFrame = (arr) => {
        frames.push({
            array: [...arr],
            swaps: 0, // Merge sort has no swaps
            comparisons
        });
    };

    const mergeSort = (arr, start, end) => {
        if (start >= end) return [arr[start]];

        const mid = Math.floor((start + end) / 2);
        const left = mergeSort(arr, start, mid);
        const right = mergeSort(arr, mid + 1, end);
        return merge(left, right, start, end);
    };

    const merge = (left, right, start, end) => {
        let result = [];
        let i = 0, j = 0;

        while (i < left.length && j < right.length) {
            comparisons++;

            if (left[i] < right[j]) {
                result.push(left[i]);
                i++;
            } else {
                result.push(right[j]);
                j++;
            }

            const partial = [
                ...result,
                ...left.slice(i),
                ...right.slice(j),
            ];

            let mergedFrame = [...array];
            mergedFrame.splice(start, partial.length, ...partial);
            pushFrame(mergedFrame);
        }

        const merged = [...result, ...left.slice(i), ...right.slice(j)];

        let finalFrame = [...array];
        finalFrame.splice(start, merged.length, ...merged);
        pushFrame(finalFrame);

        return merged;
    };

    mergeSort([...array], 0, array.length - 1);

    res.json({ frames, timeComplexity: "O(n log n)" });
});

app.post("/api/quick-sort", (req, res) => {
    const { array } = req.body;
    let frames = [];
    let comparisons = 0;
    let swaps = 0;

    const pushFrame = (arr) => {
        frames.push({
            array: [...arr],
            swaps,
            comparisons
        });
    };

    const quickSort = (arr, left, right) => {
        if (left < right) {
            let pivotIndex = partition(arr, left, right);
            quickSort(arr, left, pivotIndex - 1);
            quickSort(arr, pivotIndex + 1, right);
        }
        return arr;
    };

    const partition = (arr, left, right) => {
        let pivot = arr[right];
        let i = left - 1;

        for (let j = left; j < right; j++) {
            comparisons++;
            if (arr[j] < pivot) {
                i++;
                [arr[i], arr[j]] = [arr[j], arr[i]];
                pushFrame(arr);
            }
        }

        [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
        pushFrame(arr);
        return i + 1;
    };

    let arr = [...array];
    pushFrame(arr);
    quickSort(arr, 0, arr.length - 1);

    res.json({ frames, timeComplexity: "O(n log n)" });
});

app.get('/', (req, res) => {
    res.send('AlgoVisual Backend Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));