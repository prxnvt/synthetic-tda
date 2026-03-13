"use client";

import dynamic from "next/dynamic";
import { PipelineResponse, SignalResponse } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface AnomalyBarProps {
  pipelineResult: PipelineResponse | null;
  signalData: SignalResponse | null;
}

export default function AnomalyBar({
  pipelineResult,
  signalData,
}: AnomalyBarProps) {
  if (!pipelineResult) {
    return null;
  }

  const x = pipelineResult.window_centers;
  const anomalyVals = pipelineResult.anomalies.map((a) => (a ? 1 : 0));
  const colors = pipelineResult.anomalies.map((a) =>
    a ? "rgba(244, 67, 54, 0.7)" : "rgba(76, 175, 80, 0.5)"
  );

  // Regime boundary shapes
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

  return (
    <Plot
      data={[
        {
          x,
          y: anomalyVals,
          type: "bar",
          marker: { color: colors },
          hovertemplate:
            "center=%{x}<br>anomaly=%{y}<extra></extra>",
        },
      ]}
      layout={{
        height: 80,
        margin: { l: 55, r: 20, t: 20, b: 25 },
        xaxis: { title: { text: "Time (window center)" } },
        yaxis: { visible: false, range: [0, 1.2] },
        shapes: regimeBoundaries,
        bargap: 0,
        showlegend: false,
      }}
      config={{ responsive: true, displayModeBar: false }}
      useResizeHandler
      style={{ width: "100%" }}
    />
  );
}
