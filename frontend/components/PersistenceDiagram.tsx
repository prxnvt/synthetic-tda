"use client";

import dynamic from "next/dynamic";
import { PersistenceResponse, DIMENSION_COLORS } from "@/lib/types";
import LoadingOverlay from "./LoadingOverlay";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PersistenceDiagramProps {
  persistence: PersistenceResponse | null;
  isLoading: boolean;
}

export default function PersistenceDiagram({
  persistence,
  isLoading,
}: PersistenceDiagramProps) {
  if (!persistence && !isLoading) {
    return (
      <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
        Select a window to see persistence
      </div>
    );
  }

  const pairs = persistence?.pairs || [];

  // Find max death for essential features cap
  const finiteDeaths = pairs
    .filter((p) => p.death !== null)
    .map((p) => p.death as number);
  const maxDeath =
    finiteDeaths.length > 0 ? Math.max(...finiteDeaths) * 1.1 : 1.0;
  const lo = pairs.length > 0 ? Math.min(...pairs.map((p) => p.birth)) : 0;

  // Group by dimension
  const dims = [...new Set(pairs.map((p) => p.dimension))].sort();
  const dimLabels: Record<number, string> = { 0: "H₀", 1: "H₁", 2: "H₂" };

  const traces: Plotly.Data[] = [];

  // Diagonal line
  traces.push({
    x: [lo, maxDeath],
    y: [lo, maxDeath],
    type: "scatter",
    mode: "lines",
    line: { color: "gray", dash: "dash", width: 1 },
    showlegend: false,
    hoverinfo: "skip",
  });

  for (const d of dims) {
    const finite = pairs.filter((p) => p.dimension === d && p.death !== null);
    const essential = pairs.filter(
      (p) => p.dimension === d && p.death === null
    );
    const color = DIMENSION_COLORS[d] || "#999";
    const label = dimLabels[d] || `H${d}`;

    if (finite.length > 0) {
      traces.push({
        x: finite.map((p) => p.birth),
        y: finite.map((p) => p.death),
        type: "scatter",
        mode: "markers",
        name: label,
        marker: { color, size: 6, symbol: "circle" },
        hovertemplate:
          "birth=%{x:.3f}<br>death=%{y:.3f}<extra>" + label + "</extra>",
      });
    }

    if (essential.length > 0) {
      traces.push({
        x: essential.map((p) => p.birth),
        y: essential.map(() => maxDeath),
        type: "scatter",
        mode: "markers",
        name: essential.length > 0 && finite.length === 0 ? label : undefined,
        showlegend: finite.length === 0,
        marker: { color, size: 8, symbol: "triangle-up" },
        hovertemplate:
          "birth=%{x:.3f}<br>death=∞<extra>" + label + " (essential)</extra>",
      });
    }
  }

  return (
    <div className="relative">
      {isLoading && <LoadingOverlay message="Computing persistence..." />}
      <Plot
        data={traces}
        layout={{
          height: 300,
          margin: { l: 45, r: 20, t: 25, b: 45 },
          title: { text: "Persistence Diagram", font: { size: 12 } },
          xaxis: { title: { text: "Birth (ε)" }, zeroline: false },
          yaxis: { title: { text: "Death (ε)" }, zeroline: false },
          legend: { x: 0.02, y: 0.98, bgcolor: "rgba(255,255,255,0.7)" },
          hovermode: "closest",
        }}
        config={{ responsive: true, displayModeBar: false }}
        useResizeHandler
        style={{ width: "100%" }}
      />
    </div>
  );
}
