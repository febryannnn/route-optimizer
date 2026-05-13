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
  { value: "dijkstra", label: "Dijkstra", desc: "Optimal shortest path" },
  { value: "bfs", label: "BFS", desc: "Breadth-first search" },
  { value: "brute_force", label: "Brute Force", desc: "All paths exhaustive" },
];

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
      .then((data) => {
        setGraphData(data);
        setSource(data.nodes[0]);
        setTarget(data.nodes[4]);
      })
      .catch(() => setError("Cannot connect to backend. Make sure Flask is running on port 5000."));
  }, []);

  async function handleFind() {
    if (!source || !target || source === target) {
      setError("Please select different source and destination.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    setComparison(null);
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
    setError("");
    setComparing(true);
    setResult(null);
    setComparison(null);
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

  const emptyGraph: GraphData = graphData || { nodes: [], positions: {}, edges: [] };

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 20% 50%, #1a0f00 0%, #0a0a0f 60%)" }}>

      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #14b8a6, transparent 70%)" }} />
        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-5">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#f5f0e8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 bg-amber-500 rounded-full" />
                <p className="text-xs tracking-[0.3em] text-amber-500 font-mono uppercase">
                  Smart Delivery Route Finder
                </p>
              </div>
              <h1 className="text-5xl font-display text-paper leading-none">
                Route<span className="text-amber-500">Optimizer</span>
              </h1>
              <p className="text-sm text-paper/40 font-mono mt-2">
                Dijkstra · BFS · Brute Force — Surabaya District Graph
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-paper/30">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              {graphData ? `${graphData.nodes.length} nodes · ${graphData.edges.length} edges` : "connecting..."}
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left panel — controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1 space-y-4"
          >
            {/* Control card */}
            <div className="rounded-2xl border border-amber-500/15 p-6 space-y-5"
              style={{ background: "rgba(245,158,11,0.03)" }}>

              <p className="text-xs tracking-widest text-amber-500 uppercase font-display">
                Route Configuration
              </p>

              {/* Source */}
              <div>
                <label className="text-xs text-paper/40 font-mono block mb-2">
                  ▸ Origin District
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-white/5 border border-amber-500/20 rounded-lg px-4 py-3 text-sm font-mono text-paper focus:outline-none focus:border-amber-500/60 transition-colors pr-8"
                >
                  {emptyGraph.nodes.map((n) => (
                    <option key={n} value={n} className="bg-gray-900">{n}</option>
                  ))}
                </select>
              </div>

              {/* Swap button */}
              <button
                onClick={() => { const tmp = source; setSource(target); setTarget(tmp); }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-paper/30 hover:text-amber-500 transition-colors font-mono"
              >
                ⇅ swap origin / destination
              </button>

              {/* Target */}
              <div>
                <label className="text-xs text-paper/40 font-mono block mb-2">
                  ▸ Destination District
                </label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-white/5 border border-teal-500/20 rounded-lg px-4 py-3 text-sm font-mono text-paper focus:outline-none focus:border-teal-500/60 transition-colors pr-8"
                >
                  {emptyGraph.nodes.map((n) => (
                    <option key={n} value={n} className="bg-gray-900">{n}</option>
                  ))}
                </select>
              </div>

              {/* Algorithm selector */}
              <div>
                <label className="text-xs text-paper/40 font-mono block mb-2">
                  ▸ Algorithm
                </label>
                <div className="space-y-2">
                  {ALGO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAlgorithm(opt.value)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all duration-200"
                      style={{
                        borderColor: algorithm === opt.value ? "#f59e0b" : "rgba(245,158,11,0.1)",
                        background: algorithm === opt.value ? "rgba(245,158,11,0.1)" : "transparent",
                      }}
                    >
                      <span className="text-sm font-mono text-paper">{opt.label}</span>
                      <span className="text-xs font-mono text-paper/30">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Find Route button */}
              <button
                onClick={handleFind}
                disabled={loading || !graphData}
                className="w-full py-4 rounded-xl font-display text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-50"
                style={{
                  background: loading ? "rgba(245,158,11,0.3)" : "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#0a0a0f",
                }}
              >
                {loading ? "Computing..." : "Find Shortest Route"}
              </button>

              {/* Compare all */}
              <button
                onClick={handleCompare}
                disabled={comparing || !graphData}
                className="w-full py-3 rounded-xl font-mono text-xs tracking-widest uppercase border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 transition-all duration-200 disabled:opacity-50"
              >
                {comparing ? "Comparing..." : "Compare All Algorithms"}
              </button>
            </div>

            {/* Result card */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl border border-amber-500/20 p-6 space-y-4"
                  style={{ background: "rgba(245,158,11,0.05)" }}
                >
                  <p className="text-xs tracking-widest text-amber-500 uppercase font-display">
                    Route Result
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/5 p-3 text-center">
                      <p className="text-2xl font-display text-amber-400">{result.distance_km}</p>
                      <p className="text-xs text-paper/40 font-mono">km total</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-3 text-center">
                      <p className="text-2xl font-display text-teal-400">{result.hops}</p>
                      <p className="text-xs text-paper/40 font-mono">stops</p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-white/5 p-3 text-center">
                      <p className="text-xl font-display text-paper">{result.execution_time_ms.toFixed(4)}</p>
                      <p className="text-xs text-paper/40 font-mono">ms execution time</p>
                    </div>
                  </div>

                  {/* Path sequence */}
                  <div>
                    <p className="text-xs text-paper/40 font-mono mb-2">Route sequence:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.path.map((node, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span
                            className="text-xs font-mono px-2 py-1 rounded"
                            style={{
                              background: i === 0 ? "rgba(245,158,11,0.3)"
                                : i === result.path.length - 1 ? "rgba(20,184,166,0.3)"
                                  : "rgba(245,240,232,0.1)",
                              color: i === 0 ? "#fbbf24"
                                : i === result.path.length - 1 ? "#2dd4bf"
                                  : "#f5f0e8",
                            }}
                          >
                            {node}
                          </span>
                          {i < result.path.length - 1 && (
                            <span className="text-amber-500/40 text-xs">→</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-xs font-mono text-red-400">{error}</p>
              </div>
            )}
          </motion.div>

          {/* Right panel — visualization */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Tabs */}
            <div className="flex gap-2">
              {(["map", "compare"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all duration-200"
                  style={{
                    background: tab === t ? "rgba(245,158,11,0.2)" : "transparent",
                    border: `1px solid ${tab === t ? "#f59e0b" : "rgba(245,158,11,0.15)"}`,
                    color: tab === t ? "#fbbf24" : "rgba(245,240,232,0.4)",
                  }}
                >
                  {t === "map" ? "▸ Route Map" : "▸ Algorithm Comparison"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === "map" ? (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {graphData ? (
                    <GraphCanvas
                      graphData={graphData}
                      path={result?.path || []}
                      source={source}
                      target={target}
                    />
                  ) : (
                    <div className="rounded-xl border border-amber-500/15 h-64 flex items-center justify-center">
                      <p className="text-paper/30 font-mono text-sm">Connecting to backend...</p>
                    </div>
                  )}

                  {/* How it works */}
                  {!result && (
                    <div className="mt-4 rounded-xl border border-amber-500/10 p-5"
                      style={{ background: "rgba(245,158,11,0.03)" }}>
                      <p className="text-xs text-amber-500 font-mono mb-3 tracking-widest uppercase">How it works</p>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { step: "01", title: "Build Graph", desc: "Surabaya districts as nodes, roads as weighted edges" },
                          { step: "02", title: "Run Algorithm", desc: "Dijkstra explores nodes by cumulative distance greedily" },
                          { step: "03", title: "Trace Path", desc: "Backtrack from destination through predecessor map" },
                        ].map((item) => (
                          <div key={item.step} className="space-y-2">
                            <p className="text-xl font-display text-amber-500/30">{item.step}</p>
                            <p className="text-xs font-mono text-paper/70">{item.title}</p>
                            <p className="text-xs font-mono text-paper/30 leading-relaxed">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="compare"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-amber-500/15 p-6"
                  style={{ background: "rgba(245,158,11,0.03)" }}
                >
                  {comparison ? (
                    <ComparisonPanel data={comparison} />
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center gap-3">
                      <p className="text-paper/30 font-mono text-sm">No comparison data yet.</p>
                      <button
                        onClick={handleCompare}
                        className="text-xs font-mono text-teal-400 hover:text-teal-300 underline"
                      >
                        Run comparison now
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Map also shows route on graph when comparison is done */}
            {tab === "compare" && graphData && result && (
              <div>
                <p className="text-xs text-paper/30 font-mono mb-2">Dijkstra optimal path on map:</p>
                <GraphCanvas
                  graphData={graphData}
                  path={result.path}
                  source={source}
                  target={target}
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-paper/20 font-mono">
          EF234405 Design & Analysis of Algorithms — Quiz 2 · RouteForge
        </footer>
      </div>
    </div>
  );
}
