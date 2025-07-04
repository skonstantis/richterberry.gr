import React from "react";

export function SimpleLinePlot({
  samples,
  virtualTimeBase,
  width = 600,
  height = 200,
}) {
  const bufferSizeMs = 30000; // 30 seconds window

  virtualTimeBase += 500;
  // If no virtual time, show waiting message
  if (!virtualTimeBase) {
    return (
      <div
        style={{
          width,
          height,
          border: "1px solid black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          fontSize: "14px",
        }}
      >
        Waiting for virtual time...
      </div>
    );
  }

  const xMin = virtualTimeBase - bufferSizeMs;
  const xMax = virtualTimeBase;

  const visibleSamples = samples?.filter(
    (s) => s.timestamp >= xMin && s.timestamp <= xMax
  ) ?? [];

  // Prepare Y scaling
  const values = visibleSamples.map((s) => s.value);
  const maxAbs = Math.max(...values.map(Math.abs), 1);
  const yMin = -maxAbs;
  const yMax = maxAbs;

  const scaleX = (t) => ((t - xMin) / (xMax - xMin)) * width;
  const scaleY = (v) => ((yMax - v) / (yMax - yMin)) * height;

  const points = visibleSamples
    .map((s) => `${scaleX(s.timestamp)},${scaleY(s.value)}`)
    .join(" ");

  // Grid lines vertical (time)
  const gridLines = [];
  const timeGridStep = 5000; // 5 seconds
  for (let t = Math.ceil(xMin / timeGridStep) * timeGridStep; t <= xMax; t += timeGridStep) {
    const x = scaleX(t);
    gridLines.push(
      <line
        key={`v-${t}`}
        x1={x}
        x2={x}
        y1={0}
        y2={height}
        stroke="#ccc"
        strokeDasharray="2,2"
      />
    );
  }

  // Horizontal axis (Y=0)
  gridLines.push(
    <line
      key="h-0"
      x1={0}
      x2={width}
      y1={scaleY(0)}
      y2={scaleY(0)}
      stroke="#aaa"
      strokeDasharray="4,2"
    />
  );

  // X axis labels
  const xAxisLabels = [];
  for (let t = Math.ceil(xMin / timeGridStep) * timeGridStep; t <= xMax; t += timeGridStep) {
    const x = scaleX(t);
    const labelTime = ((t - virtualTimeBase) / 1000).toFixed(0);
    xAxisLabels.push(
      <text
        key={`label-${t}`}
        x={x}
        y={height - 4}
        fill="#444"
        fontSize="10"
        textAnchor="middle"
      >
        {labelTime}s
      </text>
    );
  }

  return (
    <div style={{ width, height, border: "1px solid black", fontFamily: "sans-serif" }}>
      <svg width={width} height={height}>
        {/* Grid lines */}
        <g>{gridLines}</g>

        {/* X axis labels */}
        <g>{xAxisLabels}</g>

        {/* Data line */}
        <polyline
          fill="none"
          stroke="#007bff"
          strokeWidth="1.5"
          points={points}
        />

        {/* Outline */}
        <rect x="0" y="0" width={width} height={height} fill="none" stroke="#000" />
      </svg>
    </div>
  );
}
