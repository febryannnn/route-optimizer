"use client";

import { motion } from "framer-motion";
import type { CompareResult } from "@/lib/api";

interface ComparisonPanelProps {
  data: CompareResult;
}

const META: Record<string, { label: string; color: string; dim: string }> = {
  dijkstra: { label: "Dijkstra", color: "#ffffff", dim: "rgba(255,255,255,0.08)" },
  bfs: { label: "BFS", color: "#3ecfb4", dim: "rgba(62,207,180,0.1)" },
  brute_force: { label: "Brute Force", color: "#ef5350", dim: "rgba(239,83,80,0.1)" },
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function ComparisonPanel({ data }: ComparisonPanelProps) {
  const algos = Object.keys(data) as (keyof CompareResult)[];
  const maxTime = Math.max(...algos.map((a) => data[a].execution_time_ms));
  const maxDist = Math.max(...algos.map((a) => data[a].distance_km));

  return (
    <div className="space-y-8">
      <p className="text-[13px] font-bold tracking-wide" style={{ color: "var(--w70)" }}>
        Algorithm Comparison
      </p>

      {/* Execution Time */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-4" style={{ color: "var(--w30)" }}>
          Execution Time
        </p>
        <div className="space-y-3">
          {algos.map((algo, i) => {
            const pct = maxTime > 0 ? (data[algo].execution_time_ms / maxTime) * 100 : 0;
            const m = META[algo];
            return (
              <div key={algo} className="flex items-center gap-4">
                <span className="text-[11px] font-semibold w-24 shrink-0" style={{ color: m.color }}>{m.label}</span>
                <div className="flex-1 h-7 rounded-md overflow-hidden" style={{ background: "var(--w03)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct, 4)}%` }}
                    transition={{ duration: 0.9, delay: i * 0.12, ease }}
                    className="h-full rounded-md flex items-center px-3"
                    style={{ background: `linear-gradient(90deg, ${m.dim}, transparent)`, borderLeft: `2px solid ${m.color}` }}>
                    <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: m.color, fontFamily: "var(--font-mono)" }}>
                      {data[algo].execution_time_ms.toFixed(4)} ms
                    </span>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Path Distance */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-4" style={{ color: "var(--w30)" }}>
          Path Distance
        </p>
        <div className="space-y-3">
          {algos.map((algo, i) => {
            const pct = maxDist > 0 ? (data[algo].distance_km / maxDist) * 100 : 0;
            const m = META[algo];
            return (
              <div key={algo} className="flex items-center gap-4">
                <span className="text-[11px] font-semibold w-24 shrink-0" style={{ color: m.color }}>{m.label}</span>
                <div className="flex-1 h-7 rounded-md overflow-hidden" style={{ background: "var(--w03)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct, 4)}%` }}
                    transition={{ duration: 0.9, delay: i * 0.12 + 0.3, ease }}
                    className="h-full rounded-md flex items-center px-3"
                    style={{ background: `linear-gradient(90deg, ${m.dim}, transparent)`, borderLeft: `2px solid ${m.color}` }}>
                    <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: m.color, fontFamily: "var(--font-mono)" }}>
                      {data[algo].distance_km} km
                    </span>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hops */}
      <div className="grid grid-cols-3 gap-3">
        {algos.map((algo) => {
          const m = META[algo];
          return (
            <div key={algo} className="rounded-xl p-4 text-center"
              style={{ border: `1px solid ${m.dim}`, background: m.dim }}>
              <p className="text-[10px] font-medium mb-1" style={{ color: "var(--w30)" }}>{m.label}</p>
              <p className="text-[1.8rem] font-extrabold leading-none" style={{ color: m.color }}>{data[algo].hops}</p>
              <p className="text-[9px] mt-1 font-medium" style={{ color: "var(--w30)" }}>hops</p>
            </div>
          );
        })}
      </div>

      {/* Verdict */}
      <div className="rounded-xl p-5" style={{ background: "var(--w03)", border: "1px solid var(--w08)" }}>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--w50)" }}>
          <span className="font-bold" style={{ color: "#fff" }}>Dijkstra</span> guarantees the optimal shortest path in{" "}
          <span className="font-medium" style={{ color: "#fff", fontFamily: "var(--font-mono)", fontSize: 11 }}>O((V+E) log V)</span> time.{" "}
          <span className="font-bold" style={{ color: "var(--red)" }}>Brute Force</span> exhaustively explores every possible path — exponential cost for larger graphs.{" "}
          <span className="font-bold" style={{ color: "var(--teal)" }}>BFS</span> finds the path with fewest hops, ignoring edge weights entirely.
        </p>
      </div>
    </div>
  );
}