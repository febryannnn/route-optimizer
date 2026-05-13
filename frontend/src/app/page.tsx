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

const ALGO_OPTIONS = [
  { value: "dijkstra", label: "Dijkstra", desc: "Greedy optimal via priority queue", cx: "O((V+E) log V)" },
  { value: "bfs", label: "BFS", desc: "Hop-count shortest path", cx: "O(V+E)" },
  { value: "brute_force", label: "Brute Force", desc: "Exhaustive all-paths search", cx: "O(V!)" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [algorithm, setAlgorithm] = useState("dijkstra");
  const [result, setResult] = useState<RouteResult | null>(null);
  const [comparison, setComparison] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"map" | "compare">("map");

  useEffect(() => {
    fetchGraphData()
      .then((d) => { setGraphData(d); setSource(d.nodes[0]); setTarget(d.nodes[4]); })
      .catch(() => setError("Cannot connect to backend. Make sure Flask is running on port 5000."));
  }, []);

  async function handleFind() {
    if (!source || !target || source === target) { setError("Please select different source and destination."); return; }
    setError(""); setLoading(true); setResult(null); setComparison(null);
    try { const r = await fetchRoute(source, target, algorithm); setResult(r); setTab("map"); }
    catch { setError("Failed to get route. Is the Flask backend running?"); }
    finally { setLoading(false); }
  }

  async function handleCompare() {
    if (!source || !target || source === target) { setError("Please select different source and destination."); return; }
    setError(""); setComparing(true); setResult(null); setComparison(null);
    try { const r = await fetchComparison(source, target); setComparison(r); setResult(r.dijkstra); setTab("compare"); }
    catch { setError("Failed to compare routes."); }
    finally { setComparing(false); }
  }

  const graph: GraphData = graphData || { nodes: [], positions: {}, edges: [] };

  return (
    <div className="relative min-h-screen" style={{ zIndex: 1 }}>

      {/* Subtle radial vignette */}
      <div className="pointer-events-none fixed inset-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.02) 0%, transparent 60%)",
      }} />

      <div className="relative max-w-[1280px] mx-auto px-5 py-10" style={{ zIndex: 2 }}>

        {/* ════ Header ════ */}
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-14"
        >
          <div className="flex items-end justify-between pb-6" style={{ borderBottom: "1px solid var(--w08)" }}>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-3" style={{ color: "var(--w30)" }}>
                Smart Delivery Route Finder
              </p>
              <h1 className="text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold leading-[0.95] tracking-tight">
                Route<span style={{ color: "var(--w50)" }}>Forge</span>
              </h1>
              <p className="text-[11px] mt-2" style={{ color: "var(--w30)", fontFamily: "var(--font-mono)" }}>
                Dijkstra · BFS · Brute Force — Surabaya District Graph
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[11px]" style={{ color: "var(--w30)", fontFamily: "var(--font-mono)" }}>
              <span className="w-[6px] h-[6px] rounded-full" style={{
                background: graphData ? "var(--teal)" : "var(--red)",
                boxShadow: graphData ? "0 0 8px rgba(62,207,180,0.4)" : "0 0 8px rgba(239,83,80,0.4)",
              }} />
              {graphData ? `${graphData.nodes.length} nodes · ${graphData.edges.length} edges` : "connecting…"}
            </div>
          </div>
        </motion.header>

        {/* ════ Grid ════ */}
        <div className="grid gap-8 grid-main" style={{ gridTemplateColumns: "340px 1fr" }}>

          {/* ──── Left: Controls ──── */}
          <motion.aside
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease }}
            className="space-y-5"
          >
            <div className="panel-main rounded-2xl p-6 space-y-6">
              <p className="text-[13px] font-bold tracking-wide" style={{ color: "var(--w70)" }}>
                Route Configuration
              </p>

              {/* Origin */}
              <div className="reveal reveal-1">
                <label className="text-[10px] font-semibold tracking-[0.14em] uppercase block mb-2" style={{ color: "var(--w30)" }}>
                  Origin
                </label>
                <select value={source} onChange={(e) => setSource(e.target.value)}
                  className="select-styled w-full rounded-lg px-4 py-3 text-[13px] font-medium transition-colors"
                  style={{ background: "var(--w03)", border: "1px solid var(--w08)", color: "#fff", outline: "none" }}>
                  {graph.nodes.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Swap */}
              <button onClick={() => { const t = source; setSource(target); setTarget(t); }}
                className="w-full flex items-center justify-center gap-2 py-1 text-[10px] font-semibold tracking-wider transition-colors"
                style={{ color: "var(--w15)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--w50)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--w15)")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l3 3m-3-3l-3 3" />
                </svg>
                SWAP
              </button>

              {/* Destination */}
              <div className="reveal reveal-2">
                <label className="text-[10px] font-semibold tracking-[0.14em] uppercase block mb-2" style={{ color: "var(--w30)" }}>
                  Destination
                </label>
                <select value={target} onChange={(e) => setTarget(e.target.value)}
                  className="select-styled w-full rounded-lg px-4 py-3 text-[13px] font-medium transition-colors"
                  style={{ background: "var(--w03)", border: "1px solid var(--w08)", color: "#fff", outline: "none" }}>
                  {graph.nodes.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Algorithm cards */}
              <div className="reveal reveal-3">
                <label className="text-[10px] font-semibold tracking-[0.14em] uppercase block mb-3" style={{ color: "var(--w30)" }}>
                  Algorithm
                </label>
                <div className="space-y-2">
                  {ALGO_OPTIONS.map((opt) => {
                    const on = algorithm === opt.value;
                    return (
                      <button key={opt.value} onClick={() => setAlgorithm(opt.value)}
                        className={`algo-card w-full text-left rounded-xl px-4 py-3 ${on ? "algo-card-active" : ""}`}
                        style={{
                          background: on ? "var(--w05)" : "transparent",
                          border: `1px solid ${on ? "var(--w30)" : "var(--w05)"}`,
                        }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold" style={{ color: on ? "#fff" : "var(--w70)" }}>
                            {opt.label}
                          </span>
                          <span className="text-[10px]" style={{ color: on ? "var(--w50)" : "var(--w15)", fontFamily: "var(--font-mono)" }}>
                            {opt.cx}
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--w30)" }}>{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 reveal reveal-4">
                <button onClick={handleFind} disabled={loading || !graphData} className="btn-primary w-full">
                  {loading ? "Computing…" : "Find Shortest Route"}
                </button>
                <button onClick={handleCompare} disabled={comparing || !graphData} className="btn-secondary w-full">
                  {comparing ? "Comparing…" : "Compare All Algorithms"}
                </button>
              </div>
            </div>

            {/* ── Result card ── */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.4, ease }}
                  className="panel-main rounded-2xl p-6 space-y-5"
                >
                  <p className="text-[13px] font-bold tracking-wide" style={{ color: "var(--w70)" }}>
                    Route Result
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="metric-tile metric-tile-white rounded-xl p-4 text-center" style={{ background: "var(--w03)" }}>
                      <p className="text-[1.5rem] font-extrabold leading-none">{result.distance_km}</p>
                      <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--w30)" }}>km total</p>
                    </div>
                    <div className="metric-tile metric-tile-teal rounded-xl p-4 text-center" style={{ background: "var(--w03)" }}>
                      <p className="text-[1.5rem] font-extrabold leading-none" style={{ color: "var(--teal)" }}>{result.hops}</p>
                      <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--w30)" }}>stops</p>
                    </div>
                  </div>

                  <div className="rounded-xl p-4 text-center" style={{ background: "var(--w03)" }}>
                    <p className="text-[1.2rem] font-bold leading-none">
                      {result.execution_time_ms.toFixed(4)}
                      <span className="text-[10px] ml-1 font-normal" style={{ color: "var(--w30)", fontFamily: "var(--font-mono)" }}>ms</span>
                    </p>
                    <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--w30)" }}>execution time</p>
                  </div>

                  {/* Path breadcrumb */}
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-2" style={{ color: "var(--w30)" }}>
                      Route sequence
                    </p>
                    <div className="flex flex-wrap items-center gap-[6px]">
                      {result.path.map((node, i) => {
                        const first = i === 0;
                        const last = i === result.path.length - 1;
                        return (
                          <span key={i} className="flex items-center gap-[6px]">
                            <span className="text-[11px] font-semibold px-[10px] py-[5px] rounded-md"
                              style={{
                                fontFamily: "var(--font-mono)",
                                background: first ? "var(--w15)" : last ? "var(--teal-dim)" : "var(--w05)",
                                color: first ? "#fff" : last ? "var(--teal)" : "var(--w70)",
                                border: `1px solid ${first ? "var(--w30)" : last ? "rgba(62,207,180,0.25)" : "transparent"}`,
                              }}>
                              {node}
                            </span>
                            {i < result.path.length - 1 && (
                              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ opacity: 0.2 }}>
                                <path d="M0 4h10m0 0L7 1m3 3L7 7" stroke="#fff" strokeWidth="1" />
                              </svg>
                            )}
                          </span>
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
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="rounded-xl p-4" style={{ background: "var(--red-dim)", border: "1px solid rgba(239,83,80,0.2)" }}>
                  <p className="text-[11px] font-medium" style={{ color: "var(--red)" }}>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>

          {/* ──── Right: Viz ──── */}
          <motion.main
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease }}
            className="space-y-5 min-w-0"
          >
            {/* Tabs */}
            <div className="flex gap-1" style={{ borderBottom: "1px solid var(--w08)" }}>
              {(["map", "compare"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`tab-btn ${tab === t ? "tab-active" : ""}`}>
                  {t === "map" ? "Route Map" : "Algorithm Comparison"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === "map" ? (
                <motion.div key="map" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                  {graphData ? (
                    <GraphCanvas graphData={graphData} path={result?.path || []} source={source} target={target} />
                  ) : (
                    <div className="graph-frame flex items-center justify-center" style={{ height: 300 }}>
                      <p className="text-sm font-medium" style={{ color: "var(--w15)" }}>Connecting to backend…</p>
                    </div>
                  )}

                  {!result && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                      className="panel-main rounded-2xl p-6 mt-5">
                      <p className="text-[13px] font-bold mb-5" style={{ color: "var(--w50)" }}>How it works</p>
                      <div className="grid grid-cols-3 gap-6">
                        {[
                          { n: "01", t: "Build Graph", d: "Surabaya districts become nodes; roads become weighted edges reflecting real distances." },
                          { n: "02", t: "Run Algorithm", d: "Dijkstra greedily expands the frontier by cumulative cost via a min-priority queue." },
                          { n: "03", t: "Trace Path", d: "Backtrack through the predecessor map from destination to source for the optimal route." },
                        ].map((item) => (
                          <div key={item.n}>
                            <p className="text-[2rem] font-extrabold leading-none mb-2" style={{ color: "var(--w08)" }}>{item.n}</p>
                            <p className="text-[12px] font-bold mb-1" style={{ color: "var(--w50)" }}>{item.t}</p>
                            <p className="text-[11px] leading-relaxed" style={{ color: "var(--w30)" }}>{item.d}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="compare" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                  className="panel-main rounded-2xl p-6">
                  {comparison ? (
                    <ComparisonPanel data={comparison} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <p className="text-sm font-medium" style={{ color: "var(--w15)" }}>No comparison data yet.</p>
                      <button onClick={handleCompare} className="text-[11px] font-semibold underline transition-colors" style={{ color: "var(--teal)" }}>
                        Run comparison now
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {tab === "compare" && graphData && result && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold tracking-wide uppercase mb-3" style={{ color: "var(--w15)" }}>
                  Dijkstra optimal path on map
                </p>
                <GraphCanvas graphData={graphData} path={result.path} source={source} target={target} />
              </div>
            )}
          </motion.main>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-6 text-center text-[10px] tracking-[0.08em] font-medium"
          style={{ color: "var(--w15)", borderTop: "1px solid var(--w05)" }}>
          EF234405 Design &amp; Analysis of Algorithms — Quiz 2 · RouteForge
        </footer>
      </div>
    </div>
  );
}