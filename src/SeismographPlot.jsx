import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

const SeismographPlot = forwardRef(({ queue }, ref) => {
  const [virtualTime, setVirtualTime] = useState(null);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);

  const PLOT_WINDOW_SEC = 10;
  const FPS = 250;

  const startTimeRef = useRef(null);
  const lastGpsSyncedTimeRef = useRef(null);

  useImperativeHandle(ref, () => ({
    handleNewBatch(batch) {
      if (batch.gps_synced) {
        const batchStartMs = new Date(batch.timestamp_start).getTime();
        lastGpsSyncedTimeRef.current = batchStartMs;

        setVirtualTime((prev) => {
          if (prev === null) {
            startTimeRef.current = batchStartMs;
            return batchStartMs;
          }
          if (Math.abs(prev - batchStartMs) > 50) {
            return batchStartMs;
          }
          return prev;
        });
      }
    },
  }));

  useEffect(() => {
    if (virtualTime === null) return;

    const frameDuration = 1000 / FPS;
    let lastFrameTime = performance.now();

    function step(now) {
      const elapsed = now - lastFrameTime;
      if (elapsed >= frameDuration) {
        setVirtualTime((prev) => prev + elapsed);
        lastFrameTime = now;
      }
      animationRef.current = requestAnimationFrame(step);
    }

    animationRef.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationRef.current);
  }, [virtualTime]);

  // Σχεδιασμός στο canvas
  useEffect(() => {
    if (virtualTime === null) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    // Καθαρίζουμε το καμβά
    ctx.clearRect(0, 0, width, height);

    const windowStart = virtualTime - PLOT_WINDOW_SEC * 1000;
    const currentSamples = queue.current.filter(({ timestamp }) => {
      const t = new Date(timestamp).getTime();
      return t >= windowStart && t <= virtualTime;
    });

    if (currentSamples.length === 0) {
      ctx.fillStyle = "#999";
      ctx.font = "16px sans-serif";
      ctx.fillText("No samples to display", 10, height / 2);
      return;
    }

    // Βρίσκουμε min/max δείγμα για κλίμακα
    const samplesValues = currentSamples.map(s => s.sample);
    const minSample = Math.min(...samplesValues);
    const maxSample = Math.max(...samplesValues);

    // Οριζόντιος άξονας: χρόνος (δεξιά το πιο πρόσφατο)
    // Κάθε δείγμα σε θέση x = ανάλογα με το πότε έχει ληφθεί (στο παράθυρο 10s)
    // Κατακόρυφος άξονας: δείγμα με κλίμακα στο ύψος του καμβά

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.beginPath();

    currentSamples.forEach(({ timestamp, sample }, i) => {
      const t = new Date(timestamp).getTime();
      const x = ((t - windowStart) / (PLOT_WINDOW_SEC * 1000)) * width;
      // Κλίμακα δείγματος στο ύψος
      let y;
      if (maxSample === minSample) {
        y = height / 2;
      } else {
        y = height - ((sample - minSample) / (maxSample - minSample)) * height;
      }
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Ζωγραφίζουμε άξονες και ενδείξεις χρόνου (κάθε 10s)
    ctx.fillStyle = "black";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";

    const elapsedSeconds = (virtualTime - startTimeRef.current) / 1000;
    const timeUnits = Math.floor(elapsedSeconds / 10);

    for (let i = 0; i <= timeUnits; i++) {
      const x = (i * 10 * 1000) / (PLOT_WINDOW_SEC * 1000) * width;
      if (x <= width) {
        ctx.fillText(`${i * 10}s`, x, height - 5);
        // μικρή κάθετη γραμμή
        ctx.beginPath();
        ctx.moveTo(x, height - 15);
        ctx.lineTo(x, height - 5);
        ctx.stroke();
      }
    }

  }, [virtualTime, queue.current]);

  return (
    <div>
      <p>
        Virtual time:{" "}
        {virtualTime ? new Date(virtualTime).toISOString() : "N/A"}
      </p>
      <p>
        Showing {queue.current.filter(({ timestamp }) => {
          const t = new Date(timestamp).getTime();
          return virtualTime && t >= virtualTime - PLOT_WINDOW_SEC * 1000 && t <= virtualTime;
        }).length} samples in last {PLOT_WINDOW_SEC} seconds
      </p>
      <p>Time units (10s intervals): {virtualTime && startTimeRef.current ? Math.floor((virtualTime - startTimeRef.current)/10000) : 0}</p>
      <canvas ref={canvasRef} width={800} height={200} style={{border: "1px solid black"}} />
    </div>
  );
});

export default SeismographPlot;
