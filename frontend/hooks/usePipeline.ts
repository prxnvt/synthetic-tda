"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import {
  SignalType,
  SignalParams,
  SignalResponse,
  PipelineParams,
  PipelineResponse,
  EmbeddingResponse,
  PersistenceResponse,
  DEFAULT_SIGNAL_PARAMS,
  DEFAULT_PIPELINE_PARAMS,
} from "@/lib/types";

const STORAGE_KEY = "tda-pipeline-state";

interface PersistedState {
  signalParams: SignalParams;
  signalData: SignalResponse | null;
  pipelineParams: PipelineParams;
  pipelineResult: PipelineResponse | null;
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function savePersisted(s: PersistedState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export interface PipelineState {
  signalParams: SignalParams;
  signalData: SignalResponse | null;
  isGenerating: boolean;
  isSignalStale: boolean;

  pipelineParams: PipelineParams;
  pipelineResult: PipelineResponse | null;
  isRunning: boolean;
  isPipelineStale: boolean;

  windowEmbedding: EmbeddingResponse | null;
  windowPersistence: PersistenceResponse | null;
  isLoadingWindow: boolean;

  error: string | null;

  generateSignal: () => Promise<void>;
  runPipeline: () => Promise<void>;
  fetchWindowData: (windowIdx: number) => void;
  setSignalType: (type: SignalType) => void;
  updateSignalParams: (params: Record<string, number | string>) => void;
  updateSignalLength: (length: number) => void;
  updateSeed: (seed: number) => void;
  updatePipelineParams: (params: Partial<PipelineParams>) => void;
}

export function usePipeline(): PipelineState {
  const persisted = useRef(loadPersisted());

  const [signalParams, setSignalParams] = useState<SignalParams>(
    persisted.current?.signalParams ?? {
      signal_type: "sine_to_noise",
      length: 1000,
      seed: 42,
      params: { ...DEFAULT_SIGNAL_PARAMS.sine_to_noise },
    }
  );

  const [signalData, setSignalData] = useState<SignalResponse | null>(
    persisted.current?.signalData ?? null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSignalStale, setIsSignalStale] = useState(false);

  const [pipelineParams, setPipelineParams] = useState<PipelineParams>(
    persisted.current?.pipelineParams ?? { ...DEFAULT_PIPELINE_PARAMS }
  );
  const [pipelineResult, setPipelineResult] = useState<PipelineResponse | null>(
    persisted.current?.pipelineResult ?? null
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isPipelineStale, setIsPipelineStale] = useState(false);

  // Persist to sessionStorage so HMR doesn't wipe analysis results
  useEffect(() => {
    savePersisted({ signalParams, signalData, pipelineParams, pipelineResult });
  }, [signalParams, signalData, pipelineParams, pipelineResult]);

  const [windowEmbedding, setWindowEmbedding] =
    useState<EmbeddingResponse | null>(null);
  const [windowPersistence, setWindowPersistence] =
    useState<PersistenceResponse | null>(null);
  const [isLoadingWindow, setIsLoadingWindow] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Use refs for values needed in fetchWindowData to avoid stale closures
  const signalDataRef = useRef(signalData);
  signalDataRef.current = signalData;
  const pipelineParamsRef = useRef(pipelineParams);
  pipelineParamsRef.current = pipelineParams;
  const fetchIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateSignal = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setPipelineResult(null);
    setIsPipelineStale(false);
    setWindowEmbedding(null);
    setWindowPersistence(null);
    try {
      const data = await api.generateSignal(signalParams);
      setSignalData(data);
      setIsSignalStale(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate signal");
    } finally {
      setIsGenerating(false);
    }
  }, [signalParams]);

  const runPipeline = useCallback(async () => {
    if (!signalData) return;
    setIsRunning(true);
    setError(null);
    try {
      const result = await api.runPipeline(signalData.signal, pipelineParams);
      setPipelineResult(result);
      setIsPipelineStale(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline failed");
    } finally {
      setIsRunning(false);
    }
  }, [signalData, pipelineParams]);

  // Debounced window data fetch — called by WindowInspector's local slider
  const fetchWindowData = useCallback((windowIdx: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const sd = signalDataRef.current;
      const pp = pipelineParamsRef.current;
      if (!sd) return;

      const start = windowIdx * pp.step_size;
      const end = start + pp.window_size;
      const segment = sd.signal.slice(start, end);
      if (segment.length === 0) return;

      const fetchId = ++fetchIdRef.current;
      setIsLoadingWindow(true);

      try {
        const embedding = await api.getEmbedding(
          segment,
          pp.embedding_delay,
          pp.embedding_dimension,
          pp.subsample_size
        );
        // Only apply if this is still the latest request
        if (fetchId !== fetchIdRef.current) return;
        const persistence = await api.computePersistence(
          embedding.points,
          pp.max_simplex_dimension,
          pp.max_edge_length
        );
        if (fetchId !== fetchIdRef.current) return;
        setWindowEmbedding(embedding);
        setWindowPersistence(persistence);
      } catch (e) {
        console.error("Window data fetch failed:", e);
      } finally {
        if (fetchId === fetchIdRef.current) {
          setIsLoadingWindow(false);
        }
      }
    }, 250);
  }, []);

  const markSignalStale = useCallback(() => {
    if (signalDataRef.current) setIsSignalStale(true);
  }, []);

  const markPipelineStale = useCallback(() => {
    setIsPipelineStale((prev) => prev || !!pipelineResult);
  }, [pipelineResult]);

  const setSignalType = useCallback(
    (type: SignalType) => {
      setSignalParams((prev) => ({
        ...prev,
        signal_type: type,
        params: { ...DEFAULT_SIGNAL_PARAMS[type] },
      }));
      markSignalStale();
    },
    [markSignalStale]
  );

  const updateSignalParams = useCallback(
    (params: Record<string, number | string>) => {
      setSignalParams((prev) => ({
        ...prev,
        params: { ...prev.params, ...params },
      }));
      markSignalStale();
    },
    [markSignalStale]
  );

  const updateSignalLength = useCallback(
    (length: number) => {
      setSignalParams((prev) => ({ ...prev, length }));
      markSignalStale();
    },
    [markSignalStale]
  );

  const updateSeed = useCallback(
    (seed: number) => {
      setSignalParams((prev) => ({ ...prev, seed }));
      markSignalStale();
    },
    [markSignalStale]
  );

  const updatePipelineParams = useCallback(
    (params: Partial<PipelineParams>) => {
      setPipelineParams((prev) => ({ ...prev, ...params }));
      markPipelineStale();
    },
    [markPipelineStale]
  );

  return {
    signalParams,
    signalData,
    isGenerating,
    isSignalStale,
    pipelineParams,
    pipelineResult,
    isRunning,
    isPipelineStale,
    windowEmbedding,
    windowPersistence,
    isLoadingWindow,
    error,
    generateSignal,
    runPipeline,
    fetchWindowData,
    setSignalType,
    updateSignalParams,
    updateSignalLength,
    updateSeed,
    updatePipelineParams,
  };
}
