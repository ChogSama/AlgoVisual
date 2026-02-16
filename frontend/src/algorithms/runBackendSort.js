export const runBackendSort = (algorithm) => async (array, signal) => {
    const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/${algorithm}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ array }),
            signal
        }
    );

    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }

    return response.json();
};