import "./AlgorithmInfo.css";
const INFO = {
    bubble: {
        name: "Bubble Sort",
        time: {
            best: "O(n)",
            average: "O(n^2)",
            worst: "O(n^2)"
        },
        space: "O(1)",
        stable: "Yes",
        inPlace: "Yes"
    },
    merge: {
        name: "Merge Sort",
        time: {
            best: "O(n log n)",
            average: "O(n log n)",
            worst: "O(n log n)"
        },
        space: "O(n)",
        stable: "Yes",
        inPlace: "No"
    },
    quick: {
        name: "Quick Sort",
        time: {
            best: "O(n log n)",
            average: "O(n log n)",
            worst: "O(n^2)"
        },
        space: "O(log n)",
        stable: "No",
        inPlace: "Yes"
    }
};

function AlgorithmInfo({ algorithm }) {
    const info = INFO[algorithm];

    if (!info) return null;

    return (
        <div className="algo-info">
            <h3>{info.name}</h3>

            <div>
                <strong>Time Complexity</strong>
                <ul>
                    <li>Best: {info.time.best}</li>
                    <li>Average: {info.time.average}</li>
                    <li>Worst: {info.time.worst}</li>
                </ul>
            </div>

            <p><strong>Space:</strong> {info.space}</p>
            <p><strong>Stable:</strong> {info.stable}</p>
            <p><strong>In-Place:</strong> {info.inPlace}</p>
        </div>
    );
}

export default AlgorithmInfo;