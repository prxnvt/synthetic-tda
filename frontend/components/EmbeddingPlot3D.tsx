"use client";

import dynamic from "next/dynamic";
import { EmbeddingResponse } from "@/lib/types";
import LoadingOverlay from "./LoadingOverlay";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface EmbeddingPlot3DProps {
  embedding: EmbeddingResponse | null;
  isLoading: boolean;
}

export default function EmbeddingPlot3D({
  embedding,
  isLoading,
}: EmbeddingPlot3DProps) {
  if (!embedding && !isLoading) {
    return (
      <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
        Select a window to see embedding
      </div>
    );
  }

  const points = embedding?.points || [];
  const dim = points[0]?.length || 3;

  return (
    <div className="relative">
      {isLoading && <LoadingOverlay message="Computing embedding..." />}
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
                size: 2.5,
                color: points.map((_, i) => i),
                colorscale: "Viridis",
                opacity: 0.8,
              },
              hovertemplate:
                "x=%{x:.3f}<br>y=%{y:.3f}<br>z=%{z:.3f}<extra></extra>",
            },
          ]}
          layout={{
            height: 300,
            margin: { l: 0, r: 0, t: 25, b: 0 },
            title: { text: "Takens Embedding", font: { size: 12 } },
            scene: {
              xaxis: { title: { text: "x(t)" } },
              yaxis: { title: { text: "x(t+τ)" } },
              zaxis: { title: { text: "x(t+2τ)" } },
              camera: { eye: { x: 1.5, y: 1.5, z: 1.0 } },
            },
          }}
          config={{ responsive: true, displayModeBar: false }}
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
                size: 4,
                color: points.map((_, i) => i),
                colorscale: "Viridis",
                opacity: 0.8,
              },
            },
          ]}
          layout={{
            height: 300,
            margin: { l: 40, r: 20, t: 25, b: 40 },
            title: { text: "Takens Embedding (2D)", font: { size: 12 } },
            xaxis: { title: { text: "x(t)" } },
            yaxis: { title: { text: "x(t+τ)" } },
          }}
          config={{ responsive: true, displayModeBar: false }}
          useResizeHandler
          style={{ width: "100%" }}
        />
      )}
    </div>
  );
}
