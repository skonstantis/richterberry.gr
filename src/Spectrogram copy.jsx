import React, { useRef, useEffect } from 'react';

// Define a smooth 11-stop gradient (dark blue to dark red)
const COLOR_GRADIENT = [
  [0, 0, 50],     // Very dark blue
  [0, 0, 255],    // Blue
  [0, 128, 255],  // Sky blue
  [0, 255, 255],  // Cyan
  [0, 255, 128],  // Aquagreen
  [0, 255, 0],    // Green
  [128, 255, 0],  // Yellow-green
  [255, 255, 0],  // Yellow
  [255, 128, 0],  // Orange
  [255, 0, 0],    // Red
  [128, 0, 0]     // Dark red
];

// Smoothly interpolate amplitude to RGB color
function amplitudeToColor(value, maxVal) {
  if (value === null || value === undefined) return '#00000000'; // transparent for gaps
  const norm = Math.min(Math.abs(value) / maxVal, 1);
  const idx = norm * (COLOR_GRADIENT.length - 1);
  const i0 = Math.floor(idx);
  const i1 = Math.min(i0 + 1, COLOR_GRADIENT.length - 1);
  const t = idx - i0;

  const [r0, g0, b0] = COLOR_GRADIENT[i0];
  const [r1, g1, b1] = COLOR_GRADIENT[i1];

  const r = Math.round(r0 + t * (r1 - r0));
  const g = Math.round(g0 + t * (g1 - g0));
  const b = Math.round(b0 + t * (b1 - b0));

  return `rgb(${r},${g},${b})`;
}

function Spectrogram({ buffer, virtualNow, width = 1000, height = 150, bufferSizeSec = 30 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!buffer || buffer.length === 0 || virtualNow === -Infinity) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Time range displayed
    const startTime = virtualNow - bufferSizeSec;
    const endTime = virtualNow;

    const maxAmp = 5000; // or dynamically calculate from buffer

    const timeToX = t => ((t - startTime) / (endTime - startTime)) * width;

    const pixelData = new Array(width).fill(0);

    // Aggregate max amplitude per pixel column
    for (const sample of buffer) {
      const x = Math.floor(timeToX(sample.timestamp));
      if (x >= 0 && x < width) {
        const amp = Math.abs(sample.value);
        if (amp > pixelData[x]) pixelData[x] = amp;
      }
    }

    // Draw vertical strips
    for (let x = 0; x < width; x++) {
      const color = amplitudeToColor(pixelData[x], maxAmp);
      ctx.fillStyle = color;
      ctx.fillRect(x, 0, 1, height);
    }

    // Optional time ticks
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const tickCount = 7;
    for (let i = 0; i <= tickCount; i++) {
      if (i === 0 || i === tickCount) continue;
      const t = startTime + (i / tickCount) * bufferSizeSec;
      const x = timeToX(t);
      const label = new Date(t * 1000).toLocaleTimeString(undefined, { hour12: false });
      ctx.fillText(label, x, height - 12);
      ctx.beginPath();
      ctx.moveTo(x, height - 20);
      ctx.lineTo(x, height - 15);
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
  }, [buffer, virtualNow, width, height, bufferSizeSec]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', marginTop: 10, backgroundColor: '#111' }}
    />
  );
}

export default Spectrogram;
