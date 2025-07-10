import React, { useMemo } from "react";
import Plot from "react-plotly.js";
import FFT from "fft.js";

function computeSpectrogram(buffer, windowSize, hopSize, sampleRate) {
  const hann = (N) => Array.from({ length: N }, (_, n) => 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1))));

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
      colorbar: {
        x: 1.1,
        xanchor: "right",
        ticklabelposition: "outside",
        tickfont: {
          color: "#888",
          size: 11,
        },
      },
      showscale: allTraces.length === 0, 
    });
  }

  return allTraces;
}

export function Spectrogram({ buffer, virtualNow }) {
  const traces = useMemo(() => {
    if (!buffer || buffer.length === 0) return [];
    const sampleRate = 250;
    const windowSize = 256;
    const hopSize = 64;
    return computeSpectrogram(buffer, windowSize, hopSize, sampleRate);
  }, [buffer]);

  const tickvals = Array.from({ length: 7 }, (_, i) => {
    const start = Math.floor((virtualNow - 30) / 5) * 5;
    return start + i * 5;
  });

  const ticktext = tickvals.map((ts) =>
    new Date(ts * 1000).toLocaleTimeString(undefined, {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );

  return (
    <Plot
      data={traces}
      layout={{
        title: "Spectrogram",
        width: 850,
        height: 200,
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
          range: [virtualNow - 30, virtualNow],
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
        margin: { t: 0, l: 20, r: 0, b: 50 },
        showlegend: false,
      }}
      config={{
        displayModeBar: false,
        staticPlot: true,
      }}
    />
  );
}

export default Spectrogram;
