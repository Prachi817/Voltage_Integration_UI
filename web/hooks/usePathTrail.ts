"use client";

import { useEffect, useRef, useState } from "react";
import { RobotState } from "@/lib/api";
import { rosToThreeJS } from "@/lib/coords";
import { voltageColor } from "@/lib/voltageColor";

// Caps how many points the trail keeps, so a long mission doesn't grow the
// geometry unboundedly.
const MAX_TRAIL_POINTS = 2000;
// /ws/state ticks every 0.5s even while stationary; skip near-duplicate
// points so the trail doesn't fill up with stacked samples at one spot.
const MIN_STEP_DISTANCE = 0.05;
const STALE_COLOR = "#444444";

export interface PathTrailData {
  positions: Float32Array; // xyz per point, Three.js space
  colors: Float32Array; // rgb per point — the voltage recorded AT that point
}

const EMPTY_TRAIL: PathTrailData = {
  positions: new Float32Array(0),
  colors: new Float32Array(0),
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Accumulates a client-side trail of the robot's path for as long as this
// hook stays mounted, coloring each point by the voltage reading recorded
// at that position — not just the current live value.
export function usePathTrail(state: RobotState | null): PathTrailData {
  const posRef = useRef<number[]>([]);
  const colorRef = useRef<number[]>([]);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [trail, setTrail] = useState<PathTrailData>(EMPTY_TRAIL);

  useEffect(() => {
    const odom = state?.odometry;
    if (!odom) return;

    const last = lastRef.current;
    const dist = last ? Math.hypot(odom.x - last.x, odom.y - last.y) : Infinity;
    if (dist < MIN_STEP_DISTANCE) return;

    lastRef.current = { x: odom.x, y: odom.y };
    posRef.current.push(...rosToThreeJS(odom.x, odom.y, odom.z));

    const voltage = state?.voltage;
    const hex = voltage && !voltage.stale ? voltageColor(voltage.value) : STALE_COLOR;
    colorRef.current.push(...hexToRgb(hex));

    const excess = posRef.current.length - MAX_TRAIL_POINTS * 3;
    if (excess > 0) {
      posRef.current.splice(0, excess);
      colorRef.current.splice(0, excess);
    }

    setTrail({
      positions: new Float32Array(posRef.current),
      colors: new Float32Array(colorRef.current),
    });
  }, [state]);

  return trail;
}
