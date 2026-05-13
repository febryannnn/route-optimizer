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
const H = 480;
const PAD = 72;

function project(
  pos: [number, number],
  all: Record<string, [number, number]>
): [number, number] {
  const xs = Object.values(all).map((p) => p[0]);
  const ys = Object.values(all).map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return [
    PAD + ((pos[0] - minX) / (maxX - minX || 1)) * (W - 2 * PAD),
    PAD + ((maxY - pos[1]) / (maxY - minY || 1)) * (H - 2 * PAD),
  ];
}

function midpoint(
  [x1, y1]: [number, number],
  [x2, y2]: [number, number],
  t = 0.5
): [number, number] {
  return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
}

export default function GraphCanvas({
  graphData,
  path,
  source,
  target,
}: GraphCanvasProps) {
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
    for (const [name, pos] of Object.entries(raw))
      p[name] = project(pos, raw);
    return p;
  }, [graphData.positions]);

  return (
    <div className="graph-frame relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ minHeight: 300 }}
      >
        <defs>
          {/* Route glow bloom */}
          <filter id="routeBloom" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node drop shadow */}
          <filter id="nodeDrop" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(45,42,38,0.15)" />
          </filter>

          {/* Origin glow */}
          <filter id="originGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="var(--sand)" floodOpacity="0.3" />
          </filter>

          {/* Dest glow */}
          <filter id="destGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="var(--sage)" floodOpacity="0.3" />
          </filter>

          {/* Dot grid pattern */}
          <pattern id="dotGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="var(--border)" />
          </pattern>
        </defs>

        {/* Background */}
        <rect width={W} height={H} fill="var(--bg-card)" />
        <rect width={W} height={H} fill="url(#dotGrid)" />

        {/* ── Inactive edges ── */}
        {graphData.edges.map(([u, v, w], i) => {
          const [x1, y1] = positions[u] || [0, 0];
          const [x2, y2] = positions[v] || [0, 0];
          if (pathSet.has(`${u}-${v}`)) return null;
          const [mx, my] = midpoint([x1, y1], [x2, y2]);
          return (
            <g key={`off-${i}`}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="var(--border-med)"
                strokeWidth={1}
                strokeLinecap="round"
              />
              <text
                x={mx} y={my - 8}
                fill="var(--text-faint)"
                fontSize={8}
                fontFamily="var(--font-mono)"
                fontWeight={400}
                textAnchor="middle"
              >
                {w}
              </text>
            </g>
          );
        })}

        {/* ── Active route edges ── */}
        {graphData.edges.map(([u, v, w], i) => {
          const [x1, y1] = positions[u] || [0, 0];
          const [x2, y2] = positions[v] || [0, 0];
          if (!pathSet.has(`${u}-${v}`)) return null;
          const [mx, my] = midpoint([x1, y1], [x2, y2]);
          const lw = 24; const lh = 15; /* label bubble size */
          return (
            <g key={`on-${i}`}>
              {/* Soft glow track */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(192,144,96,0.12)"
                strokeWidth={8}
                strokeLinecap="round"
              />
              {/* Animated dashed route */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="var(--sand-solid)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray="10 6"
                className="edge-animated"
                filter="url(#routeBloom)"
              />
              {/* Solid label bubble */}
              <rect
                x={mx - lw / 2} y={my - lh - 6}
                width={lw} height={lh}
                rx={5}
                fill="var(--sand)"
              />
              <text
                x={mx} y={my - lh / 2 - 6 + 4.5}
                fill="#fff"
                fontSize={8.5}
                fontFamily="var(--font-mono)"
                fontWeight={700}
                textAnchor="middle"
              >
                {w}km
              </text>
            </g>
          );
        })}

        {/* ── Nodes ── */}
        {graphData.nodes.map((name) => {
          const [cx, cy] = positions[name] || [0, 0];
          const isSrc  = name === source;
          const isDst  = name === target;
          const onPath = path.includes(name);
          const isMid  = onPath && !isSrc && !isDst;

          const r = isSrc || isDst ? 11 : isMid ? 9 : 6.5;

          let fill        = "var(--bg-elevated)";
          let stroke      = "var(--border-med)";
          let strokeW     = 1;
          let labelColor  = "var(--text-muted)";
          let labelWeight = "400";
          let filter      = "url(#nodeDrop)";
          let numColor    = "var(--text-body)";

          if (isSrc) {
            fill = "#fff"; stroke = "var(--sand)";
            strokeW = 2; labelColor = "var(--sand-dark)"; labelWeight = "700";
            filter = "url(#originGlow)"; numColor = "var(--sand-dark)";
          } else if (isDst) {
            fill = "#fff"; stroke = "var(--sage)";
            strokeW = 2; labelColor = "var(--sage-dark)"; labelWeight = "700";
            filter = "url(#destGlow)"; numColor = "var(--sage-dark)";
          } else if (isMid) {
            fill = "var(--bg-card)"; stroke = "var(--sand-solid)";
            strokeW = 1.8; labelColor = "var(--sand)"; labelWeight = "600";
          }

          return (
            <g key={name}>
              {/* Pulse ring for src / dst */}
              {(isSrc || isDst) && (
                <circle
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={isSrc ? "rgba(192,144,96,0.3)" : "rgba(91,136,112,0.3)"}
                  strokeWidth={1}
                  className="pulse-ring"
                />
              )}
              {/* Outer halo for mid-path */}
              {isMid && (
                <circle
                  cx={cx} cy={cy} r={r + 4}
                  fill="rgba(192,144,96,0.05)"
                  stroke="rgba(192,144,96,0.15)"
                  strokeWidth={1}
                />
              )}
              {/* Main node */}
              <circle
                cx={cx} cy={cy} r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeW}
                filter={filter}
              />
              {/* Step number */}
              {onPath && (
                <text
                  x={cx} y={cy + 3.5}
                  fill={numColor}
                  fontSize={isSrc || isDst ? 8.5 : 7.5}
                  fontFamily="var(--font-mono)"
                  fontWeight={700}
                  textAnchor="middle"
                >
                  {path.indexOf(name) + 1}
                </text>
              )}
              {/* Label */}
              <text
                x={cx} y={cy - r - 7}
                fill={labelColor}
                fontSize={isSrc || isDst ? 10.5 : 9}
                fontFamily="var(--font-sans)"
                fontWeight={labelWeight}
                textAnchor="middle"
              >
                {name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-[14px] left-[16px] flex gap-[18px] items-center text-[10px] font-semibold text-[var(--text-muted)] font-sans">
        <span className="flex items-center gap-[6px]">
          <span className="w-2 h-2 rounded-full border border-[var(--sand)] bg-white inline-block" />
          Origin
        </span>
        <span className="flex items-center gap-[6px]">
          <span className="w-2 h-2 rounded-full border border-[var(--sage)] bg-white inline-block" />
          Destination
        </span>
        <span className="flex items-center gap-[6px]">
          <span className="w-2 h-2 rounded-full bg-white border-2 border-[var(--sand-solid)] inline-block" />
          On route
        </span>
      </div>

      <div className="absolute top-[14px] right-[16px] text-[9px] font-mono tracking-[0.08em] text-[var(--text-faint)] uppercase">
        Surabaya District Graph
      </div>
    </div>
  );
}