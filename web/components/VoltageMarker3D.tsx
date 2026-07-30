"use client";

import { Html } from "@react-three/drei";
import { RobotState } from "@/lib/api";
import { voltageColor } from "@/lib/voltageColor";
import { rosToThreeJS } from "@/lib/coords";

// Matches owon_node.cpp's marker_z default, so the label floats at roughly
// the same height as the equivalent RViz marker.
const MARKER_HEIGHT_OFFSET = 1.2;

// The live voltage badge, but riding at the robot's current 3D position
// instead of pinned to a corner of the screen — conceptually the same thing
// owon_node.cpp does with its base_link-anchored RViz marker, implemented
// in our own scene using live odometry + voltage from /ws/state.
export function VoltageMarker3D({ state }: { state: RobotState | null }) {
  const odom = state?.odometry;
  if (!odom) return null;

  const pos = rosToThreeJS(odom.x, odom.y, odom.z + MARKER_HEIGHT_OFFSET);
  const voltage = state?.voltage;
  const dotColor = voltage && !voltage.stale ? voltageColor(voltage.value) : "#444";
  const label = voltage ? `${voltage.value.toFixed(2)} ${voltage.unit}` : "—";

  return (
    <Html position={pos} center distanceFactor={8}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(0,0,0,0.55)",
          padding: "4px 8px",
          borderRadius: 6,
          color: "#fff",
          fontFamily: "monospace",
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dotColor,
            display: "inline-block",
          }}
        />
        {label}
        {voltage?.stale ? " (stale)" : ""}
      </div>
    </Html>
  );
}
