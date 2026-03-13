# PRD: Synthetic Signal Anomaly Detection via TDA

## Overview

A single-page web application that demonstrates topological data analysis (TDA) for time series anomaly detection on synthetic signals with controllable regime changes. Users generate signals with known ground truth, tune pipeline parameters via interactive controls, and see how persistent homology tracks topological changes in delay embeddings across sliding windows.

This is the "proof of correctness" demo — every parameter is controllable, every regime boundary is known, and the expected topological behavior is fully predictable. It serves as both a validated proof-of-concept and an interactive educational tool.

**No external data required.** Everything is generated client-side in the browser.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | TypeScript (strict mode) | All source code in TS |
| Build | Vite | Fast dev server + optimized production builds |
| Framework | React 18+ | Component-based UI, hooks for state |
| Charting | Plotly.js (`react-plotly.js`) | Interactive 2D/3D plots, hover, zoom, rotate |
| Styling | Tailwind CSS | Utility-first, responsive layout |
| Deployment | Cloudflare Pages | Static site, GitHub integration |

No backend. All computation runs client-side. For heavy TDA computations, use a Web Worker to avoid blocking the UI thread.

---

## Project Architecture

```
synthetic-signals/
├── docs/
│   └── PRD.md
├── public/
├── src/
│   ├── tda/                        # TDA core library (TypeScript port)
│   │   ├── distance.ts             # Stage 1: pairwise distance matrix
│   │   ├── filtration.ts           # Stage 2: Vietoris-Rips complex
│   │   ├── boundary.ts             # Stage 3: boundary matrix over Z/2Z
│   │   ├── reduction.ts            # Stage 4: column reduction algorithm
│   │   ├── persistence.ts          # Stage 5: full pipeline wrapper
│   │   ├── types.ts                # Shared types (Simplex, PersistencePair, etc.)
│   │   └── visualization.ts        # Plotly trace builders for diagrams/barcodes
│   ├── timeseries/                 # Time series utilities
│   │   ├── embedding.ts            # Takens' delay embedding
│   │   ├── windowing.ts            # Sliding window extraction
│   │   ├── features.ts             # Persistence feature summarization
│   │   └── detector.ts             # Anomaly detection pipeline
│   ├── signals/                    # Synthetic signal generators
│   │   ├── generators.ts           # All signal types
│   │   └── lorenz.ts               # Lorenz system ODE integrator
│   ├── components/                 # React components
│   │   ├── App.tsx                 # Root layout
│   │   ├── Sidebar.tsx             # Parameter controls
│   │   ├── SignalPlot.tsx          # Row 1: signal with regime bands
│   │   ├── EmbeddingExplorer.tsx   # Row 2: window selector + 3D embedding + persistence diagram
│   │   ├── FeatureTimeSeries.tsx   # Row 3: topological feature plots
│   │   ├── BarcodeViewer.tsx       # Row 4: barcode for selected window
│   │   └── EvaluationSummary.tsx   # Row 5: detection metrics table
│   ├── workers/
│   │   └── tda.worker.ts           # Web Worker for TDA computation
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## TDA Core Library — TypeScript Port

The TDA pipeline must be ported from Python to TypeScript. A complete Python reference implementation exists at `~/workspace/tda-pipeline/pipeline.ipynb`. The core pipeline has 5 stages, and the time series layer adds 4 more modules.

### Key Mathematical Context

All linear algebra in this pipeline is over **Z/2Z** — the two-element field {0, 1} where addition = XOR. There are no signs, fractions, or floating-point precision issues in the algebraic core. Entries are bits, column operations are XOR, and the boundary-of-a-boundary is always zero because each face appears an even number of times and cancels mod 2.

### Types (`src/tda/types.ts`)

```typescript
export interface Simplex {
  vertices: number[];          // sorted vertex indices, e.g. [0, 2, 5]
  dimension: number;           // k = vertices.length - 1
  filtrationValue: number;     // epsilon threshold at which this simplex enters
  filtrationIndex: number;     // position in the sorted filtration (assigned after sorting)
}

export interface PersistencePair {
  birthIndex: number;          // filtration index of the birth simplex
  deathIndex: number | null;   // filtration index of the death simplex (null = essential/infinite)
  birthValue: number;          // epsilon value at birth
  deathValue: number | null;   // epsilon value at death (null = infinite)
  dimension: number;           // homological dimension (0 = component, 1 = loop, 2 = void)
}

export interface PersistenceSummary {
  numH0: number;
  numH1: number;
  numH2: number;
  maxPersistenceH0: number;
  maxPersistenceH1: number;
  totalPersistenceH0: number;
  totalPersistenceH1: number;
  meanPersistenceH1: number;
  persistenceEntropyH1: number;   // -sum( (l_i / L) * log(l_i / L) )
}

export interface AnomalyResult {
  windowCenters: number[];
  features: Record<string, number[]>;
  anomalies: boolean[];
  pairsPerWindow: PersistencePair[][];
}
```

### Stage 1: Distance Computation (`src/tda/distance.ts`)

Compute the N x N pairwise distance matrix from a point cloud.

**Input:** `points: number[][]` — array of N points, each a d-dimensional array of coordinates.

**Output:** `number[][]` — symmetric N x N matrix where `D[i][j] = metric(points[i], points[j])`.

**Metrics to implement:**
- **Euclidean:** `d(x,y) = sqrt(sum((x_k - y_k)^2))`
- **Manhattan:** `d(x,y) = sum(|x_k - y_k|)`
- **Chebyshev:** `d(x,y) = max(|x_k - y_k|)`
- **Cosine:** `d(x,y) = 1 - dot(x,y) / (norm(x) * norm(y))`

**Main function:** `pairwiseDistances(points: number[][], metric: string): number[][]`

Only compute the upper triangle and mirror (D is symmetric, D[i][i] = 0).

**Alternate entry point (for finance app):** Also export `computePersistenceFromDistanceMatrix(distMatrix: number[][], ...)` that accepts a pre-computed distance matrix and skips Stage 1. This is needed when the distance matrix comes from correlation-to-distance conversion rather than point coordinates.

### Stage 2: Vietoris-Rips Filtration (`src/tda/filtration.ts`)

Build the Vietoris-Rips simplicial complex by enumerating all simplices up to `maxDimension`.

**Algorithm:**

1. **Vertices (0-simplices):** For each point index `i` in `[0, N)`, create a simplex `{vertices: [i], dimension: 0, filtrationValue: 0}`.

2. **Edges (1-simplices):** For each pair `(i, j)` where `i < j`, if `D[i][j] <= maxEdgeLength`, create a simplex `{vertices: [i, j], dimension: 1, filtrationValue: D[i][j]}`.

3. **Triangles (2-simplices):** For each triple `(i, j, k)` where `i < j < k`, if ALL three edges exist (i.e., all three pairwise distances <= maxEdgeLength), create a simplex with `filtrationValue = max(D[i][j], D[i][k], D[j][k])`.

4. **General k-simplices:** For each `(k+1)`-subset of vertices, check that all `C(k+1, 2)` pairwise edges exist. If so, the filtration value is the maximum pairwise distance in the subset.

**Sorting:** Sort all simplices by `(filtrationValue, dimension, vertices)` — this lexicographic ordering guarantees every face appears before the simplex it belongs to. After sorting, assign `filtrationIndex = position` to each simplex.

**Output:** Sorted array of `Simplex` objects with filtration indices assigned.

**Performance note:** For N=100, max_dim=2: up to 100 vertices + 4,950 edges + 161,700 triangles. The `maxEdgeLength` parameter is critical for pruning. For this demo, point clouds will be 50-150 points after subsampling, so this is manageable.

### Stage 3: Boundary Matrix (`src/tda/boundary.ts`)

Construct the sparse boundary matrix over Z/2Z.

**Data structure:** The matrix is stored as an array of columns, where each column is a **sorted array of row indices** (the nonzero entries). This is the only sensible representation — the matrix is extremely sparse (each column has at most `k+1` entries for a k-simplex) and all operations are set-based.

```typescript
class BoundaryMatrix {
  private columns: number[][];   // columns[j] = sorted list of nonzero row indices

  constructor(numCols: number);
  getColumn(j: number): number[];
  setColumn(j: number, rows: number[]): void;
  low(j: number): number | null;   // largest row index in column j, or null if empty
  xorColumns(target: number, source: number): void;  // columns[target] ^= columns[source]
}
```

**Building the matrix:** For each simplex in the filtration:
- If dimension = 0 (vertex): column is empty (vertices have no boundary).
- If dimension = k > 0: the boundary is the sum of all (k-1)-faces. For each vertex in the simplex, remove that vertex to get a face, look up the face's filtration index, and add it to the column's row list. Sort the row list.

**The `xorColumns` operation** is the core primitive: given two sorted arrays, compute their symmetric difference (elements in one but not both) via a two-pointer merge in O(n) time. Elements present in both arrays cancel (because 1 + 1 = 0 mod 2).

```typescript
xorColumns(target: number, source: number): void {
  const a = this.columns[target];
  const b = this.columns[source];
  const result: number[] = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] < b[j]) { result.push(a[i]); i++; }
    else if (a[i] > b[j]) { result.push(b[j]); j++; }
    else { i++; j++; }  // equal → cancel mod 2
  }
  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);
  this.columns[target] = result;
}
```

### Stage 4: Column Reduction (`src/tda/reduction.ts`)

Left-to-right Gaussian elimination over Z/2Z. This is the core algorithm of persistent homology.

**Algorithm:**
```
pivotLookup: Map<number, number> = new Map()   // pivot row → column index

for j = 0 to numCols - 1:
    while true:
        pivot = boundary.low(j)
        if pivot is null: break                  // column is zero
        if !pivotLookup.has(pivot): break        // unique pivot, done
        boundary.xorColumns(j, pivotLookup.get(pivot))  // cancel shared pivot

    if boundary.low(j) is not null:
        pivotLookup.set(boundary.low(j), j)      // record this column's pivot
```

**Extracting persistence pairs:** After reduction:
- **Pivot pair (i, j):** Column `j` has `low(j) = i`. This means simplex `j` kills the feature born at simplex `i`. Create a `PersistencePair` with `birthIndex=i, deathIndex=j, dimension=filtration[i].dimension`.
- **Essential feature:** Column `j` is zero AND index `j` is not the pivot of any other column. This simplex creates a feature that never dies. Create a `PersistencePair` with `deathIndex=null, deathValue=null`.

### Stage 5: Full Pipeline (`src/tda/persistence.ts`)

Chain stages 1-4:

```typescript
export function computePersistence(
  points: number[][],
  maxDimension: number = 2,
  maxEdgeLength: number = Infinity,
  metric: string = "euclidean"
): PersistencePair[] {
  const distMatrix = pairwiseDistances(points, metric);
  const filtration = vietorisRips(distMatrix, maxDimension, maxEdgeLength);
  const boundary = buildBoundaryMatrix(filtration);
  return reduceBoundaryMatrix(boundary, filtration);
}
```

Also provide a variant that accepts a pre-computed distance matrix:

```typescript
export function computePersistenceFromDistMatrix(
  distMatrix: number[][],
  maxDimension: number = 2,
  maxEdgeLength: number = Infinity
): PersistencePair[]
```

### Takens' Delay Embedding (`src/timeseries/embedding.ts`)

Convert a 1D time series segment into a point cloud in R^d.

Given signal `x` of length T, delay `tau`, and dimension `d`, produce `M = T - (d-1)*tau` points:

```
q_t = [x[t], x[t + tau], x[t + 2*tau], ..., x[t + (d-1)*tau]]
```

```typescript
export function takensEmbedding(
  signal: number[],
  delay: number,
  dimension: number
): number[][] {
  const N = signal.length - (dimension - 1) * delay;
  const result: number[][] = [];
  for (let t = 0; t < N; t++) {
    const point: number[] = [];
    for (let i = 0; i < dimension; i++) {
      point.push(signal[t + i * delay]);
    }
    result.push(point);
  }
  return result;
}
```

### Sliding Windows (`src/timeseries/windowing.ts`)

Extract overlapping sub-arrays from a signal.

```typescript
export function slidingWindows(
  signal: number[],
  windowSize: number,
  stepSize: number
): number[][] {
  const windows: number[][] = [];
  for (let start = 0; start <= signal.length - windowSize; start += stepSize) {
    windows.push(signal.slice(start, start + windowSize));
  }
  return windows;
}
```

### Feature Extraction (`src/timeseries/features.ts`)

Extract summary statistics from a list of persistence pairs. For each homological dimension k:

- `numHk`: Count of pairs in dimension k
- `maxPersistenceHk`: Maximum lifespan `max(death - birth)` among finite pairs
- `totalPersistenceHk`: Sum of all lifespans
- `meanPersistenceHk`: Average lifespan
- `persistenceEntropyHk`: `-sum( (l_i / L) * log(l_i / L) )` where `l_i = death_i - birth_i` and `L = sum(l_i)`. High entropy = many features of similar persistence (noisy). Low entropy = one dominant feature (clean periodic).

Essential features (death = null) are excluded from persistence calculations.

### Anomaly Detection (`src/timeseries/detector.ts`)

Full sliding-window pipeline:

1. Extract sliding windows from signal.
2. For each window: Takens embedding -> subsample if > 150 points -> compute persistence (max_dim=1, with maxEdgeLength) -> extract features.
3. Stack features into time-indexed arrays.
4. For each feature array: compute mean and std. Flag windows where `|value - mean| > alpha * std`.
5. Return window centers, feature time series, anomaly boolean array, and persistence pairs per window.

### Visualization Helpers (`src/tda/visualization.ts`)

Build Plotly.js trace data (not render — let React components handle rendering):

```typescript
// Returns Plotly trace data for a persistence diagram
export function persistenceDiagramTraces(pairs: PersistencePair[]): Plotly.Data[];

// Returns Plotly trace data for a barcode
export function barcodeTraces(pairs: PersistencePair[]): Plotly.Data[];
```

Color convention: H0 = blue (`#1f77b4`), H1 = orange (`#ff7f0e`), H2 = green (`#2ca02c`).

---

## Synthetic Signal Generators (`src/signals/`)

Each generator returns `{ signal: number[], regimeLabels: number[] }` where `regimeLabels[t]` is an integer indicating which regime sample `t` belongs to (0 = Phase 1, 1 = Phase 2, etc.). These labels are ground truth for evaluating the anomaly detector.

### Signal 1: Sine-to-Noise Transition

Three phases:
- **Phase 1 (stable periodic):** `x(t) = A * sin(2*pi*t / T0)`. Clean sinusoid.
- **Phase 2 (transition):** `x(t) = A * sin(2*pi*t / T0) + noise(t) * ramp(t)` where `ramp(t)` goes linearly from 0 to 1 across this phase. The loop gradually degrades.
- **Phase 3 (pure noise):** `x(t) ~ Normal(0, sigma^2)`. No structure.

**Parameters:** `length`, `period`, `amplitude`, `noiseStd`, `transitionStart`, `transitionEnd`, `seed`.

### Signal 2: Frequency Shift

Two phases, no noise:
- **Phase 1:** `x(t) = sin(2*pi*t / T1)` with period T1.
- **Phase 2:** `x(t) = sin(2*pi*t / T2)` with period T2.

The signal is clean throughout. But the Takens embedding changes shape because the attractor geometry depends on the period-to-delay ratio. H1 persistence shifts even though the signal remains perfectly periodic. This demonstrates that TDA detects **structural** changes in dynamics, not just noise.

**Parameters:** `length`, `period1`, `period2`, `shiftPoint`, `transitionType` ("abrupt" | "sweep").

### Signal 3: Intermittent Bursts

Baseline clean sinusoid with short bursts of disruption at specified intervals.

**Burst types:** high-frequency noise injection, amplitude spikes, or waveform change (e.g., square wave). After each burst, the signal returns to normal.

Tests whether the detector identifies **transient** anomalies. Topological features should spike during bursts and return to baseline.

**Parameters:** `length`, `period`, `amplitude`, `burstTimes: number[]`, `burstDurations: number[]`, `burstIntensity`, `burstType`, `seed`.

### Signal 4: Lorenz Attractor (`src/signals/lorenz.ts`)

Generate a time series from the Lorenz system of ODEs:

```
dx/dt = sigma * (y - x)
dy/dt = x * (rho - z) - y
dz/dt = x * y - beta * z
```

Standard parameters: `sigma = 10`, `beta = 8/3`, `rho = 28`.

**Implement a 4th-order Runge-Kutta integrator from scratch.** Do NOT use any library — this is educational and the RK4 method is straightforward:

```typescript
function rk4Step(state: [number, number, number], dt: number, params: LorenzParams): [number, number, number] {
  const k1 = lorenzDerivatives(state, params);
  const k2 = lorenzDerivatives(addScaled(state, k1, dt/2), params);
  const k3 = lorenzDerivatives(addScaled(state, k2, dt/2), params);
  const k4 = lorenzDerivatives(addScaled(state, k3, dt), params);
  return [
    state[0] + (dt/6) * (k1[0] + 2*k2[0] + 2*k3[0] + k4[0]),
    state[1] + (dt/6) * (k1[1] + 2*k2[1] + 2*k3[1] + k4[1]),
    state[2] + (dt/6) * (k1[2] + 2*k2[2] + 2*k3[2] + k4[2]),
  ];
}
```

The key feature: **time-varying rho.** Accept a schedule as `[time, rhoValue][]` pairs with linear interpolation. Start at `rho=28` (chaotic), ramp to `rho=20` (periodic), then back to chaotic. The topological signature changes dramatically as the system crosses the bifurcation boundary.

Observe the x-component as a univariate time series. Downsample from the fine integration timestep to ~1000-5000 total output points.

**Parameters:** `sigma`, `beta`, `rhoSchedule: [number, number][]`, `dt` (integration step), `totalTime`, `downsampleFactor`, `observedComponent` ("x" | "y" | "z").

### Signal 5: Superposition / Multi-Frequency

`x(t) = A1 * sin(2*pi*f1*t) + A2 * sin(2*pi*f2*t)`

Start with one frequency. Add the second frequency partway through. The H1 signature should change from 1 persistent loop to 2 persistent loops (the two generators of the torus). If embedding dimension is high enough (d >= 4), you might even see H2 = 1 (the torus has a void).

**Parameters:** `length`, `freq1`, `freq2`, `amp1`, `amp2`, `onsetTime`, `seed`.

### Seeded PRNG

For reproducibility, implement a simple seeded pseudo-random number generator (e.g., mulberry32 or xoshiro128). This ensures the same seed produces identical signals across runs. Use this instead of `Math.random()` for all noise generation.

```typescript
function createRng(seed: number): () => number {
  // mulberry32
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
```

Also implement `normalRandom(rng)` using Box-Muller transform for Gaussian noise.

---

## UI Design

### Layout: Sidebar + Main Panel

The app is a single page with a fixed sidebar on the left (~300px) and a scrollable main panel.

### Sidebar

- **Signal type selector:** Dropdown — "Sine to Noise", "Frequency Shift", "Intermittent Bursts", "Lorenz Attractor", "Superposition".
- **Signal parameters:** Dynamic controls that change based on the selected signal type. Each signal type shows its own relevant sliders/inputs.
- **Pipeline parameters (always visible):**
  - Window size (slider, 50-300, default 100)
  - Step size (slider, 5-50, default 20)
  - Embedding delay tau (slider, 1-10, default 1)
  - Embedding dimension d (dropdown: 2/3/4/5, default 3)
  - Subsample size (slider, 50-150, default 100)
  - Max edge length percentile (slider, 50-100, default 90 — meaning use the Nth percentile of pairwise distances as the cutoff)
  - Anomaly threshold alpha (slider, 1.0-3.0, step 0.1, default 2.0)
- **Random seed:** Integer input, default 42.
- **"Generate & Analyze" button:** Triggers the full pipeline. Show a progress indicator while the Web Worker computes.

### Main Panel — Five Rows

**Row 1: The Signal**

Full-width Plotly line chart of the generated signal. Background color bands (semi-transparent rectangles) indicating regime labels — e.g., green = stable periodic, yellow = transition, red = noisy/chaotic. TDA anomaly flags shown as vertical dashed red lines.

**Row 2: Embedding Explorer**

A slider (or Plotly range slider) selects a window position along the signal. Below the slider, three columns side by side:
- **Left (30%):** The signal segment for the selected window, highlighted on the Row 1 plot (draw a semi-transparent overlay rectangle on Row 1 showing which window is selected).
- **Center (40%):** 3D scatter plot of the Takens embedding (Plotly `scatter3d`). Points colored by time index within the window (use a sequential colorscale like Viridis). In a stable periodic window, this should look like a clean loop. In a noisy window, a cloud.
- **Right (30%):** Persistence diagram for the selected window. Points plotted as (birth, death), colored by dimension. Diagonal line shown. The dominant H1 point should be far from the diagonal in normal windows and closer in anomalous windows.

**Row 3: Topological Feature Time Series**

Three vertically stacked subplots, x-axis aligned with Row 1:
- `maxPersistenceH1` over time, with regime boundaries as vertical dashed lines and anomaly threshold as horizontal dashed line.
- `persistenceEntropyH1` over time.
- `numH1` (count of H1 features) over time.

These should visually correlate with the regime changes in Row 1.

**Row 4: Barcode Viewer**

Persistence barcode for the currently selected window (from Row 2's slider). Horizontal bars colored by dimension. Updates as the user moves the window slider. Watching bars grow and shrink as you slide through a regime change is extremely intuitive.

**Row 5: Evaluation Summary**

A table showing:
- Each regime boundary (e.g., "Phase 1 -> Phase 2 at t=500")
- Whether the detector flagged it (yes/no)
- Detection latency (how many samples after the true boundary the detector first fired)
- Overall detection rate and false positive rate
- Brief textual summary: "Detected 3/3 regime changes with average latency of 12 samples. 1 false positive."

### Responsive Behavior

- On screens < 1024px, sidebar collapses to a top drawer/accordion.
- Row 2's three columns stack vertically on narrow screens.
- Plotly charts resize via `useResizeObserver` or Plotly's `responsive: true` config.

---

## Web Worker Architecture

TDA computation (especially Vietoris-Rips construction and column reduction) can take several seconds for larger point clouds. Run the full anomaly detection pipeline in a Web Worker to keep the UI responsive.

**Worker protocol:**

```typescript
// Main thread → Worker
interface WorkerRequest {
  type: "run_pipeline";
  signal: number[];
  regimeLabels: number[];
  params: {
    windowSize: number;
    stepSize: number;
    embeddingDelay: number;
    embeddingDimension: number;
    subsampleSize: number;
    maxEdgeLengthPercentile: number;
    anomalyThresholdSigma: number;
  };
}

// Worker → Main thread
interface WorkerResponse {
  type: "pipeline_complete";
  result: AnomalyResult;
}

interface WorkerProgress {
  type: "progress";
  windowsProcessed: number;
  totalWindows: number;
}
```

The worker should send progress updates so the UI can show a progress bar.

---

## Cloudflare Pages Deployment

### Build Configuration

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node.js version:** 18+

### GitHub Integration

1. Push to GitHub.
2. Connect the repo to Cloudflare Pages.
3. Set build command and output directory.
4. Every push to `main` triggers a deploy.

### `vite.config.ts` Notes

```typescript
export default defineConfig({
  build: {
    target: 'es2020',           // for BigInt support if needed
    outDir: 'dist',
  },
  worker: {
    format: 'es',               // ES module workers for Vite
  },
});
```

No environment variables or secrets needed — this app is entirely client-side.

---

## Build Order

1. **Set up the project.** `npm create vite@latest` with React + TypeScript template. Install Plotly.js, Tailwind. Verify dev server works.

2. **Implement TDA core.** Port all 5 stages from the Python reference (`~/workspace/tda-pipeline/pipeline.ipynb`). Write unit tests for each stage. Test on a known point cloud (50 points on a noisy circle — should produce one dominant H1 feature and one essential H0). This is the critical path — everything depends on the TDA core being correct.

3. **Implement time series utilities.** Port Takens embedding, sliding windows, feature extraction, anomaly detector. Test on a simple sine-to-noise signal: 500 samples periodic, 200 transition, 300 noise. Verify that `maxPersistenceH1` drops at the transition.

4. **Implement the sine-to-noise signal generator.** Build a minimal UI with just the signal plot (Row 1) and feature time series (Row 3). Verify the pipeline end-to-end.

5. **Add the Embedding Explorer (Row 2).** Window slider + 3D scatter + persistence diagram. This is the most interactive and visually impressive component.

6. **Add remaining signal generators** one at a time: frequency shift, intermittent bursts, superposition. Each is a pure function — test independently.

7. **Implement the Lorenz integrator.** This is the most complex signal generator. Test by plotting the 3D trajectory and verifying the butterfly shape. Then run the TDA pipeline on the x-component with time-varying rho and verify topology changes at bifurcation boundaries.

8. **Add Row 4 (Barcode) and Row 5 (Evaluation).** These are display-only components that consume existing data.

9. **Move TDA computation to a Web Worker.** Refactor the pipeline call to use `postMessage` / `onmessage`. Add progress reporting.

10. **Polish.** Loading states, error handling, responsive layout, deploy to Cloudflare Pages.
