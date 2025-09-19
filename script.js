function parseVertices(raw) {
    const parts = raw.split(/\s+/).map(v => v.trim()).filter(Boolean);
    const seen = new Set();
    const uniq = [];
    for (const v of parts) {
        if (!seen.has(v)) { seen.add(v); uniq.push(v); }
    }
    return uniq;
}

function parseEdges(rawLines, verticesSet) {
    const edges = [];
    const errors = [];
    const lines = rawLines.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i].trim();
        if (!raw) continue;
        const parts = raw.split(/\s+/).filter(Boolean);
        if (parts.length !== 3) {
            errors.push(`Line ${i+1}: must have exactly 3 fields: u v w`);
            continue;
        }
        const [u, v, wRaw] = parts;
        if (!verticesSet.has(u) || !verticesSet.has(v)) {
            errors.push(`Line ${i+1}: unknown vertex in '${raw}'`);
            continue;
        }
        const w = Number(wRaw);
        if (!Number.isFinite(w)) {
            errors.push(`Line ${i+1}: weight must be a number`);
            continue;
        }
        if (w < 0) {
            errors.push(`Line ${i+1}: negative weights not allowed for Dijkstra`);
            continue;
        }
        edges.push([u, v, w]);
    }
    return { edges, errors };
}

function buildAdjacency(vertices, edges, directed) {
    const adj = new Map();
    for (const v of vertices) adj.set(v, []);
    for (const [u, v, w] of edges) {
        adj.get(u).push([v, w]);
        if (!directed) adj.get(v).push([u, w]);
    }
    return adj;
}

function dijkstra(adj, source) {
    const dist = new Map();
    const prev = new Map();
    for (const v of adj.keys()) { dist.set(v, Infinity); prev.set(v, null); }
    dist.set(source, 0);

    // Simple array-based priority queue
    const pq = [[0, source]]; // [distance, vertex]
    const visited = new Set();

    while (pq.length > 0) {
        // extract min
        let minIndex = 0;
        for (let i = 1; i < pq.length; i++) {
            if (pq[i][0] < pq[minIndex][0]) minIndex = i;
        }
        const [d, u] = pq.splice(minIndex, 1)[0];
        if (visited.has(u)) continue;
        visited.add(u);

        const neighbors = adj.get(u) || [];
        for (const [v, w] of neighbors) {
            if (visited.has(v)) continue;
            const cand = d + w;
            if (cand < dist.get(v)) {
                dist.set(v, cand);
                prev.set(v, u);
                pq.push([cand, v]);
            }
        }
    }
    return { dist, prev };
}

function reconstructPath(prev, source, target) {
    if (source === target && prev.get(target) === null) return [source];
    const path = [];
    let cur = target;
    while (cur !== null) { path.push(cur); if (cur === source) break; cur = prev.get(cur); }
    if (path[path.length - 1] !== source) return null; // unreachable
    return path.reverse();
}

function formatPathsHtml(dist, prev, source) {
    const vertices = Array.from(dist.keys()).sort();
    let html = '';
    html += `<div style="margin-bottom:8px;font-weight:600">Shortest paths from source '${source}':</div>`;
    html += '<div style="display:grid; gap:6px">';
    for (const v of vertices) {
        const d = dist.get(v);
        if (d === Infinity) {
            html += `<div class="hint">${v}: unreachable</div>`;
        } else {
            const path = reconstructPath(prev, source, v);
            const pathStr = path ? path.join(' -> ') : '(path unavailable)';
            const costStr = d;
            html += `<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
                <span>${v}: ${pathStr} (cost ${costStr})</span>
                <button type=\"button\" class=\"secondary\" data-path-target=\"${v}\">Highlight path</button>
            </div>`;
        }
    }
    html += `<div style=\"margin-top:6px\"><button type=\"button\" id=\"clear-highlight\" class=\"secondary\">Clear highlight</button></div>`;
    html += '</div>';
    return html;
}

function setMessage(text) {
    const el = document.getElementById('messages');
    el.textContent = text || '';
}

function setOutput(text) {
    const el = document.getElementById('output');
    if (!text) {
        el.style.display = 'none';
        el.textContent = '';
    } else {
        el.style.display = 'block';
        el.textContent = text;
    }
}

function setOutputHtml(html) {
	const el = document.getElementById('output');
	if (!html) {
		el.style.display = 'none';
		el.innerHTML = '';
	} else {
		el.style.display = 'block';
		el.innerHTML = html;
	}
}

function updateSourceOptions(vertices) {
    const sel = document.getElementById('source');
    const prev = sel.value;
    sel.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '-- select source --';
    sel.appendChild(defaultOpt);
    for (const v of vertices) {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v; sel.appendChild(opt);
    }
    if (vertices.includes(prev)) sel.value = prev;
}

function loadDemo() {
    document.getElementById('vertices').value = 'A B C D';
    document.getElementById('edges').value = ['A B 1','B C 2','A C 4','C D 1','B D 5'].join('\n');
    document.getElementById('directed').checked = false;
    updateSourceOptions(['A','B','C','D']);
    document.getElementById('source').value = 'A';
    setMessage('Demo loaded. Click Compute.');
    setOutput('');
}

function compute() {
    setMessage('');
    setOutput('');
    const verticesRaw = document.getElementById('vertices').value.trim();
    const edgesRaw = document.getElementById('edges').value;
    const directed = document.getElementById('directed').checked;
    const source = document.getElementById('source').value;

    const vertices = parseVertices(verticesRaw);
    if (vertices.length === 0) { setMessage('Please enter at least one vertex.'); return; }
    const vset = new Set(vertices);
    updateSourceOptions(vertices);
    if (!source || !vset.has(source)) { setMessage('Please select a valid source vertex.'); return; }

    const { edges, errors } = parseEdges(edgesRaw, vset);
    if (errors.length > 0) { setMessage(errors.join(' | ')); return; }

    const adj = buildAdjacency(vertices, edges, directed);
    const { dist, prev } = dijkstra(adj, source);
    setOutputHtml(formatPathsHtml(dist, prev, source));

    // Wire highlight buttons
    const outputEl = document.getElementById('output');
    outputEl.querySelectorAll('button[data-path-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-path-target');
            if (!target) return;
            const path = reconstructPath(prev, source, target);
            if (path && window.visApi && window.visApi.highlightPath) {
                window.visApi.highlightPath(path);
            }
        });
    });
    const clearBtn = document.getElementById('clear-highlight');
    if (clearBtn) clearBtn.addEventListener('click', () => {
        if (window.visApi && window.visApi.clearHighlight) window.visApi.clearHighlight();
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const verticesEl = document.getElementById('vertices');
    verticesEl.addEventListener('input', () => {
        const vertices = parseVertices(verticesEl.value.trim());
        updateSourceOptions(vertices);
        setMessage('');
        setOutput('');
    });
    document.getElementById('populate-demo').addEventListener('click', loadDemo);
    document.getElementById('compute').addEventListener('click', compute);

    // Visualization setup
    setupVisualization();
});

// ================= Visualization =================
function setupVisualization() {
    const canvas = document.getElementById('vis-canvas');
    const ctx = canvas.getContext('2d');
    const btnStart = document.getElementById('vis-start');
    const btnPause = document.getElementById('vis-pause');
    const btnReset = document.getElementById('vis-reset');
    const speedInput = document.getElementById('vis-speed');

    let layout = null; // {positions: Map<vertex,{x,y}>, edges:[{u,v,w}]}
    let state = null;  // animation state
    let running = false;
    let rafId = null;
    let lastTick = 0;

    function getSpeedMs() {
        // 0..1000 -> 50..1200ms per step
        const v = Number(speedInput.value || 400);
        return 50 + (1000 - v) * 1.15;
    }

    function buildFromInputs() {
        const vertices = parseVertices(document.getElementById('vertices').value.trim());
        const vset = new Set(vertices);
        const { edges, errors } = parseEdges(document.getElementById('edges').value, vset);
        const directed = document.getElementById('directed').checked;
        const source = document.getElementById('source').value;
        if (errors.length || vertices.length === 0 || !source || !vset.has(source)) {
            return null;
        }
        return { vertices, edges, directed, source };
    }

    function computeLayout(vertices) {
        // circular layout
        const positions = new Map();
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.38;
        const n = vertices.length;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 - Math.PI/2;
            const x = cx + radius * Math.cos(a);
            const y = cy + radius * Math.sin(a);
            positions.set(vertices[i], { x, y });
        }
        return positions;
    }

    function drawGraph(base, highlight) {
        // base: {positions, edges, source}
        // highlight: {relax:[u,v], visited:Set, dist:Map, pathEdges:Set, pathVerts:Set, adjEdges:Set}
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // edges
        ctx.lineWidth = 2;
        for (const e of base.edges) {
            const { u, v, w } = e;
            const a = base.positions.get(u);
            const b = base.positions.get(v);
            const relaxing = highlight.relax && highlight.relax[0] === u && highlight.relax[1] === v;
            const key = `${u}|${v}`;
            const onPath = highlight.pathEdges && highlight.pathEdges.has(key);
            const isAdj = highlight.adjEdges && highlight.adjEdges.has(key);
            if (relaxing) {
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 4;
            } else if (onPath) {
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 4;
            } else if (isAdj) {
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 3;
            } else {
                ctx.strokeStyle = '#7aa2f7';
                ctx.lineWidth = 2;
            }
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            // weight label
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            ctx.fillStyle = '#c7d2fe';
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText(String(w), mx + 4, my - 4);
        }

        // nodes
        for (const [v, p] of base.positions.entries()) {
            const isSrc = v === base.source;
            const isVisited = highlight.visited.has(v);
            const isOnPath = highlight.pathVerts && highlight.pathVerts.has(v);
            ctx.beginPath();
            ctx.fillStyle = isSrc ? '#ef4444' : (isOnPath ? '#f59e0b' : (isVisited ? '#34d399' : '#334155'));
            ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
            ctx.fill();
            // label
            ctx.fillStyle = '#e6e9ef';
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const d = highlight.dist.get(v);
            const distStr = d === Infinity ? '∞' : d.toFixed(0);
            ctx.fillText(v, p.x, p.y - 14);
            ctx.fillText(distStr, p.x, p.y + 6);
        }
    }

    function prepareAnimation(adj, source) {
        // Build steps: sequence of edge relax attempts from the algorithm
        const dist = new Map();
        for (const v of adj.keys()) dist.set(v, Infinity);
        dist.set(source, 0);
        const visited = new Set();
        const pq = [[0, source]];
        const steps = [];
        while (pq.length) {
            let mi = 0; for (let i = 1; i < pq.length; i++) if (pq[i][0] < pq[mi][0]) mi = i;
            const [d, u] = pq.splice(mi, 1)[0];
            if (visited.has(u)) continue;
            steps.push({ type: 'visit', u });
            visited.add(u);
            const neighbors = adj.get(u) || [];
            for (const [v, w] of neighbors) {
                if (visited.has(v)) continue;
                const cand = d + w;
                steps.push({ type: 'relax', u, v, cand, prev: dist.get(v) });
                if (cand < dist.get(v)) {
                    dist.set(v, cand);
                    pq.push([cand, v]);
                    steps.push({ type: 'update', v, value: cand });
                }
            }
        }
        return steps;
    }

    function rebuildLayout() {
        const cfg = buildFromInputs();
        if (!cfg) return false;
        const { vertices, edges, directed, source } = cfg;
        const positions = computeLayout(vertices);
        const adj = buildAdjacency(vertices, edges, directed);
        const base = {
            positions,
            edges: edges.map(([u, v, w]) => ({ u, v, w })),
            source
        };
        const dist = new Map(Array.from(positions.keys()).map(v => [v, v === source ? 0 : Infinity]));
        layout = { base, adj, vertices, source };
        state = {
            stepIndex: 0,
            steps: prepareAnimation(adj, source),
            visited: new Set(),
            dist,
            pathEdges: undefined,
            pathVerts: undefined,
            adjEdges: undefined
        };
        drawGraph(layout.base, { relax: null, visited: state.visited, dist: state.dist, pathEdges: state.pathEdges, pathVerts: state.pathVerts, adjEdges: state.adjEdges });
        return true;
    }

    function stepOnce() {
        if (!layout || !state) return false;
        if (state.stepIndex >= state.steps.length) return false;
        const s = state.steps[state.stepIndex++];
        if (s.type === 'visit') {
            state.visited.add(s.u);
            // highlight adjacent edges of current vertex
            const adjSet = new Set();
            const neighbors = layout.adj.get(s.u) || [];
            for (const [v] of neighbors) {
                adjSet.add(`${s.u}|${v}`);
                adjSet.add(`${v}|${s.u}`);
            }
            state.adjEdges = adjSet;
        } else if (s.type === 'relax') {
            // keep adjacent edges of the current vertex highlighted
            if (!state.adjEdges) {
                const adjSet = new Set();
                const neighbors = layout.adj.get(s.u) || [];
                for (const [v] of neighbors) {
                    adjSet.add(`${s.u}|${v}`);
                    adjSet.add(`${v}|${s.u}`);
                }
                state.adjEdges = adjSet;
            }
            drawGraph(layout.base, { relax: [s.u, s.v], visited: state.visited, dist: state.dist, pathEdges: state.pathEdges, pathVerts: state.pathVerts, adjEdges: state.adjEdges });
        } else if (s.type === 'update') {
            state.dist.set(s.v, s.value);
        }
        drawGraph(layout.base, { relax: null, visited: state.visited, dist: state.dist, pathEdges: state.pathEdges, pathVerts: state.pathVerts, adjEdges: state.adjEdges });
        return true;
    }

    function loop(ts) {
        if (!running) return;
        if (lastTick === 0) lastTick = ts;
        const dt = ts - lastTick;
        const speedMs = getSpeedMs();
        if (dt >= speedMs) {
            lastTick = ts;
            const progressed = stepOnce();
            if (!progressed) { running = false; cancelAnimationFrame(rafId); rafId = null; return; }
        }
        rafId = requestAnimationFrame(loop);
    }

    function start() {
        if (!layout) {
            if (!rebuildLayout()) { setMessage('Please enter valid inputs and select a source.'); return; }
        }
        if (running) return;
        running = true;
        lastTick = 0;
        rafId = requestAnimationFrame(loop);
    }

    function pause() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
    }

    function reset() {
        pause();
        layout = null; state = null;
        if (!rebuildLayout()) {
            // clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    btnStart.addEventListener('click', start);
    btnPause.addEventListener('click', pause);
    btnReset.addEventListener('click', reset);

    // Expose API for external path highlighting
    window.visApi = {
        highlightPath: (pathVerts) => {
            if (!layout || !state) { rebuildLayout(); }
            if (!layout || !state) return;
            const edgesSet = new Set();
            for (let i = 0; i + 1 < pathVerts.length; i++) {
                const a = pathVerts[i], b = pathVerts[i+1];
                edgesSet.add(`${a}|${b}`);
                edgesSet.add(`${b}|${a}`); // cover undirected rendering
            }
            state.pathEdges = edgesSet;
            state.pathVerts = new Set(pathVerts);
            drawGraph(layout.base, { relax: null, visited: state.visited, dist: state.dist, pathEdges: state.pathEdges, pathVerts: state.pathVerts });
        },
        clearHighlight: () => {
            if (!layout || !state) return;
            state.pathEdges = undefined;
            state.pathVerts = undefined;
            drawGraph(layout.base, { relax: null, visited: state.visited, dist: state.dist, pathEdges: state.pathEdges, pathVerts: state.pathVerts });
        }
    };

    // Rebuild layout on input changes
    const inputs = ['vertices','edges','directed','source'];
    for (const id of inputs) {
        document.getElementById(id).addEventListener('input', () => {
            layout = null; state = null; pause();
            rebuildLayout();
        });
        document.getElementById(id).addEventListener('change', () => {
            layout = null; state = null; pause();
            rebuildLayout();
        });
    }

    // initial draw
    rebuildLayout();
}