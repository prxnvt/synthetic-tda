"use client";

import { usePipeline } from "@/hooks/usePipeline";
import Sidebar from "@/components/Sidebar";
import SignalPlot from "@/components/SignalPlot";
import WindowInspector from "@/components/WindowInspector";
import FeatureTimeSeries from "@/components/FeatureTimeSeries";
import AnomalyBar from "@/components/AnomalyBar";

export default function Home() {
  const state = usePipeline();

  return (
    <div className="flex max-lg:flex-col min-h-screen">
      <Sidebar state={state} />

      <main className="flex-1 px-6 py-5 max-w-[1200px]">
        {/* Signal */}
        <section className="relative">
          <div className="sec-label mb-1">Signal</div>
          {state.isGenerating && (
            <div className="stale-overlay">
              <div className="loading-pill">
                <div className="w-3 h-3 border-[1.5px] border-gray-400 border-t-transparent rounded-full animate-spin" />
                generating...
              </div>
            </div>
          )}
          {state.isSignalStale && state.signalData && !state.isGenerating && (
            <div className="stale-overlay">
              <span>parameters changed — regenerate</span>
            </div>
          )}
          <SignalPlot
            signalData={state.signalData}
            pipelineResult={state.pipelineResult}
            selectedWindowIndex={0}
            windowSize={state.pipelineParams.window_size}
            stepSize={state.pipelineParams.step_size}
            onWindowClick={undefined}
          />
        </section>

        {/* Divider */}
        {state.pipelineResult && (
          <hr className="my-4" style={{ borderColor: "var(--panel-border)" }} />
        )}

        {/* Window Inspector */}
        {state.pipelineResult && (
          <section className="relative">
            {state.isRunning && (
              <div className="stale-overlay">
                <div className="loading-pill">
                  <div className="w-3 h-3 border-[1.5px] border-gray-400 border-t-transparent rounded-full animate-spin" />
                  computing persistent homology...
                </div>
              </div>
            )}
            <WindowInspector state={state} />
          </section>
        )}

        {/* Divider */}
        {state.pipelineResult && (
          <hr className="my-4" style={{ borderColor: "var(--panel-border)" }} />
        )}

        {/* Topological Features + Anomaly Detection (same container, x-axes aligned) */}
        {state.pipelineResult && (
          <section className="relative">
            <div className="sec-label mb-1">Topological Features</div>
            {state.isPipelineStale && !state.isRunning && (
              <div className="stale-overlay">
                <span>parameters changed — re-run analysis</span>
              </div>
            )}
            <FeatureTimeSeries
              pipelineResult={state.pipelineResult}
              signalData={state.signalData}
            />
            <AnomalyBar
              pipelineResult={state.pipelineResult}
              signalData={state.signalData}
            />
          </section>
        )}

        {/* Empty state */}
        {!state.signalData && !state.isGenerating && (
          <div
            className="h-48 flex items-center justify-center"
            style={{ fontFamily: "var(--mono)" }}
          >
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              generate a signal to begin
            </span>
          </div>
        )}

        {state.signalData && !state.pipelineResult && !state.isRunning && (
          <div
            className="h-32 flex items-center justify-center mt-4"
            style={{ fontFamily: "var(--mono)" }}
          >
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              run the analysis pipeline to see results
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
