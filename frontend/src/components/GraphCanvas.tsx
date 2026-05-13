"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { GraphData } from "@/lib/api";

interface GraphCanvasProps {
  graphData: GraphData;
  path: string[];
  source: string;
  target: string;
}

const CANVAS_W = 700;
const CANVAS_H = 480;
const PAD = 60;

function worldToCanvas(
  pos: [number, number],
  allPositions: { [k: string]: [number, number] }
): [number, number] {
  const xs = Object.values(allPositions).map((p) => p[0]);
  const ys = Object.values(allPositions).map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const cx = PAD + ((pos[0] - minX) / rangeX) * (CANVAS_W - 2 * PAD);
  const cy = PAD + ((maxY - pos[1]) / rangeY) * (CANVAS_H - 2 * PAD);
  return [cx, cy];
}

export default function GraphCanvas({ graphData, path, source, target }: GraphCanvasProps) {
  const pathSet = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    pathSet.add(`${path[i]}-${path[i + 1]}`);
    pathSet.add(`${path[i + 1]}-${path[i]}`);
  }

  const nodePositions: { [k: string]: [number, number] } = {};
  for (const [name, pos] of Object.entries(graphData.positions)) {
    nodePositions[name] = worldToCanvas(pos as [number, number], graphData.positions as { [k: string]: [number, number] });
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-amber-500/20 bg-ink-soft"
      style={{ background: "linear-gradient(135deg, #0d1117 0%, #0a0a0f 100%)" }}>
      {/* Scan line effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
        <div
          className="absolute w-full h-[2px]"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)",
            animation: "scan 4s linear infinite",
          }}
        />
      </div>

      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="w-full h-auto"
        style={{ minHeight: 300 }}
      >
        {/* Grid lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0} y1={(CANVAS_H / 7) * i}
            x2={CANVAS_W} y2={(CANVAS_H / 7) * i}
            stroke="rgba(245,158,11,0.05)" strokeWidth={1}
          />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={(CANVAS_W / 10) * i} y1={0}
            x2={(CANVAS_W / 10) * i} y2={CANVAS_H}
            stroke="rgba(245,158,11,0.05)" strokeWidth={1}
          />
        ))}

        {/* All edges */}
        {graphData.edges.map(([u, v, w], i) => {
          const [x1, y1] = nodePositions[u] || [0, 0];
          const [x2, y2] = nodePositions[v] || [0, 0];
          const isPath = pathSet.has(`${u}-${v}`);
          return (
            <g key={i}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isPath ? "#f59e0b" : "rgba(245,240,232,0.08)"}
                strokeWidth={isPath ? 2.5 : 1}
                strokeDasharray={isPath ? "6 4" : undefined}
                className={isPath ? "animated-edge" : undefined}
              />
              {/* Edge weight label */}
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 4}
                fill={isPath ? "#fbbf24" : "rgba(245,240,232,0.3)"}
                fontSize={isPath ? 10 : 9}
                fontFamily="monospace"
                textAnchor="middle"
              >
                {w}km
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {graphData.nodes.map((name) => {
          const [cx, cy] = nodePositions[name] || [0, 0];
          const isSource = name === source;
          const isTarget = name === target;
          const isOnPath = path.includes(name);
          const isIntermediate = isOnPath && !isSource && !isTarget;

          let fill = "rgba(245,240,232,0.08)";
          let stroke = "rgba(245,240,232,0.2)";
          let r = 10;

          if (isSource) { fill = "#f59e0b"; stroke = "#fbbf24"; r = 14; }
          else if (isTarget) { fill = "#14b8a6"; stroke = "#2dd4bf"; r = 14; }
          else if (isIntermediate) { fill = "rgba(245,158,11,0.3)"; stroke = "#f59e0b"; r = 12; }

          return (
            <g key={name}>
              {(isSource || isTarget) && (
                <circle cx={cx} cy={cy} r={r + 6}
                  fill="none"
                  stroke={isSource ? "rgba(245,158,11,0.4)" : "rgba(20,184,166,0.4)"}
                  strokeWidth={1}
                />
              )}
              <circle cx={cx} cy={cy} r={r}
                fill={fill} stroke={stroke} strokeWidth={1.5}
              />
              {/* Node label */}
              <text
                x={cx} y={cy - r - 5}
                fill={isSource ? "#fbbf24" : isTarget ? "#2dd4bf" : isOnPath ? "#f5f0e8" : "rgba(245,240,232,0.5)"}
                fontSize={isSource || isTarget ? 11 : 9}
                fontFamily="monospace"
                fontWeight={isSource || isTarget ? "bold" : "normal"}
                textAnchor="middle"
              >
                {name}
              </text>
              {/* Step number on path */}
              {isOnPath && (
                <text x={cx} y={cy + 4} fill="#0a0a0f" fontSize={9} fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  {path.indexOf(name) + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex gap-4 text-xs" style={{ fontFamily: "monospace" }}>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500" /> Origin
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-teal-500" /> Destination
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500" /> Route
        </span>
      </div>
    </div>
  );
}
