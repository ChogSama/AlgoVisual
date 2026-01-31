import React from "react";
import "./SortVisualizer.css";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("ErrorBoundary caught:", error, info);
    }

    handleReLoad = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "24px", textAlign: "center" }}>
                    <h2>⚠️ Something went wrong</h2>
                    <p>The visualizer crashed. You can safely reload.</p>
                    <button onClick={this.handleReLoad} className="button">
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;