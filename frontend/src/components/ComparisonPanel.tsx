"use client";

import { motion } from "framer-motion";
import type { CompareResult } from "@/lib/api";

interface ComparisonPanelProps {
  data: CompareResult;
}

const ALGO_LABELS: Record<string, string> = {
  dijkstra: "Dijkstra",
  bfs: "BFS",
  brute_force: "Brute Force",
};

const ALGO_COLORS: Record<string, string> = {
  dijkstra: "#f59e0b",
  brute_force: "#ef4444",
  bfs: "#14b8a6",
};

export default function ComparisonPanel({ data }: ComparisonPanelProps) {
  const algos = Object.keys(data) as (keyof CompareResult)[];
  const maxTime = Math.max(...algos.map((a) => data[a].execution_time_ms));
  const maxDist = Math.max(...algos.map((a) => data[a].distance_km));

  return (
    <div className="space-y-6">
      <h3 className="text-xs tracking-widest text-amber-500 uppercase font-display">
        Algorithm Comparison
      </h3>

      {/* Time comparison */}
      <div>
        <p className="text-xs text-paper/40 mb-3 font-mono">Execution Time (ms)</p>
        <div className="space-y-2">
          {algos.map((algo, i) => {
            const pct = maxTime > 0 ? (data[algo].execution_time_ms / maxTime) * 100 : 0;
            return (
              <div key={algo} className="flex items-center gap-3">
                <span className="text-xs font-mono w-24 text-paper/60">{ALGO_LABELS[algo]}</span>
                <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    className="h-full rounded flex items-center px-2"
                    style={{ background: ALGO_COLORS[algo] + "40", borderLeft: `2px solid ${ALGO_COLORS[algo]}` }}
                  >
                    <span className="text-xs font-mono" style={{ color: ALGO_COLORS[algo] }}>
                      {data[algo].execution_time_ms.toFixed(4)}ms
                    </span>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distance comparison */}
      <div>
        <p className="text-xs text-paper/40 mb-3 font-mono">Path Distance (km)</p>
        <div className="space-y-2">
          {algos.map((algo, i) => {
            const pct = maxDist > 0 ? (data[algo].distance_km / maxDist) * 100 : 0;
            return (
              <div key={algo} className="flex items-center gap-3">
                <span className="text-xs font-mono w-24 text-paper/60">{ALGO_LABELS[algo]}</span>
                <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 + 0.3, ease: "easeOut" }}
                    className="h-full rounded flex items-center px-2"
                    style={{ background: ALGO_COLORS[algo] + "40", borderLeft: `2px solid ${ALGO_COLORS[algo]}` }}
                  >
                    <span className="text-xs font-mono" style={{ color: ALGO_COLORS[algo] }}>
                      {data[algo].distance_km} km
                    </span>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Path steps */}
      <div className="grid grid-cols-3 gap-2">
        {algos.map((algo) => (
          <div
            key={algo}
            className="rounded-lg p-3 border text-center"
            style={{ borderColor: ALGO_COLORS[algo] + "40", background: ALGO_COLORS[algo] + "08" }}
          >
            <p className="text-xs text-paper/40 mb-1">{ALGO_LABELS[algo]}</p>
            <p className="text-xl font-display" style={{ color: ALGO_COLORS[algo] }}>
              {data[algo].hops}
            </p>
            <p className="text-xs text-paper/40">hops</p>
          </div>
        ))}
      </div>

      {/* Verdict */}
      <div className="rounded-lg border border-amber-500/20 p-4 bg-amber-500/5">
        <p className="text-xs text-amber-400 font-mono">
          ▸ Dijkstra guarantees optimal shortest path in O((V+E) log V) time.
          Brute force explores all paths — exponential for large graphs.
          BFS finds shortest by hop count, not edge weight.
        </p>
      </div>
    </div>
  );
}
