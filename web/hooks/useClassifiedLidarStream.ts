"use client";

import { useEffect, useRef, useState } from "react";
import { parseClassifiedFrame } from "@/lib/parseClassifiedCloud";

export interface ClassifiedLidarStreamState {
  positions: Float32Array | null;
  colors: Float32Array | null;
  pointCount: number;
  connected: boolean;
  lastError: string | null;
}

// Deliberately a separate hook rather than a generic shared with
// useLidarStream — the two parse different wire formats ("PC" vs "CI") and
// keeping them independent avoids forcing a shared generic type onto both.
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 10_000;

export function useClassifiedLidarStream(url: string): ClassifiedLidarStreamState {
  const [state, setState] = useState<ClassifiedLidarStreamState>({
    positions: null,
    colors: null,
    pointCount: 0,
    connected: false,
    lastError: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(RECONNECT_BASE_MS);

  useEffect(() => {
    let active = true;

    function connect() {
      if (!active) return;
      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        delayRef.current = RECONNECT_BASE_MS;
        setState((s) => ({ ...s, connected: true, lastError: null }));
      };

      ws.onmessage = (ev: MessageEvent<ArrayBuffer | string>) => {
        if (!active || typeof ev.data === "string") return;
        const frame = parseClassifiedFrame(ev.data);
        if (!frame) return;
        setState((s) => ({
          ...s,
          positions: frame.positions,
          colors: frame.colors,
          pointCount: frame.pointCount,
        }));
      };

      ws.onerror = () => {
        if (!active) return;
        setState((s) => ({ ...s, lastError: "WebSocket error" }));
      };

      ws.onclose = () => {
        if (!active) return;
        setState((s) => ({ ...s, connected: false }));
        timerRef.current = setTimeout(() => {
          delayRef.current = Math.min(delayRef.current * 2, RECONNECT_MAX_MS);
          connect();
        }, delayRef.current);
      };
    }

    connect();

    return () => {
      active = false;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [url]);

  return state;
}
