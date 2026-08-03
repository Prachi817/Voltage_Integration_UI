"use client";

import { Html, Line } from "@react-three/drei";
import { RobotState } from "@/lib/api";
import { voltageColor } from "@/lib/voltageColor";
import { rosToThreeJS } from "@/lib/coords";

// Smaller than owon_node.cpp's marker_z (1.2) — this scene has no ground
// grid for scale reference, so a tall offset reads as "detached from the
// path" rather than "floating just above it." The indicator line below is
// what actually keeps the label visually anchored, same idea as
// owon_value_marker_node.cpp's enable_indicator_line.
const MARKER_HEIGHT_OFFSET = 0.5;
const INDICATOR_LINE_COLOR = "#00ffff"; // matches that node's default indicator_line color

// The live voltage badge, but riding at the robot's current 3D position
// instead of pinned to a corner of the screen — conceptually the same thing
// owon_node.cpp / owon_value_marker_node.cpp do with a base_link-anchored
// RViz marker (+ connecting indicator line), implemented in our own scene
// using live odometry + voltage from /ws/state.
export function VoltageMarker3D({ state }: { state: RobotState | null }) {
  const odom = state?.odometry;
  if (!odom) return null;

  const groundPos = rosToThreeJS(odom.x, odom.y, odom.z);
  const pos = rosToThreeJS(odom.x, odom.y, odom.z + MARKER_HEIGHT_OFFSET);
  const voltage = state?.voltage;
  const dotColor = voltage && !voltage.stale ? voltageColor(voltage.value) : "#444";
  const label = voltage ? `${voltage.value.toFixed(2)} ${voltage.unit}` : "—";

  return (
    <>
      <Line points={[groundPos, pos]} color={INDICATOR_LINE_COLOR} lineWidth={1.5} />
      <Html position={pos} center distanceFactor={8}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(0,0,0,0.55)",
          padding: "6px 12px",
          borderRadius: 6,
          color: "#fff",
          fontFamily: "monospace",
          fontSize: 18,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: dotColor,
            display: "inline-block",
          }}
        />
        {label}
        {voltage?.stale ? " (stale)" : ""}
      </div>
      </Html>
    </>
  );
}
