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
    frames.push([...arr]); // initial frame

    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            comparisons++;
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swaps++;
            }
            frames.push([...arr]); // record each step
        }
    }

    res.json({ frames, swaps, comparisons, timeComplexity: "O(n^2)" });
});

app.get('/', (req, res) => {
    res.send('AlgoVisual Backend Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));