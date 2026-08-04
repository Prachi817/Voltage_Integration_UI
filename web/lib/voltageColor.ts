// Voltage integration: shared threshold helper for VoltageBadge, VoltageMarker3D, and usePathTrail.
import { VOLTAGE_WARN_THRESHOLD, VOLTAGE_CRITICAL_THRESHOLD } from "@/lib/constants";

export function voltageColor(value: number): string {
  if (value <= VOLTAGE_CRITICAL_THRESHOLD) return "#ff4444";
  if (value <= VOLTAGE_WARN_THRESHOLD) return "#f5a623";
  return "#00ff88";
}
