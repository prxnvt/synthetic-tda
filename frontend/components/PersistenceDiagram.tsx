"use client";

import React from "react";
import dynamic from "next/dynamic";
import { PersistenceResponse, DIMENSION_COLORS } from "@/lib/types";
import { PLOTLY_LAYOUT_DEFAULTS, PLOTLY_CONFIG } from "@/lib/plotly-theme";
import LoadingOverlay from "./LoadingOverlay";
import { useIsExpanded } from "./ExpandablePanel";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PersistenceDiagramProps {
  persistence: PersistenceResponse | null;
  isLoading: boolean;
}

function PersistenceDiagramInner({
  persistence,
  isLoading,
}: PersistenceDiagramProps) {
  const isExpanded = useIsExpanded();
  const chartHeight = isExpanded ? Math.round(window.innerHeight * 0.75 - 80) : 260;

  if (!persistence && !isLoading) {
    return (
      <div
        className="h-[260px] flex items-center justify-center"
        style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 11 }}
      >
        Waiting for data
      </div>
    );
  }

  const pairs = persistence?.pairs || [];
  const finiteDeaths = pairs
    .filter((p) => p.death !== null)
    .map((p) => p.death as number);
  const maxDeath =
    finiteDeaths.length > 0 ? Math.max(...finiteDeaths) * 1.1 : 1.0;
  const lo = pairs.length > 0 ? Math.min(...pairs.map((p) => p.birth)) : 0;

  const dims = [...new Set(pairs.map((p) => p.dimension))].sort();
  const dimLabels: Record<number, string> = { 0: "H\u2080", 1: "H\u2081", 2: "H\u2082" };
  const traces: Plotly.Data[] = [];

  traces.push({
    x: [lo, maxDeath],
    y: [lo, maxDeath],
    type: "scatter",
    mode: "lines",
    line: { color: "#cbd5e1", dash: "dash", width: 1 },
    showlegend: false,
    hoverinfo: "skip",
  });

  for (const d of dims) {
    const finite = pairs.filter((p) => p.dimension === d && p.death !== null);
    const essential = pairs.filter((p) => p.dimension === d && p.death === null);
    const color = DIMENSION_COLORS[d] || "#999";
    const label = dimLabels[d] || `H${d}`;

    if (finite.length > 0) {
      traces.push({
        x: finite.map((p) => p.birth),
        y: finite.map((p) => p.death),
        type: "scatter",
        mode: "markers",
        name: label,
        marker: { color, size: 5, symbol: "circle" },
        hovertemplate: "birth=%{x:.3f}<br>death=%{y:.3f}<extra>" + label + "</extra>",
      });
    }

    if (essential.length > 0) {
      traces.push({
        x: essential.map((p) => p.birth),
        y: essential.map(() => maxDeath),
        type: "scatter",
        mode: "markers",
        name: finite.length === 0 ? label : undefined,
        showlegend: finite.length === 0,
        marker: { color, size: 7, symbol: "triangle-up" },
        hovertemplate: "birth=%{x:.3f}<br>death=\u221e<extra>" + label + " (ess.)</extra>",
      });
    }
  }

  return (
    <div className="relative" style={{ height: chartHeight }}>
      {isLoading && <LoadingOverlay message="Persistence..." />}
      <Plot
        data={traces}
        layout={{
          ...PLOTLY_LAYOUT_DEFAULTS,
          height: chartHeight,
          margin: { l: 40, r: 12, t: 0, b: 36 },
          xaxis: {
            ...PLOTLY_LAYOUT_DEFAULTS.xaxis,
            title: { text: "Birth (\u03b5)", font: { size: 10, color: "#334155" } },
            zeroline: false,
          },
          yaxis: {
            ...PLOTLY_LAYOUT_DEFAULTS.yaxis,
            title: { text: "Death (\u03b5)", font: { size: 10, color: "#334155" } },
            zeroline: false,
          },
          legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: "rgba(255,255,255,0.9)",
            bordercolor: "#cbd5e1",
            borderwidth: 1,
            font: { size: 10 },
          },
          hovermode: "closest",
        }}
        config={PLOTLY_CONFIG}
        useResizeHandler
        style={{ width: "100%" }}
      />
    </div>
  );
}

const PersistenceDiagram = React.memo(PersistenceDiagramInner);
export default PersistenceDiagram;
