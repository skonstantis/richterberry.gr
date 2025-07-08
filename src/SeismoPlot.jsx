import React, { useMemo } from "react";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";

function SeismoPlot({ buffer, virtualNow }) {
  const startTime = virtualNow - 30;
  const maxGap = 0.1;

  const [timestamps, values] = useMemo(() => {
    if (!buffer || buffer.length === 0) return [[], []];

    const ts = [];
    const vals = [];

    for (let i = 0; i < buffer.length; i++) {
      const curr = buffer[i];
      const prev = i > 0 ? buffer[i - 1] : null;

      if (prev && curr.timestamp - prev.timestamp > maxGap) {
        ts.push(prev.timestamp + maxGap / 2);
        vals.push(null);
        ts.push(curr.timestamp - maxGap / 2);
        vals.push(null);
      }

      ts.push(curr.timestamp);
      vals.push(curr.value);
    }

    return [ts, vals];
  }, [buffer]);

  const maxAbs = useMemo(() => {
    if (!values || values.length === 0) return 40;
    let maxVal = 0;
    for (const v of values) {
      if (v !== null && Math.abs(v) > maxVal) {
        maxVal = Math.abs(v);
      }
    }
    return Math.ceil(maxVal / 10) * 10 || 40;
  }, [values]);

  const data = useMemo(() => [timestamps, values], [timestamps, values]);

  const nowLinePlugin = useMemo(() => ({
    hooks: {
      draw: (u) => {
        const ctx = u.ctx;
        const { left, top, height } = u.bbox;
        const xVal = virtualNow;
        const xPos = u.valToPos(xVal, 'x', true);
  
        // Draw dashed vertical line
        ctx.beginPath();
        ctx.moveTo(xPos, top);
        ctx.lineTo(xPos, top + height);
        ctx.strokeStyle = "#f00"; // red color
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
  
        // Draw label "Now" above the top of the plot
        ctx.fillStyle = "#f00";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("Now", xPos, top - 5);
      },
    },
  }), [virtualNow]);
  

  const options = useMemo(() => ({
    width: 800,
    height: 300,
    scales: {
      x: {
        time: true,
        range: () => [startTime, virtualNow + 1],
      },
      y: {
        range: () => [-maxAbs, maxAbs],
      },
    },
    axes: [
      {
        stroke: "#888",
        size: 70,
        grid: { show: true },
        label: "Time",
        labelGap: -30,
        ticks: {
          values: (min, max) => {
            const vals = [];
            for (let v = Math.ceil(min / 5) * 5; v <= max; v += 5) vals.push(v);
            return vals;
          },
        },
        values: (u, vals) => vals.map(v => {
          const date = new Date(v * 1000);
          return date.toLocaleTimeString(undefined, { hour12: false });
        }),
      },
      {
        stroke: "#888",
        size: 40,
        grid: { show: true },
        label: "Amplitude",
        labelGap: 5,
        ticks: {
          values: (min, max) => {
            const vals = [];
            let start = Math.floor(min / 10) * 10;
            for (let v = start; v <= max; v += 10) vals.push(v);
            return vals;
          }
        },
        values: (u, vals) => vals.map(v => v.toString()),
      },
    ],
    cursor: {
      show: false,
    },
    series: [
      {},
      {
        stroke: "#03f",
        width: 1,
        spanGaps: false,
      },
    ],
    legend: {
      show: false,
    },
    plugins: [nowLinePlugin],
  }), [startTime, virtualNow, maxAbs, nowLinePlugin]);

  return <UplotReact options={options} data={data} />;
}

export default SeismoPlot;
