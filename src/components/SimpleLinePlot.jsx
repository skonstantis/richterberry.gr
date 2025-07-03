import React, { useEffect, useState } from "react";

export function SimpleLinePlot({ samples, getVirtualTimeNow, width = 600, height = 200 }) {
  const bufferSizeMs = 30000; // 30 seconds window

  // Dummy state to trigger re-render
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    let animationFrameId;
    let lastTimestamp = performance.now();

    const loop = (timestamp) => {
      // Calculate elapsed time since last update
      const elapsed = timestamp - lastTimestamp;

      // Only update ~30fps (every ~33ms)
      if (elapsed > 33) {
        setFrameCount((count) => count + 1);
        lastTimestamp = timestamp;
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  if (!samples || !samples.length) {
    return (
      <div
        style={{
          width,
          height,
          border: "1px solid black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        No data to display
      </div>
    );
  }

  const virtualTimeNow = getVirtualTimeNow();

  if (!virtualTimeNow) {
    return (
      <div
        style={{
          width,
          height,
          border: "1px solid black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Waiting for virtual time...
      </div>
    );
  }

  // Define the visible time window edges
  const xMin = virtualTimeNow - bufferSizeMs;
  const xMax = virtualTimeNow;

  // Filter samples to only those in the visible window
  const visibleSamples = samples.filter(
    (s) => s.timestamp >= xMin && s.timestamp <= xMax
  );

  if (visibleSamples.length === 0) {
    return (
      <div
        style={{
          width,
          height,
          border: "1px solid black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        No samples in last 30 seconds
      </div>
    );
  }

  // Extract min and max values from visible samples for Y-axis scaling
  const values = visibleSamples.map((s) => s.value);
  const yMin = Math.min(...values);
  const yMax = Math.max(...values);

  // Protect against zero range in Y axis
  const yRange = yMax - yMin || 1;

  // Scale functions
  const scaleX = (t) => ((t - xMin) / (xMax - xMin)) * width;
  const scaleY = (v) => height - ((v - yMin) / yRange) * height;

  // Construct points string for SVG polyline
  const points = visibleSamples
    .map((s) => `${scaleX(s.timestamp)},${scaleY(s.value)}`)
    .join(" ");

  return (
    <div style={{ border: "1px solid black", width, height }}>
      <svg width={width} height={height}>
        <polyline fill="none" stroke="blue" strokeWidth="2" points={points} />
      </svg>
    </div>
  );
}
