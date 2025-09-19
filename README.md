DSA - Dijkstra (Web + CLI)

This project provides a simple web app and a Python CLI to compute shortest path distances from a source vertex using Dijkstra's algorithm.

## Web App (HTML/CSS/JavaScript)

Open `index.html` in your browser. No server required.

Steps:
- Enter space-separated vertices (e.g., `A B C D`).
- Paste edges (one per line) in the form `u v w` with non-negative weights.
- Toggle "Directed graph" if needed, select a source, then click Compute.
- Use "Load Demo" to try a pre-filled example quickly.

Results show the shortest distance to each vertex, or `unreachable`.

### Visualization and Animation
- A canvas graph is rendered below the inputs.
- Controls: Start, Pause, Reset, and a speed slider.
- During animation, the currently relaxing edge is highlighted, visited nodes turn green, the source node is red, and distances display inside nodes.

## Python CLI (optional)

If you prefer a terminal version, run:

```bash
python dijkstra_cli.py
```

It interactively asks for vertices, edges, directed flag, and source.

## Notes

- Dijkstra requires non-negative weights.
- For disconnected graphs, distances for unreachable vertices are reported as `unreachable`.

