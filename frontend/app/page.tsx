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
                Generating...
              </div>
            </div>
          )}
          {state.isSignalStale && state.signalData && !state.isGenerating && (
            <div className="stale-overlay">
              <span>Parameters changed — Regenerate</span>
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
                  Computing persistent homology...
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
            <div className="flex items-baseline gap-6 mb-3">
              <div className="sec-label">Topological Features</div>
              <div className="flex items-baseline gap-4" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
                <span>
                  <span style={{ color: "var(--muted)" }}>windows </span>
                  <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{state.pipelineResult.num_windows}</span>
                </span>
                <span>
                  <span style={{ color: "var(--muted)" }}>anomalies </span>
                  <span style={{ color: state.pipelineResult.anomalies.filter(Boolean).length > 0 ? "#ef4444" : "#22c55e", fontWeight: 600 }}>
                    {state.pipelineResult.anomalies.filter(Boolean).length}
                  </span>
                </span>
                <span>
                  <span style={{ color: "var(--muted)" }}>computed in </span>
                  <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{state.pipelineResult.computation_time_ms.toFixed(0)}ms</span>
                </span>
              </div>
            </div>
            {state.isPipelineStale && !state.isRunning && (
              <div className="stale-overlay">
                <span>Parameters changed — Re-run analysis</span>
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
              Generate a signal to begin
            </span>
          </div>
        )}

        {state.signalData && !state.pipelineResult && !state.isRunning && (
          <div
            className="h-32 flex items-center justify-center mt-4"
            style={{ fontFamily: "var(--mono)" }}
          >
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Run the analysis pipeline to see results
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
