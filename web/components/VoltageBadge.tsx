"use client";

import { useRobotState } from "@/hooks/useRobotState";
import {
  VOLTAGE_WARN_THRESHOLD,
  VOLTAGE_CRITICAL_THRESHOLD,
  VOLTAGE_LABELS,
} from "@/lib/constants";

function voltageColor(value: number): string {
  if (value <= VOLTAGE_CRITICAL_THRESHOLD) return "#ff4444";
  if (value <= VOLTAGE_WARN_THRESHOLD) return "#f5a623";
  return "#00ff88";
}

export function VoltageBadge() {
  const { state } = useRobotState();
  const readings = Object.entries(state?.voltage ?? {});

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: "rgba(0,0,0,0.55)",
        padding: "8px 12px",
        borderRadius: 6,
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 13,
      }}
    >
      {readings.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#444" }} />
          <span style={{ color: "#999" }}>Voltage</span>
          <span>—</span>
        </div>
      ) : (
        readings.map(([label, reading]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: reading.stale ? "#444" : voltageColor(reading.value),
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#999" }}>{VOLTAGE_LABELS[label] ?? label}</span>
            <span>
              {reading.value.toFixed(2)} {reading.unit}
              {reading.stale ? " (stale)" : ""}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
