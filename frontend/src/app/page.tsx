"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GraphCanvas from "@/components/GraphCanvas";
import ComparisonPanel from "@/components/ComparisonPanel";
import {
  fetchGraphData,
  fetchRoute,
  fetchComparison,
  type GraphData,
  type RouteResult,
  type CompareResult,
} from "@/lib/api";

/* ── Spring config ── */
const spring     = { type: "spring" as const, stiffness: 90, damping: 18 };
const springFast = { type: "spring" as const, stiffness: 120, damping: 20 };
const springLazy = { type: "spring" as const, stiffness: 60, damping: 14 };

/* ── Algorithm options ── */
const ALGO_OPTIONS = [
  {
    value: "dijkstra",
    label: "Dijkstra",
    desc: "Greedy optimal via priority queue",
    cx: "O((V+E) log V)",
    color: "var(--sand)",
    badge: "badge-sand",
  },
  {
    value: "bfs",
    label: "BFS",
    desc: "Hop-count shortest path",
    cx: "O(V+E)",
    color: "var(--sage)",
    badge: "badge-sage",
  },
  {
    value: "brute_force",
    label: "Brute Force",
    desc: "Exhaustive all-paths search",
    cx: "O(V!)",
    color: "var(--terra)",
    badge: "badge-terra",
  },
];

/* ── Icon components ── */
function IconArrows() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l3 3m-3-3l-3 3" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="10" height="8" viewBox="0 0 12 8" fill="none">
      <path d="M0 4h10m0 0L7 1m3 3L7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  const [graphData, setGraphData]   = useState<GraphData | null>(null);
  const [source, setSource]         = useState("");
  const [target, setTarget]         = useState("");
  const [algorithm, setAlgorithm]   = useState("dijkstra");
  const [result, setResult]         = useState<RouteResult | null>(null);
  const [comparison, setComparison] = useState<CompareResult | null>(null);
  const [loading, setLoading]       = useState(false);
  const [comparing, setComparing]   = useState(false);
  const [error, setError]           = useState("");
  const [tab, setTab]               = useState<"map" | "compare">("map");

  useEffect(() => {
    fetchGraphData()
      .then((d) => {
        setGraphData(d);
        setSource(d.nodes[0]);
        setTarget(d.nodes[4]);
      })
      .catch(() =>
        setError("Cannot connect to backend. Make sure Flask is running on port 5000.")
      );
  }, []);

  async function handleFind() {
    if (!source || !target || source === target) {
      setError("Please select different source and destination.");
      return;
    }
    setError(""); setLoading(true); setResult(null); setComparison(null);
    try {
      const r = await fetchRoute(source, target, algorithm);
      setResult(r);
      setTab("map");
    } catch {
      setError("Failed to get route. Is the Flask backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompare() {
    if (!source || !target || source === target) {
      setError("Please select different source and destination.");
      return;
    }
    setError(""); setComparing(true); setResult(null); setComparison(null);
    try {
      const r = await fetchComparison(source, target);
      setComparison(r);
      setResult(r.dijkstra);
      setTab("compare");
    } catch {
      setError("Failed to compare routes.");
    } finally {
      setComparing(false);
    }
  }

  const graph: GraphData = graphData || { nodes: [], positions: {}, edges: [] };
  const selectedAlgo = ALGO_OPTIONS.find((a) => a.value === algorithm);

  return (
    <div className="min-h-screen bg-[var(--bg)]">

      {/* ══ Subtle top bar ══ */}
      <div className="h-[3px] bg-gradient-to-r from-[var(--sand)] via-[var(--sage)] to-[var(--terra)]" />

      <div className="container-main">

        {/* ══ Header ══ */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0 }}
          className="mb-10"
        >
          <div className="flex items-end justify-between pb-6 border-b border-[var(--border)]">
            <div>
              <p className="text-label mb-2.5">
                Smart Delivery · Route Optimization
              </p>
              <h1 className="text-title">
                Route<span className="text-[var(--sand)]">Forge</span>
              </h1>
              <p className="text-[12px] mt-2.5 text-[var(--text-muted)] font-mono">
                Dijkstra · BFS · Brute Force — Surabaya Districts
              </p>
            </div>

            <div className="flex items-center gap-2">
              {graphData ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springFast}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border)] shadow-sm"
                >
                  <span className="status-dot w-[7px] h-[7px] rounded-full bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.5)] inline-block" />
                  <span className="text-[11px] font-semibold text-[var(--text-body)] font-mono">
                    {graphData.nodes.length} nodes · {graphData.edges.length} edges
                  </span>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border)]">
                  <span className="status-dot w-[7px] h-[7px] rounded-full bg-[#f59e0b] inline-block" />
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] font-mono">
                    connecting…
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        {/* ══ Main Grid ══ */}
        <div className="grid-main">

          {/* ── Left: Controls ── */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springLazy, delay: 0.08 }}
            className="flex flex-col gap-4"
          >

            {/* Config Card */}
            <div className="panel-main p-[22px] flex flex-col gap-5">
              <p className="text-[12px] font-bold text-[var(--text-main)] tracking-[0.01em]">
                Route Configuration
              </p>

              {/* Origin */}
              <div className="reveal reveal-1">
                <label className="text-label block mb-2">
                  Origin
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="select-styled"
                >
                  {graph.nodes.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Swap */}
              <button
                onClick={() => { const t = source; setSource(target); setTarget(t); }}
                className="btn-icon"
              >
                <IconArrows />
                Swap
              </button>

              {/* Destination */}
              <div className="reveal reveal-2">
                <label className="text-label block mb-2">
                  Destination
                </label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="select-styled"
                >
                  {graph.nodes.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Divider */}
              <hr className="divider" />

              {/* Algorithm picker */}
              <div className="reveal reveal-3">
                <label className="text-label block mb-2.5">
                  Algorithm
                </label>
                <div className="flex flex-col gap-[7px]">
                  {ALGO_OPTIONS.map((opt) => {
                    const on = algorithm === opt.value;
                    const cardClass = opt.value === 'dijkstra' ? 'algo-card-dijkstra' : opt.value === 'bfs' ? 'algo-card-bfs' : 'algo-card-brute';
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setAlgorithm(opt.value)}
                        className={`algo-card ${cardClass} ${on ? "algo-card-active" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[12.5px] font-semibold" style={{ color: on ? opt.color : "var(--text-body)" }}>
                            {opt.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <code className="text-[9.5px] font-mono font-medium px-1.5 py-0.5 rounded-[5px]" style={{
                              color: on ? opt.color : "var(--text-faint)",
                              background: on ? "transparent" : "var(--bg-hover)",
                            }}>
                              {opt.cx}
                            </code>
                            {on && <div style={{ color: opt.color }}><IconCheck /></div>}
                          </div>
                        </div>
                        <p className="text-[11px] mt-[3px] text-[var(--text-muted)]">
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="reveal reveal-4 flex flex-col gap-2.5">
                <button
                  onClick={handleFind}
                  disabled={loading || !graphData}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <>
                      <LoadingDots color="rgba(255,255,255,0.7)" />
                      Computing…
                    </>
                  ) : (
                    "Find Shortest Route"
                  )}
                </button>
                <button
                  onClick={handleCompare}
                  disabled={comparing || !graphData}
                  className="btn-secondary w-full"
                >
                  {comparing ? "Comparing…" : "Compare All Algorithms"}
                </button>
              </div>
            </div>

            {/* Result Card */}
            <AnimatePresence>
              {result && (
                <motion.div
                  key="result-card"
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={spring}
                  className="panel-main p-[22px] flex flex-col gap-[18px]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-[var(--text-main)]">
                      Route Result
                    </p>
                    <span className={`badge ${selectedAlgo?.badge || "badge-sand"}`}>
                      {selectedAlgo?.label || result.algorithm}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...springFast, delay: 0.05 }}
                      className="metric-tile metric-tile-sand panel-inset p-[14px_12px] text-center"
                    >
                      <p className="text-[1.5rem] font-extrabold text-[var(--text-main)] leading-none">
                        {result.distance_km}
                      </p>
                      <p className="text-[10px] mt-[5px] font-semibold text-[var(--text-muted)]">
                        km total
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...springFast, delay: 0.1 }}
                      className="metric-tile metric-tile-sage panel-inset p-[14px_12px] text-center"
                    >
                      <p className="text-[1.5rem] font-extrabold text-[var(--sage)] leading-none">
                        {result.hops}
                      </p>
                      <p className="text-[10px] mt-[5px] font-semibold text-[var(--text-muted)]">
                        stops
                      </p>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...springFast, delay: 0.15 }}
                    className="metric-tile metric-tile-terra panel-inset p-3 text-center"
                  >
                    <p className="text-[1.2rem] font-extrabold text-[var(--text-main)] leading-none font-mono">
                      {result.execution_time_ms.toFixed(4)}
                      <span className="text-[11px] font-normal ml-1 text-[var(--text-muted)] font-mono">ms</span>
                    </p>
                    <p className="text-[10px] mt-[5px] font-semibold text-[var(--text-muted)]">
                      execution time
                    </p>
                  </motion.div>

                  {/* Path breadcrumb */}
                  <div>
                    <p className="text-label mb-2.5">
                      Route sequence
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {result.path.map((node, i) => {
                        const first = i === 0;
                        const last  = i === result.path.length - 1;
                        return (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...springFast, delay: 0.18 + i * 0.04 }}
                            className="flex items-center gap-1.5"
                          >
                            <span className={`path-node ${first ? "path-node-start" : last ? "path-node-end" : ""}`}>
                              {node}
                            </span>
                            {i < result.path.length - 1 && (
                              <span className="text-[var(--text-faint)]">
                                <IconArrow />
                              </span>
                            )}
                          </motion.span>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={springFast}
                  className="rounded-[12px] p-[14px_16px] bg-[#fef2f2] border border-[rgba(239,68,68,0.2)]"
                >
                  <p className="text-[11px] font-medium text-[#dc2626]">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>

          {/* ── Right: Visualization ── */}
          <motion.main
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springLazy, delay: 0.14 }}
            className="min-w-0 flex flex-col gap-5"
          >
            {/* Tabs */}
            <div className="flex gap-1 pl-1 border-b border-[var(--border)]">
              {(["map", "compare"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`tab-btn ${tab === t ? "tab-active" : ""}`}
                >
                  {t === "map" ? "Route Map" : "Algorithm Comparison"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === "map" ? (
                <motion.div
                  key="map"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={spring}
                >
                  {graphData ? (
                    <GraphCanvas
                      graphData={graphData}
                      path={result?.path || []}
                      source={source}
                      target={target}
                    />
                  ) : (
                    <div className="graph-frame h-[300px] flex items-center justify-center">
                      <p className="text-[13px] font-medium text-[var(--text-muted)]">
                        Connecting to backend…
                      </p>
                    </div>
                  )}

                  {/* Explainer */}
                  {!result && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="panel-main p-[22px_24px] mt-4"
                    >
                      <p className="text-[12px] font-bold text-[var(--text-main)] mb-5">
                        How it works
                      </p>
                      <div className="grid grid-cols-3 gap-6">
                        {[
                          {
                            n: "01",
                            t: "Build Graph",
                            d: "Surabaya districts become nodes; roads become weighted edges reflecting real distances.",
                          },
                          {
                            n: "02",
                            t: "Run Algorithm",
                            d: "Dijkstra greedily expands the frontier by cumulative cost via a min-priority queue.",
                          },
                          {
                            n: "03",
                            t: "Trace Path",
                            d: "Backtrack through the predecessor map from destination to source for the optimal route.",
                          },
                        ].map((item) => (
                          <div key={item.n}>
                            <p className="text-[2rem] font-extrabold leading-none text-[var(--border-med)] mb-2.5">
                              {item.n}
                            </p>
                            <p className="text-[12px] font-bold text-[var(--text-body)] mb-1.5">
                              {item.t}
                            </p>
                            <p className="text-[11.5px] leading-relaxed text-[var(--text-muted)]">
                              {item.d}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="compare"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={spring}
                  className="panel-main p-[24px_26px]"
                >
                  {comparison ? (
                    <ComparisonPanel data={comparison} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-[rgba(192,144,96,0.1)] flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sand)" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-[13px] font-semibold text-[var(--text-muted)]">
                        No comparison data yet.
                      </p>
                      <button
                        onClick={handleCompare}
                        className="text-[12px] font-semibold text-[var(--sand)] underline decoration-dotted"
                      >
                        Run comparison now
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dijkstra map in compare tab */}
            {tab === "compare" && graphData && result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.15 }}
              >
                <p className="text-label mb-3">
                  Dijkstra optimal path
                </p>
                <GraphCanvas
                  graphData={graphData}
                  path={result.path}
                  source={source}
                  target={target}
                />
              </motion.div>
            )}
          </motion.main>
        </div>

        {/* ══ Footer ══ */}
        <footer className="mt-14 pt-5 border-t border-[var(--border)] text-center text-[10px] font-semibold tracking-[0.08em] text-[var(--text-faint)]">
          EF234405 Design &amp; Analysis of Algorithms — Quiz 2 · RouteForge
        </footer>
      </div>
    </div>
  );
}

/* ── Loading dots ── */
function LoadingDots({ color = "rgba(255,255,255,0.7)" }: { color?: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          className="inline-block w-1 h-1 rounded-full"
          style={{ background: color }}
        />
      ))}
    </span>
  );
}