"use client";

import React from "react";
import dynamic from "next/dynamic";
import { PipelineResponse, SignalResponse } from "@/lib/types";
import { PLOTLY_LAYOUT_DEFAULTS, PLOTLY_CONFIG } from "@/lib/plotly-theme";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface FeatureTimeSeriesProps {
  pipelineResult: PipelineResponse | null;
  signalData: SignalResponse | null;
}

function FeatureTimeSeriesInner({
  pipelineResult,
  signalData,
}: FeatureTimeSeriesProps) {
  if (!pipelineResult) return null;

  const x = pipelineResult.window_centers;
  const features = pipelineResult.features;

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
          line: { color: "#ef4444", dash: "dash", width: 1 },
        });
      }
    }
  }

  const featureConfigs = [
    { key: "max_persistence_h1", label: "Max H\u2081 Persistence", color: "#f97316" },
    { key: "total_persistence_h1", label: "Total H\u2081 Persistence", color: "#22c55e" },
    { key: "num_h1", label: "H\u2081 Count", color: "#3b82f6" },
  ].filter((f) => features[f.key]);

  return (
    <div>
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
              ...PLOTLY_LAYOUT_DEFAULTS,
              height: 120,
              margin: { l: 48, r: 12, t: 18, b: 16 },
              title: {
                text: cfg.label,
                font: { size: 10, color: "#334155", family: "var(--font-geist-mono), monospace" },
                x: 0.005,
                xanchor: "left",
              },
              xaxis: { ...PLOTLY_LAYOUT_DEFAULTS.xaxis, title: { text: "" } },
              yaxis: {
                ...PLOTLY_LAYOUT_DEFAULTS.yaxis,
                title: { text: "" },
                zeroline: false,
              },
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
                  line: { color: "#94a3b8", dash: "dash", width: 1 },
                },
                {
                  type: "line",
                  xref: "paper",
                  yref: "y",
                  x0: 0,
                  x1: 1,
                  y0: mean - 2 * std,
                  y1: mean - 2 * std,
                  line: { color: "#94a3b8", dash: "dash", width: 1 },
                },
              ],
              showlegend: false,
            }}
            config={PLOTLY_CONFIG}
            useResizeHandler
            style={{ width: "100%" }}
          />
        );
      })}
    </div>
  );
}

const FeatureTimeSeries = React.memo(FeatureTimeSeriesInner);
export default FeatureTimeSeries;
