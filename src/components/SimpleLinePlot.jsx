import React, { useRef, useEffect } from "react";

export function SimpleLinePlot({
  samples,
  virtualTimeBase,
  width = 800,
  height = 300,
}) {
  const canvasRef = useRef();
  const bufferSizeMs = 30000;
  const nowOffsetMs = 1000;
  const margin = { top: 30, right: 30, bottom: 30, left: 40 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !virtualTimeBase) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const adjustedVirtualTimeBase = virtualTimeBase + nowOffsetMs;
    const xMin = adjustedVirtualTimeBase - bufferSizeMs;
    const xMax = adjustedVirtualTimeBase;

    const visibleSamples =
      samples?.filter((s) => s.timestamp >= xMin && s.timestamp <= xMax) ?? [];

    const values = visibleSamples.map((s) => s.value);
    const minZoom = 100;
    const maxAbs = Math.max(...values.map(Math.abs), minZoom);
    const yMin = -maxAbs;
    const yMax = maxAbs;

    const scaleX = (t) => ((t - xMin) / (xMax - xMin)) * plotWidth + margin.left;
    const scaleY = (v) => ((yMax - v) / (yMax - yMin)) * plotHeight + margin.top;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const timeStep = 5000;
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    for (let t = Math.ceil(xMin / timeStep) * timeStep; t <= xMax; t += timeStep) {
      const x = scaleX(t);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();

      const date = new Date(t);
      const timeStr = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      ctx.fillStyle = "#444";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(timeStr, x, height - margin.bottom / 2);
    }

    const now = adjustedVirtualTimeBase - nowOffsetMs;
    if (now >= xMin && now <= xMax) {
      const xNow = scaleX(now);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(xNow, margin.top);
      ctx.lineTo(xNow, height - margin.bottom);
      ctx.stroke();

      ctx.fillStyle = "red";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("now", xNow, margin.top - 2);
    }

    ctx.strokeStyle = "#aaa";
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    const yZero = scaleY(0);
    ctx.moveTo(margin.left, yZero);
    ctx.lineTo(width - margin.right, yZero);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = "#444";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = -2; i <= 2; i++) {
      const v = (i * maxAbs) / 2;
      const y = scaleY(v);
      ctx.fillText(Math.round(v), margin.left - 4, y);
    }

    ctx.strokeStyle = "#007bff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    visibleSamples.forEach((s, i) => {
      const x = scaleX(s.timestamp);
      const y = scaleY(s.value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin.left, margin.top, plotWidth, plotHeight);
  }, [samples, virtualTimeBase, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: "block", border: "1px solid black" }}
    />
  );
}
