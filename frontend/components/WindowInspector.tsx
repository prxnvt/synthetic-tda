"use client";

import dynamic from "next/dynamic";
import { PipelineState } from "@/hooks/usePipeline";
import EmbeddingPlot3D from "./EmbeddingPlot3D";
import PersistenceDiagram from "./PersistenceDiagram";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface WindowInspectorProps {
  state: PipelineState;
}

export default function WindowInspector({ state }: WindowInspectorProps) {
  if (!state.pipelineResult || !state.signalData) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 border border-dashed border-gray-300 rounded-lg">
        Run the analysis pipeline to inspect windows
      </div>
    );
  }

  const { selectedWindowIndex, pipelineResult, signalData, pipelineParams } =
    state;
  const windowStart = selectedWindowIndex * pipelineParams.step_size;
  const windowEnd = windowStart + pipelineParams.window_size;
  const segment = signalData.signal.slice(windowStart, windowEnd);
  const segX = Array.from({ length: segment.length }, (_, i) => windowStart + i);
  const center = pipelineResult.window_centers[selectedWindowIndex];
  const isAnomaly = pipelineResult.anomalies[selectedWindowIndex];

  return (
    <div>
      {/* Window Slider */}
      <div className="flex items-center gap-4 mb-2 px-1">
        <label className="text-xs font-medium whitespace-nowrap">
          Window {selectedWindowIndex + 1}/{pipelineResult.num_windows}
          <span className="ml-2 text-gray-500">
            [t={windowStart}..{windowEnd}]
          </span>
          {isAnomaly && (
            <span className="ml-2 text-red-500 font-semibold">ANOMALY</span>
          )}
        </label>
        <input
          type="range"
          className="flex-1"
          min={0}
          max={pipelineResult.num_windows - 1}
          step={1}
          value={selectedWindowIndex}
          onChange={(e) => state.selectWindow(parseInt(e.target.value))}
        />
      </div>

      {/* Three panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Left: Signal segment */}
        <div>
          <Plot
            data={[
              {
                x: segX,
                y: segment,
                type: "scatter",
                mode: "lines",
                line: { width: 1.5, color: "#1976d2" },
              },
            ]}
            layout={{
              height: 300,
              margin: { l: 45, r: 10, t: 25, b: 40 },
              title: {
                text: `Window Signal (center=${center})`,
                font: { size: 12 },
              },
              xaxis: { title: { text: "Time" } },
              yaxis: { title: { text: "Value" } },
            }}
            config={{ responsive: true, displayModeBar: false }}
            useResizeHandler
            style={{ width: "100%" }}
          />
        </div>

        {/* Center: 3D Embedding */}
        <div>
          <EmbeddingPlot3D
            embedding={state.windowEmbedding}
            isLoading={state.isLoadingWindow}
          />
        </div>

        {/* Right: Persistence Diagram */}
        <div>
          <PersistenceDiagram
            persistence={state.windowPersistence}
            isLoading={state.isLoadingWindow}
          />
        </div>
      </div>
    </div>
  );
}
