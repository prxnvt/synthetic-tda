"use client";

import { usePipeline } from "@/hooks/usePipeline";
import Sidebar from "@/components/Sidebar";
import SignalPlot from "@/components/SignalPlot";
import WindowInspector from "@/components/WindowInspector";
import FeatureTimeSeries from "@/components/FeatureTimeSeries";
import AnomalyBar from "@/components/AnomalyBar";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function Home() {
  const state = usePipeline();

  return (
    <div className="flex max-lg:flex-col min-h-screen">
      <Sidebar state={state} />

      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Row 1: Signal Plot */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 relative">
          {state.isGenerating && (
            <LoadingOverlay message="Generating signal..." />
          )}
          <SignalPlot
            signalData={state.signalData}
            pipelineResult={state.pipelineResult}
            selectedWindowIndex={state.selectedWindowIndex}
            windowSize={state.pipelineParams.window_size}
            stepSize={state.pipelineParams.step_size}
            onWindowClick={state.selectWindow}
          />
        </section>

        {/* Row 2: Window Inspector */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 relative">
          {state.isRunning && (
            <LoadingOverlay
              message={`Computing persistent homology on ${Math.floor(
                ((state.signalData?.length || 1000) -
                  state.pipelineParams.window_size) /
                  state.pipelineParams.step_size +
                  1
              )} windows...`}
            />
          )}
          <WindowInspector state={state} />
        </section>

        {/* Row 3: Feature Time Series */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
          <FeatureTimeSeries
            pipelineResult={state.pipelineResult}
            signalData={state.signalData}
          />
        </section>

        {/* Row 4: Anomaly Bar */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
          <AnomalyBar
            pipelineResult={state.pipelineResult}
            signalData={state.signalData}
          />
        </section>
      </main>
    </div>
  );
}
