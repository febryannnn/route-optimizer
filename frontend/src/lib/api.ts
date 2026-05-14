const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export interface NodePositions {
  [key: string]: [number, number];
}

export interface Edge {
  0: string;
  1: string;
  2: number;
}

export interface GraphData {
  nodes: string[];
  positions: NodePositions;
  edges: [string, string, number][];
}

export interface RouteResult {
  algorithm: string;
  source: string;
  target: string;
  path: string[];
  distance_km: number;
  hops: number;
  execution_time_ms: number;
}

export interface CompareResult {
  dijkstra: RouteResult;
  bfs: RouteResult;
  dfs: RouteResult;
  brute_force: RouteResult;
}

export async function fetchGraphData(): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/api/nodes`);
  if (!res.ok) throw new Error("Failed to fetch graph");
  return res.json();
}

export async function fetchRoute(
  source: string,
  target: string,
  algorithm: string
): Promise<RouteResult> {
  const res = await fetch(`${API_BASE}/api/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, target, algorithm }),
  });
  if (!res.ok) throw new Error("Failed to fetch route");
  return res.json();
}

export async function fetchComparison(
  source: string,
  target: string
): Promise<CompareResult> {
  const res = await fetch(`${API_BASE}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, target }),
  });
  if (!res.ok) throw new Error("Failed to fetch comparison");
  return res.json();
}
