"use client";

import React from "react";
import dynamic from "next/dynamic";
import { EmbeddingResponse } from "@/lib/types";
import { PLOTLY_LAYOUT_DEFAULTS, PLOTLY_CONFIG } from "@/lib/plotly-theme";
import LoadingOverlay from "./LoadingOverlay";
import { useIsExpanded } from "./ExpandablePanel";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface EmbeddingPlot3DProps {
  embedding: EmbeddingResponse | null;
  isLoading: boolean;
}

function EmbeddingPlot3DInner({ embedding, isLoading }: EmbeddingPlot3DProps) {
  const isExpanded = useIsExpanded();
  const chartHeight = isExpanded ? Math.round(window.innerHeight * 0.75 - 80) : 260;
  const points = embedding?.points || [];
  const dim = points[0]?.length || 3;

  if (!embedding && !isLoading) {
    return (
      <div
        className="h-[260px] flex items-center justify-center"
        style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 11 }}
      >
        waiting for data
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && <LoadingOverlay message="embedding..." />}
      {dim >= 3 ? (
        <Plot
          data={[
            {
              x: points.map((p) => p[0]),
              y: points.map((p) => p[1]),
              z: points.map((p) => p[2]),
              type: "scatter3d",
              mode: "markers",
              marker: {
                size: 2,
                color: points.map((_, i) => i),
                colorscale: "Viridis",
                opacity: 0.8,
              },
              hovertemplate:
                "x=%{x:.3f}<br>y=%{y:.3f}<br>z=%{z:.3f}<extra></extra>",
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT_DEFAULTS,
            height: chartHeight,
            margin: { l: 0, r: 0, t: 0, b: 0 },
            scene: {
              xaxis: { title: { text: "x(t)", font: { size: 9, color: "#334155" } }, gridcolor: "#e2e8f0" },
              yaxis: { title: { text: "x(t+\u03c4)", font: { size: 9, color: "#334155" } }, gridcolor: "#e2e8f0" },
              zaxis: { title: { text: "x(t+2\u03c4)", font: { size: 9, color: "#334155" } }, gridcolor: "#e2e8f0" },
              camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } },
            },
          }}
          config={PLOTLY_CONFIG}
          useResizeHandler
          style={{ width: "100%" }}
        />
      ) : (
        <Plot
          data={[
            {
              x: points.map((p) => p[0]),
              y: points.map((p) => p[1] ?? 0),
              type: "scatter",
              mode: "markers",
              marker: {
                size: 3,
                color: points.map((_, i) => i),
                colorscale: "Viridis",
                opacity: 0.8,
              },
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT_DEFAULTS,
            height: chartHeight,
            margin: { l: 40, r: 12, t: 0, b: 32 },
            xaxis: {
              ...PLOTLY_LAYOUT_DEFAULTS.xaxis,
              title: { text: "x(t)", font: { size: 9, color: "#334155" } },
            },
            yaxis: {
              ...PLOTLY_LAYOUT_DEFAULTS.yaxis,
              title: { text: "x(t+\u03c4)", font: { size: 9, color: "#334155" } },
            },
          }}
          config={PLOTLY_CONFIG}
          useResizeHandler
          style={{ width: "100%" }}
        />
      )}
    </div>
  );
}

const EmbeddingPlot3D = React.memo(EmbeddingPlot3DInner);
export default EmbeddingPlot3D;
