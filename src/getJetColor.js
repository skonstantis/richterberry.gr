export function getJetColor(value, zmin = 0, zmax = 1000) {
    const colorscale = [
      [0, [0, 0, 143]],
      [0.125, [0, 0, 255]],
      [0.375, [0, 255, 255]],
      [0.625, [255, 255, 0]],
      [0.875, [255, 0, 0]],
      [1, [128, 0, 0]],
    ];
  
    let t = (value - zmin) / (zmax - zmin);
    t = Math.max(0, Math.min(1, t));
  
    for (let i = 0; i < colorscale.length - 1; i++) {
      const [t0, c0] = colorscale[i];
      const [t1, c1] = colorscale[i + 1];
      if (t >= t0 && t <= t1) {
        const f = (t - t0) / (t1 - t0);
        const r = Math.round(c0[0] + f * (c1[0] - c0[0]));
        const g = Math.round(c0[1] + f * (c1[1] - c0[1]));
        const b = Math.round(c0[2] + f * (c1[2] - c0[2]));
        return `rgb(${r},${g},${b})`;
      }
    }
  
    return "rgb(0,0,0)";
  }