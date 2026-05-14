"use client";

import { motion } from "framer-motion";
import type { CompareResult } from "@/lib/api";

interface ComparisonPanelProps {
  data: CompareResult;
}

/* Using CSS variables for colors to keep them centralized */
const META: Record<
  string,
  {
    label: string;
    solid: string;   /* var name or hex      */
    text:  string;   /* text ON the solid bar     */
    badge: string;   /* badge class               */
  }
> = {
  dijkstra: {
    label: "Dijkstra",
    solid: "var(--sand-solid)",
    text:  "var(--sand-text)",
    badge: "badge-sand",
  },
  bfs: {
    label: "BFS",
    solid: "var(--sage-solid)",
    text:  "var(--sage-text)",
    badge: "badge-sage",
  },
  dfs: {
    label: "DFS",
    solid: "var(--blue-solid)",
    text:  "var(--blue-text)",
    badge: "badge-blue",
  },
  brute_force: {
    label: "Brute Force",
    solid: "var(--terra-solid)",
    text:  "var(--terra-text)",
    badge: "badge-terra",
  },
};

const spring = { type: "spring" as const, stiffness: 80, damping: 16 };

export default function ComparisonPanel({ data }: ComparisonPanelProps) {
  const algos = Object.keys(data) as (keyof CompareResult)[];
  const maxTime = Math.max(...algos.map((a) => data[a].execution_time_ms));
  const maxDist = Math.max(...algos.map((a) => data[a].distance_km));

  return (
    <div className="flex flex-col gap-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-[var(--text-main)]">
          Algorithm Comparison
        </p>
        <span className="badge badge-neutral">4 algorithms</span>
      </div>

      {/* ══ Execution Time ══ */}
      <Section label="Execution Time">
        {algos.map((algo, i) => {
          const pct = maxTime > 0 ? (data[algo].execution_time_ms / maxTime) * 100 : 0;
          const m = META[algo];
          const barPct = Math.max(pct, 6);

          return (
            <div key={algo} className="flex items-center gap-4">
              {/* Label */}
              <span className="text-[11px] font-bold w-[90px] shrink-0 font-sans" style={{ color: m.solid }}>
                {m.label}
              </span>

              {/* Bar track */}
              <div className="compare-bar-track">
                {/* Solid fill bar */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ ...spring, delay: i * 0.1 }}
                  className="compare-bar-fill"
                  style={{ background: m.solid }}
                >
                  <span className="compare-bar-text" style={{ color: m.text }}>
                    {data[algo].execution_time_ms.toFixed(4)} ms
                  </span>
                </motion.div>
              </div>
            </div>
          );
        })}
      </Section>

      {/* ══ Path Distance ══ */}
      <Section label="Path Distance">
        {algos.map((algo, i) => {
          const pct = maxDist > 0 ? (data[algo].distance_km / maxDist) * 100 : 0;
          const m = META[algo];
          const barPct = Math.max(pct, 6);

          return (
            <div key={algo} className="flex items-center gap-4">
              <span className="text-[11px] font-bold w-[90px] shrink-0" style={{ color: m.solid }}>
                {m.label}
              </span>

              <div className="compare-bar-track">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ ...spring, delay: i * 0.1 + 0.25 }}
                  className="compare-bar-fill"
                  style={{ background: m.solid }}
                >
                  <span className="compare-bar-text" style={{ color: m.text }}>
                    {data[algo].distance_km} km
                  </span>
                </motion.div>
              </div>
            </div>
          );
        })}
      </Section>

      {/* ══ Hops ══ */}
      <Section label="Hops (Stops)">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {algos.map((algo, i) => {
            const m = META[algo];
            return (
              <motion.div
                key={algo}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring, delay: i * 0.08 + 0.4 }}
                className="compare-hop-card"
                style={{ background: m.solid }}
              >
                <p className="text-[10px] font-bold uppercase mb-2 tracking-widest" style={{ color: m.text, opacity: 0.8 }}>
                  {m.label}
                </p>
                <p className="text-[2.2rem] font-extrabold leading-none" style={{ color: m.text }}>
                  {data[algo].hops}
                </p>
                <p className="text-[9px] font-medium opacity-70 mt-2" style={{ color: m.text }}>
                  stops
                </p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ══ Analysis ══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.6 }}
        className="panel-inset p-[18px_20px] border border-[var(--border-med)]"
      >
        <p className="text-label mb-3">Analysis</p>
        <p className="text-[12px] leading-relaxed text-[var(--text-body)]">
          <span className="font-bold text-[var(--sand)]">Dijkstra</span> guarantees the optimal path in{" "}
          <code className="text-mono text-[11px] bg-[var(--bg-subtle)] text-[var(--sand)] px-1.5 py-0.5 rounded-[4px]">
            O((V+E) log V)
          </code>.{" "}
          <span className="font-bold text-[var(--terra)]">Brute Force</span> is correct but explores every path — exponential cost.{" "}
          <span className="font-bold text-[var(--blue)]">DFS</span> follows one branch deeply and returns the first valid route.{" "}
          <span className="font-bold text-[var(--sage)]">BFS</span> minimises hops while ignoring road weights.
        </p>
      </motion.div>
    </div>
  );
}

/* ── Local layout helper ── */
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="compare-section">
      <p className="text-label mb-3.5">
        {label}
      </p>
      <div className="flex flex-col gap-2.5">
        {children}
      </div>
    </section>
  );
}
