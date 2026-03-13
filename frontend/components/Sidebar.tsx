"use client";

import {
  SignalType,
  SIGNAL_TYPE_LABELS,
  PipelineParams,
} from "@/lib/types";
import { PipelineState } from "@/hooks/usePipeline";

const SIGNAL_PARAM_CONFIGS: Record<
  SignalType,
  { key: string; label: string; min: number; max: number; step: number; type?: "select"; options?: string[] }[]
> = {
  sine_to_noise: [
    { key: "period", label: "Period", min: 10, max: 200, step: 1 },
    { key: "amplitude", label: "Amplitude", min: 0.1, max: 5, step: 0.1 },
    { key: "noise_std", label: "Noise Std", min: 0.1, max: 3, step: 0.1 },
    { key: "transition_start", label: "Trans. Start", min: 100, max: 800, step: 10 },
    { key: "transition_end", label: "Trans. End", min: 200, max: 900, step: 10 },
  ],
  frequency_shift: [
    { key: "period_1", label: "Period 1", min: 10, max: 200, step: 1 },
    { key: "period_2", label: "Period 2", min: 10, max: 200, step: 1 },
    { key: "shift_point", label: "Shift Point", min: 100, max: 900, step: 10 },
    { key: "transition_type", label: "Transition", min: 0, max: 1, step: 1, type: "select", options: ["abrupt", "linear"] },
  ],
  intermittent_bursts: [
    { key: "period", label: "Period", min: 10, max: 200, step: 1 },
    { key: "amplitude", label: "Amplitude", min: 0.1, max: 5, step: 0.1 },
    { key: "burst_interval", label: "Burst Interval", min: 50, max: 500, step: 10 },
    { key: "burst_duration", label: "Burst Duration", min: 5, max: 100, step: 5 },
    { key: "burst_intensity", label: "Burst Intensity", min: 0.5, max: 5, step: 0.1 },
  ],
  lorenz: [
    { key: "sigma", label: "Sigma", min: 1, max: 30, step: 0.5 },
    { key: "beta", label: "Beta", min: 0.5, max: 10, step: 0.1 },
    { key: "rho_start", label: "Rho Start", min: 1, max: 100, step: 1 },
    { key: "rho_end", label: "Rho End", min: 50, max: 300, step: 1 },
    { key: "rho_change_time", label: "Rho Change Time", min: 0.1, max: 0.9, step: 0.05 },
  ],
  superposition: [
    { key: "freq_1", label: "Freq 1", min: 10, max: 200, step: 1 },
    { key: "freq_2", label: "Freq 2", min: 5, max: 100, step: 1 },
    { key: "amp_1", label: "Amp 1", min: 0.1, max: 5, step: 0.1 },
    { key: "amp_2", label: "Amp 2", min: 0.1, max: 5, step: 0.1 },
    { key: "onset_time", label: "Onset Time", min: 100, max: 900, step: 10 },
  ],
};

interface SidebarProps {
  state: PipelineState;
}

export default function Sidebar({ state }: SidebarProps) {
  const paramConfigs = SIGNAL_PARAM_CONFIGS[state.signalParams.signal_type];

  return (
    <aside className="w-80 min-w-80 h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-6 max-lg:w-full max-lg:h-auto max-lg:border-r-0 max-lg:border-b">
      <div>
        <h1 className="text-lg font-bold mb-1">Synthetic TDA</h1>
        <p className="text-xs text-gray-500">Topological Data Analysis Demo</p>
      </div>

      {/* Signal Configuration */}
      <section>
        <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Signal
        </h2>

        <label className="block text-xs font-medium mb-1">Signal Type</label>
        <select
          className="w-full mb-3 px-2 py-1.5 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
          value={state.signalParams.signal_type}
          onChange={(e) => state.setSignalType(e.target.value as SignalType)}
        >
          {Object.entries(SIGNAL_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {paramConfigs.map((cfg) => (
          <div key={cfg.key} className="mb-2">
            <div className="flex justify-between text-xs mb-0.5">
              <label className="font-medium">{cfg.label}</label>
              <span className="text-gray-500">
                {state.signalParams.params[cfg.key]}
              </span>
            </div>
            {cfg.type === "select" ? (
              <select
                className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
                value={state.signalParams.params[cfg.key] as string}
                onChange={(e) =>
                  state.updateSignalParams({ [cfg.key]: e.target.value })
                }
              >
                {cfg.options!.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="range"
                className="w-full"
                min={cfg.min}
                max={cfg.max}
                step={cfg.step}
                value={state.signalParams.params[cfg.key] as number}
                onChange={(e) =>
                  state.updateSignalParams({
                    [cfg.key]: parseFloat(e.target.value),
                  })
                }
              />
            )}
          </div>
        ))}

        <div className="mb-2">
          <div className="flex justify-between text-xs mb-0.5">
            <label className="font-medium">Signal Length</label>
            <span className="text-gray-500">{state.signalParams.length}</span>
          </div>
          <input
            type="range"
            className="w-full"
            min={500}
            max={3000}
            step={100}
            value={state.signalParams.length}
            onChange={(e) => state.updateSignalLength(parseInt(e.target.value))}
          />
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium mb-0.5">Seed</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
            value={state.signalParams.seed}
            onChange={(e) => state.updateSeed(parseInt(e.target.value) || 0)}
          />
        </div>

        <button
          className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={state.generateSignal}
          disabled={state.isGenerating}
        >
          {state.isGenerating ? "Generating..." : "Generate Signal"}
        </button>
      </section>

      {/* Pipeline Configuration */}
      <section>
        <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Pipeline
        </h2>

        {([
          { key: "window_size" as const, label: "Window Size", min: 50, max: 300, step: 10 },
          { key: "step_size" as const, label: "Step Size", min: 5, max: 50, step: 5 },
          { key: "embedding_delay" as const, label: "Delay (tau)", min: 1, max: 10, step: 1 },
          { key: "max_edge_length" as const, label: "Max Edge Length", min: 0.5, max: 5, step: 0.1 },
          { key: "anomaly_threshold_sigma" as const, label: "Threshold (sigma)", min: 1.0, max: 4.0, step: 0.1 },
          { key: "subsample_size" as const, label: "Subsample Size", min: 50, max: 200, step: 10 },
        ] as { key: keyof PipelineParams; label: string; min: number; max: number; step: number }[]).map((cfg) => (
          <div key={cfg.key} className="mb-2">
            <div className="flex justify-between text-xs mb-0.5">
              <label className="font-medium">{cfg.label}</label>
              <span className="text-gray-500">
                {state.pipelineParams[cfg.key]}
              </span>
            </div>
            <input
              type="range"
              className="w-full"
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              value={state.pipelineParams[cfg.key] as number}
              onChange={(e) =>
                state.updatePipelineParams({
                  [cfg.key]: parseFloat(e.target.value),
                })
              }
            />
          </div>
        ))}

        <div className="mb-3">
          <label className="block text-xs font-medium mb-0.5">
            Embedding Dimension
          </label>
          <select
            className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
            value={state.pipelineParams.embedding_dimension}
            onChange={(e) =>
              state.updatePipelineParams({
                embedding_dimension: parseInt(e.target.value),
              })
            }
          >
            {[2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <button
          className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={state.runPipeline}
          disabled={!state.signalData || state.isRunning}
        >
          {state.isRunning ? "Running..." : "Run Analysis"}
        </button>
      </section>

      {/* Status */}
      {state.pipelineResult && (
        <section>
          <h2 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Status
          </h2>
          <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
            <p>
              Computation: {state.pipelineResult.computation_time_ms.toFixed(0)}
              ms
            </p>
            <p>Windows: {state.pipelineResult.num_windows}</p>
            <p>
              Anomalies:{" "}
              {state.pipelineResult.anomalies.filter(Boolean).length}
            </p>
          </div>
        </section>
      )}

      {state.error && (
        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">
          {state.error}
        </div>
      )}
    </aside>
  );
}
