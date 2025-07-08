import React, { useMemo, useRef } from "react";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";

function EmptySeismoPlot() {
  const fixedStartTimeRef = useRef(Date.now() / 1000);  
  const fixedStartTime = fixedStartTimeRef.current;
  const maxAbs = 40;
  const data = useMemo(() => [[], []], []);

  const messagePlugin = useMemo(() => ({
    hooks: {
      draw: (u) => {
        const ctx = u.ctx;
        const { left, top, width, height } = u.bbox;

        ctx.fillStyle = "#666";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Waiting for data", left + width / 2, top + height / 2);
      },
    },
  }), []);

  const options = useMemo(() => ({
    width: 800,
    height: 300,
    scales: {
      x: {
        time: true,
        range: () => [fixedStartTime, fixedStartTime + 31]
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
        values: () => [],
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
          },
        },
        values: () => [],
      },
    ],
    cursor: { show: false },
    series: [{}, { stroke: "#03f", width: 1, spanGaps: false }],
    legend: { show: false },
    plugins: [messagePlugin],
  }), [fixedStartTime, messagePlugin]);

  return <UplotReact options={options} data={data} />;
}

export default EmptySeismoPlot;
