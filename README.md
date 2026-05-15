# RouteFinder Analytics
**EF234405 Design & Analysis of Algorithms - Quiz 2**

A web application that finds the shortest delivery route between districts in Surabaya using graph algorithms.

## Algorithms Implemented
- **Dijkstra** : Optimal shortest path using a min-heap priority queue. O((V+E) log V).
- **BFS** : Breadth-first search adapted for weighted shortest path.
- **DFS** : Depth-first traversal that returns the first valid route found. O(V+E).
- **Brute Force** : DFS over all simple paths, exponential complexity for baseline comparison.

## Tech Stack
- **Backend**: Python + Flask (REST API)
- **Frontend**: Next.js 14 + Framer Motion + Tailwind CSS

## Project Structure
```
smart-delivery/
├── backend/
│   ├── app.py              # Flask API with all algorithms
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx        # Main UI page
    │   │   ├── layout.tsx      # Root layout + fonts
    │   │   └── globals.css     # Design tokens + animations
    │   ├── components/
    │   │   ├── GraphCanvas.tsx     # SVG graph visualization
    │   │   └── ComparisonPanel.tsx # Algorithm comparison bars
    │   └── lib/
    │       └── api.ts          # API utility functions
    └── package.json
```

## Setup & Running

### Backend (Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

Then open http://localhost:3000 in your browser.

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nodes` | GET | Returns all graph nodes, positions, and edges |
| `/api/route` | POST | Find shortest path with given algorithm |
| `/api/compare` | POST | Compare all 4 algorithms side-by-side |

### Example `/api/route` request:
```json
{
  "source": "Gubeng",
  "target": "Benowo",
  "algorithm": "dijkstra"
}
```

### Example response:
```json
{
  "algorithm": "dijkstra",
  "source": "Gubeng",
  "target": "Benowo",
  "path": ["Gubeng", "Tegalsari", "Dukuh Pakis", "Sukomanunggal", "Benowo"],
  "distance_km": 12.9,
  "hops": 4,
  "execution_time_ms": 0.0821
}
```

## Graph
The graph models 16 districts in Surabaya with 29 weighted edges (road distances in km):
- Gubeng, Wonokromo, Rungkut, Kenjeran, Tambaksari, Tegalsari, Sawahan, Dukuh Pakis,
  Sukomanunggal, Benowo, Lakarsantri, Wiyung, Gayungan, Wonocolo, Tenggilis, Sukolilo

## Algorithm Complexity Summary
| Algorithm | Time | Space | Optimal? |
|-----------|------|-------|----------|
| Dijkstra | O((V+E) log V) | O(V) | ✓ Yes |
| BFS | O(V+E) | O(V) | ✗ (unweighted only) |
| DFS | O(V+E) | O(V) | ✗ |
| Brute Force | O(V!) | O(V) | ✓ Yes but slow |
