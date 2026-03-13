"use client";

import dynamic from "next/dynamic";
import { PipelineResponse, SignalResponse } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface FeatureTimeSeriesProps {
  pipelineResult: PipelineResponse | null;
  signalData: SignalResponse | null;
}

export default function FeatureTimeSeries({
  pipelineResult,
  signalData,
}: FeatureTimeSeriesProps) {
  if (!pipelineResult) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 border border-dashed border-gray-300 rounded-lg">
        Run the analysis pipeline to see topological features
      </div>
    );
  }

  const x = pipelineResult.window_centers;
  const features = pipelineResult.features;

  // Build regime boundary lines
  const regimeBoundaries: Partial<Plotly.Shape>[] = [];
  if (signalData) {
    for (let i = 1; i < signalData.regime_labels.length; i++) {
      if (signalData.regime_labels[i] !== signalData.regime_labels[i - 1]) {
        regimeBoundaries.push({
          type: "line",
          xref: "x",
          yref: "paper",
          x0: i,
          x1: i,
          y0: 0,
          y1: 1,
          line: { color: "red", dash: "dash", width: 1 },
        });
      }
    }
  }

  const featureConfigs = [
    {
      key: "max_persistence_h1",
      label: "Max H₁ Persistence",
      color: "#ff7f0e",
    },
    {
      key: "total_persistence_h1",
      label: "Total H₁ Persistence",
      color: "#2ca02c",
    },
    { key: "num_h1", label: "H₁ Count", color: "#1f77b4" },
  ].filter((f) => features[f.key]);

  return (
    <div className="space-y-1">
      {featureConfigs.map((cfg) => {
        const vals = features[cfg.key];
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const std = Math.sqrt(
          vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length
        );

        return (
          <Plot
            key={cfg.key}
            data={[
              {
                x,
                y: vals,
                type: "scatter",
                mode: "lines",
                line: { width: 1.5, color: cfg.color },
                name: cfg.label,
              },
            ]}
            layout={{
              height: 150,
              margin: { l: 55, r: 20, t: 25, b: 25 },
              title: { text: cfg.label, font: { size: 11 } },
              xaxis: { title: { text: "" } },
              yaxis: { title: { text: "" }, zeroline: false },
              shapes: [
                ...regimeBoundaries,
                {
                  type: "line",
                  xref: "paper",
                  yref: "y",
                  x0: 0,
                  x1: 1,
                  y0: mean + 2 * std,
                  y1: mean + 2 * std,
                  line: { color: "gray", dash: "dash", width: 1 },
                },
                {
                  type: "line",
                  xref: "paper",
                  yref: "y",
                  x0: 0,
                  x1: 1,
                  y0: mean - 2 * std,
                  y1: mean - 2 * std,
                  line: { color: "gray", dash: "dash", width: 1 },
                },
              ],
              showlegend: false,
            }}
            config={{ responsive: true, displayModeBar: false }}
            useResizeHandler
            style={{ width: "100%" }}
          />
        );
      })}
    </div>
  );
}
