"use client";

import { Line } from "@react-three/drei";

interface PathTrailProps {
  positions: Float32Array; // flat [x,y,z,...], Three.js space
  colors: Float32Array; // flat [r,g,b,...], parallel to positions
}

// Renders the accumulated path as a single polyline, colored per-vertex by
// the voltage that was recorded at each point. Uses drei's <Line> (backed by
// Line2/LineMaterial) rather than a plain three.js <line> + lineBasicMaterial,
// since plain LineBasicMaterial silently ignores linewidth on most GPUs/browsers.
export function PathTrail({ positions, colors }: PathTrailProps) {
  if (positions.length < 6) return null; // need >= 2 points to draw a line

  const points: [number, number, number][] = [];
  const vertexColors: [number, number, number][] = [];
  for (let i = 0; i < positions.length; i += 3) {
    points.push([positions[i], positions[i + 1], positions[i + 2]]);
    vertexColors.push([colors[i], colors[i + 1], colors[i + 2]]);
  }

  return <Line points={points} vertexColors={vertexColors} lineWidth={3} />;
}
