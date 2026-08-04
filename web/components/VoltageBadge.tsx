"use client";

import { useRobotState } from "@/hooks/useRobotState";
// Voltage integration: voltageColor now shared with VoltageMarker3D and usePathTrail.
import { voltageColor } from "@/lib/voltageColor";

export function VoltageBadge() {
  const { state } = useRobotState();
  const voltage = state?.voltage;

  const dotColor = voltage && !voltage.stale ? voltageColor(voltage.value) : "#444";
  const label = voltage ? `${voltage.value.toFixed(2)} ${voltage.unit}` : "—";

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(0,0,0,0.55)",
        padding: "6px 12px",
        borderRadius: 6,
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 13,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: dotColor,
          display: "inline-block",
        }}
      />
      <span style={{ color: "#999" }}>Voltage</span>
      <span>
        {label}
        {voltage?.stale ? " (stale)" : ""}
      </span>
    </div>
  );
}
