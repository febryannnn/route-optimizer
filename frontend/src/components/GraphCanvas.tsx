"use client";

import { useMemo } from "react";
import type { GraphData } from "@/lib/api";

interface GraphCanvasProps {
  graphData: GraphData;
  path: string[];
  source: string;
  target: string;
}

const W = 720;
const H = 500;
const PAD = 70;

function project(pos: [number, number], all: Record<string, [number, number]>): [number, number] {
  const xs = Object.values(all).map((p) => p[0]);
  const ys = Object.values(all).map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return [
    PAD + ((pos[0] - minX) / (maxX - minX || 1)) * (W - 2 * PAD),
    PAD + ((maxY - pos[1]) / (maxY - minY || 1)) * (H - 2 * PAD),
  ];
}

export default function GraphCanvas({ graphData, path, source, target }: GraphCanvasProps) {
  const pathSet = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < path.length - 1; i++) {
      s.add(`${path[i]}-${path[i + 1]}`);
      s.add(`${path[i + 1]}-${path[i]}`);
    }
    return s;
  }, [path]);

  const positions = useMemo(() => {
    const p: Record<string, [number, number]> = {};
    const raw = graphData.positions as Record<string, [number, number]>;
    for (const [name, pos] of Object.entries(raw)) p[name] = project(pos, raw);
    return p;
  }, [graphData.positions]);

  return (
    <div className="graph-frame relative w-full">
      <div className="corner-mark corner-tl" style={{ top: 6, left: 6 }} />
      <div className="corner-mark corner-tr" style={{ top: 6, right: 6 }} />
      <div className="corner-mark corner-bl" style={{ bottom: 6, left: 6 }} />
      <div className="corner-mark corner-br" style={{ bottom: 6, right: 6 }} />

      {/* Scan line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: 0.06 }}>
        <div className="scan-line absolute w-full" style={{
          height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
        }} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minHeight: 320 }}>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="grid" width={W / 12} height={H / 8} patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2={W / 12} y2="0" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
            <line x1="0" y1="0" x2="0" y2={H / 8} stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width={W} height={H} fill="url(#grid)" />

        {/* Coordinate ticks */}
        {Array.from({ length: 7 }).map((_, i) => {
          const x = PAD + (i * (W - 2 * PAD)) / 6;
          return <line key={`tx${i}`} x1={x} y1={H - 12} x2={x} y2={H - 6} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />;
        })}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = PAD + (i * (H - 2 * PAD)) / 4;
          return <line key={`ty${i}`} x1={6} y1={y} x2={12} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />;
        })}

        {/* Edges */}
        {graphData.edges.map(([u, v, w], i) => {
          const [x1, y1] = positions[u] || [0, 0];
          const [x2, y2] = positions[v] || [0, 0];
          const on = pathSet.has(`${u}-${v}`);
          return (
            <g key={`e${i}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={on ? "#ffffff" : "rgba(255,255,255,0.04)"}
                strokeWidth={on ? 2 : 0.7}
                strokeDasharray={on ? "8 5" : undefined}
                className={on ? "edge-animated" : undefined}
                filter={on ? "url(#glow)" : undefined} />
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6}
                fill={on ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)"}
                fontSize={on ? 10 : 8}
                fontFamily="var(--font-mono)" fontWeight={on ? 500 : 300} textAnchor="middle">
                {w}km
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {graphData.nodes.map((name) => {
          const [cx, cy] = positions[name] || [0, 0];
          const isSrc = name === source;
          const isDst = name === target;
          const onPath = path.includes(name);
          const isMid = onPath && !isSrc && !isDst;

          let fill = "rgba(255,255,255,0.03)";
          let stroke = "rgba(255,255,255,0.1)";
          let r = 8;
          let labelColor = "rgba(255,255,255,0.35)";

          if (isSrc) { fill = "#ffffff"; stroke = "#ffffff"; r = 12; labelColor = "#ffffff"; }
          else if (isDst) { fill = "var(--teal)"; stroke = "var(--teal)"; r = 12; labelColor = "var(--teal)"; }
          else if (isMid) { fill = "rgba(255,255,255,0.15)"; stroke = "rgba(255,255,255,0.5)"; r = 10; labelColor = "rgba(255,255,255,0.8)"; }

          return (
            <g key={name}>
              {(isSrc || isDst) && (
                <circle cx={cx} cy={cy} r={14} fill="none"
                  stroke={isSrc ? "rgba(255,255,255,0.3)" : "rgba(62,207,180,0.3)"}
                  strokeWidth={0.8} className="pulse-ring" />
              )}
              {(isSrc || isDst) && (
                <circle cx={cx} cy={cy} r={r + 5} fill="none"
                  stroke={isSrc ? "rgba(255,255,255,0.12)" : "rgba(62,207,180,0.12)"}
                  strokeWidth={0.7} strokeDasharray="3 3" />
              )}
              <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={1.2}
                filter={(isSrc || isDst) ? "url(#nodeGlow)" : undefined} />
              <text x={cx} y={cy - r - 7} fill={labelColor}
                fontSize={isSrc || isDst ? 11 : 9}
                fontFamily="var(--font-sans)" fontWeight={isSrc || isDst ? 700 : 400}
                textAnchor="middle">
                {name}
              </text>
              {onPath && (
                <text x={cx} y={cy + 3.5}
                  fill={isSrc ? "#000" : isDst ? "#000" : "#fff"}
                  fontSize={8} fontFamily="var(--font-mono)" fontWeight={600} textAnchor="middle">
                  {path.indexOf(name) + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex gap-5 items-center text-[10px] font-medium" style={{ color: "var(--w30)" }}>
        <span className="flex items-center gap-[6px]">
          <span className="inline-block w-[7px] h-[7px] rounded-full" style={{ background: "#fff" }} /> Origin
        </span>
        <span className="flex items-center gap-[6px]">
          <span className="inline-block w-[7px] h-[7px] rounded-full" style={{ background: "var(--teal)" }} /> Destination
        </span>
        <span className="flex items-center gap-[6px]">
          <span className="inline-block w-[7px] h-[7px] rounded-full" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.5)" }} /> On route
        </span>
      </div>

      <div className="absolute top-4 right-4 text-[9px] font-medium" style={{ color: "var(--w08)", fontFamily: "var(--font-mono)" }}>
        Surabaya District Graph
      </div>
    </div>
  );
}