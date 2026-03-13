"use client";

import dynamic from "next/dynamic";
import { SignalResponse, PipelineResponse, REGIME_COLORS } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SignalPlotProps {
  signalData: SignalResponse | null;
  pipelineResult: PipelineResponse | null;
  selectedWindowIndex: number;
  windowSize: number;
  stepSize: number;
  onWindowClick?: (index: number) => void;
}

export default function SignalPlot({
  signalData,
  pipelineResult,
  selectedWindowIndex,
  windowSize,
  stepSize,
  onWindowClick,
}: SignalPlotProps) {
  if (!signalData) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 border border-dashed border-gray-300 rounded-lg">
        Generate a signal to begin
      </div>
    );
  }

  const x = Array.from({ length: signalData.length }, (_, i) => i);

  // Build regime background shapes
  const shapes: Partial<Plotly.Shape>[] = [];
  let currentRegime = signalData.regime_labels[0];
  let regimeStart = 0;

  for (let i = 1; i <= signalData.length; i++) {
    if (
      i === signalData.length ||
      signalData.regime_labels[i] !== currentRegime
    ) {
      shapes.push({
        type: "rect",
        xref: "x",
        yref: "paper",
        x0: regimeStart,
        x1: i,
        y0: 0,
        y1: 1,
        fillcolor: REGIME_COLORS[currentRegime] || REGIME_COLORS[0],
        line: { width: 0 },
        layer: "below",
      });
      if (i < signalData.length) {
        currentRegime = signalData.regime_labels[i];
        regimeStart = i;
      }
    }
  }

  // Anomaly overlay
  if (pipelineResult) {
    pipelineResult.anomalies.forEach((isAnomaly, i) => {
      if (isAnomaly) {
        const center = pipelineResult.window_centers[i];
        shapes.push({
          type: "rect",
          xref: "x",
          yref: "paper",
          x0: center - stepSize / 2,
          x1: center + stepSize / 2,
          y0: 0,
          y1: 1,
          fillcolor: "rgba(244, 67, 54, 0.3)",
          line: { width: 0 },
          layer: "below",
        });
      }
    });

    // Selected window highlight
    const winStart = selectedWindowIndex * stepSize;
    const winEnd = winStart + windowSize;
    shapes.push({
      type: "rect",
      xref: "x",
      yref: "paper",
      x0: winStart,
      x1: winEnd,
      y0: 0,
      y1: 1,
      fillcolor: "rgba(33, 150, 243, 0.15)",
      line: { color: "rgba(33, 150, 243, 0.6)", width: 1.5 },
      layer: "below",
    });
  }

  return (
    <Plot
      data={[
        {
          x,
          y: signalData.signal,
          type: "scatter",
          mode: "lines",
          line: { width: 1, color: "#333" },
          hovertemplate: "t=%{x}<br>value=%{y:.4f}<extra></extra>",
        },
      ]}
      layout={{
        height: 250,
        margin: { l: 50, r: 20, t: 30, b: 40 },
        title: { text: "Signal", font: { size: 14 } },
        xaxis: { title: { text: "Time" }, zeroline: false },
        yaxis: { title: { text: "Value" }, zeroline: false },
        shapes,
        hovermode: "closest",
      }}
      config={{ responsive: true, displayModeBar: false }}
      useResizeHandler
      style={{ width: "100%" }}
      onClick={(data) => {
        if (onWindowClick && pipelineResult && data.points[0]) {
          const clickedX = data.points[0].x as number;
          const windowIdx = Math.round(
            (clickedX - windowSize / 2) / stepSize
          );
          const clamped = Math.max(
            0,
            Math.min(windowIdx, pipelineResult.num_windows - 1)
          );
          onWindowClick(clamped);
        }
      }}
    />
  );
}
