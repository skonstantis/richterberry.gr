import React, { useMemo, useState, useRef, useLayoutEffect } from "react";
import Plot from "react-plotly.js";
import FFT from "fft.js";

function computeSpectrogram(buffer, windowSize, hopSize, sampleRate) {
  const hann = (N) =>
    Array.from({ length: N }, (_, n) => 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1))));

  const fft = (signal) => {
    const f = new FFT(signal.length);
    const input = f.createComplexArray();
    const output = f.createComplexArray();

    for (let i = 0; i < signal.length; i++) {
      input[2 * i] = signal[i];
      input[2 * i + 1] = 0;
    }

    f.transform(output, input);

    const magnitude = [];
    for (let i = 0; i < signal.length / 2; i++) {
      const re = output[2 * i];
      const im = output[2 * i + 1];
      magnitude.push(Math.sqrt(re * re + im * im));
    }

    return magnitude;
  };

  const maxGap = 0.1;
  const spectrogramChunks = [];
  let currentChunk = [];

  for (let i = 0; i < buffer.length; i++) {
    const curr = buffer[i];
    const prev = buffer[i - 1];

    if (i > 0 && curr.timestamp - prev.timestamp > maxGap) {
      if (currentChunk.length >= windowSize) {
        spectrogramChunks.push(currentChunk);
      }
      currentChunk = [];
    }

    currentChunk.push(curr);
  }

  if (currentChunk.length >= windowSize) {
    spectrogramChunks.push(currentChunk);
  }

  const freqAxis = Array.from({ length: windowSize / 2 }, (_, i) => (i * sampleRate) / windowSize);
  const allTraces = [];

  for (const chunk of spectrogramChunks) {
    const values = chunk.map((p) => p.value);
    const times = chunk.map((p) => p.timestamp);
    const spectrogram = [];
    const timeAxis = [];
    const window = hann(windowSize);

    for (let i = 0; i + windowSize < values.length; i += hopSize) {
      const segment = values.slice(i, i + windowSize);
      const windowed = segment.map((v, j) => v * window[j]);
      const spectrum = fft(windowed).slice(0, windowSize / 2);
      spectrogram.push(spectrum);
      timeAxis.push(times[i + Math.floor(windowSize / 2)]);
    }

    if (spectrogram.length === 0) continue;

    const z = freqAxis.map((_, fi) => spectrogram.map((row) => row[fi]));

    allTraces.push({
      z,
      x: timeAxis,
      y: freqAxis,
      type: "heatmap",
      colorscale: "Jet",
      zsmooth: "best",
      zmin: 0,
      zmax: 1000,
      showscale: false,
    });
  }

  return allTraces;
}

export function Spectrogram({ buffer, virtualNow, bufferSizeSec }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(850);

  useLayoutEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const traces = useMemo(() => {
    if (!buffer || buffer.length === 0) return [];
    const sampleRate = 250;
    const windowSize = 256;
    const hopSize = 64;
    return computeSpectrogram(buffer, windowSize, hopSize, sampleRate);
  }, [buffer]);

  const tickvals = useMemo(() => {
    const vals = [];
    const tickEvery = bufferSizeSec === 30 ? 5 : 15;
    const ticksCount = Math.floor(bufferSizeSec / tickEvery);
    const start = Math.floor((virtualNow - bufferSizeSec) / tickEvery) * tickEvery;

    for (let i = 0; i <= ticksCount; i++) {
      vals.push(start + i * tickEvery);
    }
    return vals;
  }, [virtualNow, bufferSizeSec]);

  const ticktext = useMemo(() => {
    return tickvals.map((ts) => {
      const date = new Date(ts * 1000);
      const sec = date.getUTCSeconds();
      if ((bufferSizeSec == 300 && sec === 0) || (bufferSizeSec == 30 && sec % 10 == 0)) {
        return date.toLocaleTimeString(undefined, {
          hour12: false,
        });
      }
      return ""; 
    })});

  return (
    <div ref={containerRef} style={{ width: "100%", marginBottom: "-5px", marginLeft: "10px" }}>
      <Plot
        data={traces}
        layout={{
          plot_bgcolor: "transparent",
          paper_bgcolor: "transparent",
          width,
          height: 300,
          xaxis: {
            title: {
              text: "Time",
              font: {
                size: 12,
                color: "#888",
                family: "sans-serif",
                weight: "bold",
              },
            },
            tickfont: {
              color: "#888",
              size: 11,
            },
            showgrid: false,
            zeroline: false,
            range: [virtualNow - bufferSizeSec - 1, virtualNow + 1],
            tickmode: "array",
            tickvals,
            ticktext,
          },
          yaxis: {
            title: {
              text: "Frequency (Hz)",
              font: {
                size: 12,
                color: "#888",
                family: "sans-serif",
                weight: "bold",
              },
            },
            showticklabels: false,
            ticks: "",
            showgrid: false,
            zeroline: false,
          },
          shapes: [
            {
              type: "line",
              x0: virtualNow,
              x1: virtualNow,
              y0: 0,
              y1: 1,
              xref: "x",
              yref: "paper",
              line: {
                color: "red",
                width: 1,
                dash: "dot",
              },
            },
          ],
          annotations: [
            {
              x: virtualNow,
              y: 1.05,
              xref: "x",
              yref: "paper",
              showarrow: false,
              text: "<span style='font-weight: 200; font-size: 10px; color: red;'>Now</span>",
              xanchor: "center",
              yanchor: "bottom",
              yshift: -5,
            },
          ],
          margin: { t: 50, l: 20, r: 35, b: 40 },
          showlegend: false,
        }}
        config={{
          displayModeBar: false,
          staticPlot: true,
        }}
      />
    </div>
  );
}

export default Spectrogram;
