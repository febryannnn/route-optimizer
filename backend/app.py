from flask import Flask, request, jsonify
from flask_cors import CORS
import heapq
import time
import itertools
import math

app = Flask(__name__)
CORS(app)

# --- Graph definition ---
# Nodes: real-ish city district names for Surabaya
NODES = {
    "Gubeng":        (0.00,  2.00),
    "Wonokromo":     (1.10,  0.10),
    "Rungkut":       (3.05,  1.15),
    "Kenjeran":      (2.15,  4.05),
    "Tambaksari":    (1.20,  3.10),

    "Tegalsari":     (-1.00,  1.05),
    "Sawahan":       (-0.82, -1.12),

    "Dukuh Pakis":   (-2.10,  2.08),

    "Sukomanunggal": (-3.00,  3.12),
    "Benowo":        (-4.15,  1.18),
    "Lakarsantri":   (-2.78, -1.06),

    "Wiyung":        (-1.92, -2.14),
    "Gayungan":      (0.12, -2.05),
    "Wonocolo":      (1.18, -1.82),

    "Tenggilis":     (3.12, -0.88),
    "Sukolilo":      (4.08,  2.18),
}

# Edges: (node1, node2, weight in km)
EDGES = [
    ("Gubeng", "Tambaksari", 2.5),
    ("Gubeng", "Wonokromo", 3.2),
    ("Gubeng", "Rungkut", 4.1),
    ("Gubeng", "Tegalsari", 3.0),
    ("Wonokromo", "Gayungan", 2.0),
    ("Wonokromo", "Tegalsari", 2.8),
    ("Wonokromo", "Sawahan", 3.5),
    ("Wonokromo", "Wonocolo", 2.2),
    ("Rungkut", "Tenggilis", 2.1),
    ("Rungkut", "Sukolilo", 3.3),
    ("Rungkut", "Tambaksari", 3.8),
    ("Kenjeran", "Tambaksari", 2.9),
    ("Kenjeran", "Sukolilo", 4.2),
    ("Tambaksari", "Tegalsari", 3.1),
    ("Tegalsari", "Dukuh Pakis", 2.4),
    ("Tegalsari", "Sawahan", 1.8),
    ("Sawahan", "Dukuh Pakis", 2.0),
    ("Sawahan", "Wiyung", 3.6),
    ("Sawahan", "Gayungan", 2.5),
    ("Dukuh Pakis", "Sukomanunggal", 2.3),
    ("Sukomanunggal", "Benowo", 3.7),
    ("Sukomanunggal", "Lakarsantri", 3.0),
    ("Benowo", "Lakarsantri", 2.8),
    ("Lakarsantri", "Wiyung", 2.2),
    ("Wiyung", "Gayungan", 2.6),
    ("Gayungan", "Wonocolo", 1.9),
    ("Wonocolo", "Tenggilis", 2.7),
    ("Tenggilis", "Sukolilo", 2.5),
]

def build_graph():
    graph = {node: [] for node in NODES}
    for u, v, w in EDGES:
        graph[u].append((v, w))
        graph[v].append((u, w))
    return graph

GRAPH = build_graph()

def dijkstra(graph, source, target):
    dist = {node: float('inf') for node in graph}
    prev = {node: None for node in graph}
    dist[source] = 0
    pq = [(0, source)]

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        if u == target:
            break
        for v, w in graph[u]:
            alt = dist[u] + w
            if alt < dist[v]:
                dist[v] = alt
                prev[v] = u
                heapq.heappush(pq, (alt, v))

    # Reconstruct path
    path = []
    cur = target
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()

    if path[0] != source:
        return [], float('inf')
    return path, dist[target]

def bfs_shortest(graph, source, target):
    from collections import deque
    visited = {source}
    queue = deque([(source, [source], 0.0)])
    best_path = None
    best_dist = float('inf')

    while queue:
        node, path, dist = queue.popleft()
        if node == target:
            if dist < best_dist:
                best_dist = dist
                best_path = path
            continue
        for neighbor, weight in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor], dist + weight))

    return best_path or [], best_dist

def brute_force(graph, source, target):
    """Try all simple paths, return shortest. Very slow for large graphs."""
    from collections import defaultdict

    best = [None, float('inf')]

    def dfs(node, path, dist, visited):
        if node == target:
            if dist < best[1]:
                best[0] = list(path)
                best[1] = dist
            return
        for neighbor, weight in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                path.append(neighbor)
                dfs(neighbor, path, dist + weight, visited)
                path.pop()
                visited.remove(neighbor)

    dfs(source, [source], 0.0, {source})
    return best[0] or [], best[1]

def path_total_distance(path, graph):
    total = 0.0
    adj = {u: {v: w for v, w in neighbors} for u, neighbors in graph.items()}
    for i in range(len(path) - 1):
        u, v = path[i], path[i+1]
        total += adj[u].get(v, float('inf'))
    return total

@app.after_request
def after_request(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        from flask import Response
        return Response(status=200)

@app.route('/api/nodes', methods=['GET', 'OPTIONS'])
def get_nodes():
    return jsonify({
        "nodes": list(NODES.keys()),
        "positions": NODES,
        "edges": EDGES
    })

@app.route('/api/route', methods=['POST', 'OPTIONS'])
def get_route():
    data = request.json
    source = data.get('source')
    target = data.get('target')
    algorithm = data.get('algorithm', 'dijkstra')

    if not source or not target:
        return jsonify({"error": "source and target required"}), 400
    if source not in NODES or target not in NODES:
        return jsonify({"error": "Invalid node"}), 400
    if source == target:
        return jsonify({"error": "Source and target must differ"}), 400

    start_time = time.perf_counter()

    if algorithm == 'dijkstra':
        path, distance = dijkstra(GRAPH, source, target)
    elif algorithm == 'bfs':
        path, distance = bfs_shortest(GRAPH, source, target)
    elif algorithm == 'brute_force':
        path, distance = brute_force(GRAPH, source, target)
    else:
        return jsonify({"error": "Unknown algorithm"}), 400

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return jsonify({
        "algorithm": algorithm,
        "source": source,
        "target": target,
        "path": path,
        "distance_km": round(distance, 2),
        "hops": len(path) - 1,
        "execution_time_ms": round(elapsed_ms, 4),
    })

@app.route('/api/compare', methods=['POST', 'OPTIONS'])
def compare_algorithms():
    data = request.json
    source = data.get('source')
    target = data.get('target')

    if not source or not target or source not in NODES or target not in NODES:
        return jsonify({"error": "Invalid nodes"}), 400

    results = {}
    for algo in ['dijkstra', 'bfs', 'brute_force']:
        t0 = time.perf_counter()
        if algo == 'dijkstra':
            path, dist = dijkstra(GRAPH, source, target)
        elif algo == 'bfs':
            path, dist = bfs_shortest(GRAPH, source, target)
        else:
            path, dist = brute_force(GRAPH, source, target)
        elapsed = (time.perf_counter() - t0) * 1000

        results[algo] = {
            "path": path,
            "distance_km": round(dist, 2),
            "hops": len(path) - 1,
            "execution_time_ms": round(elapsed, 4),
        }

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
