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

export interface PipelineState {
  signalParams: SignalParams;
  signalData: SignalResponse | null;
  isGenerating: boolean;

  pipelineParams: PipelineParams;
  pipelineResult: PipelineResponse | null;
  isRunning: boolean;

  selectedWindowIndex: number;
  windowEmbedding: EmbeddingResponse | null;
  windowPersistence: PersistenceResponse | null;
  isLoadingWindow: boolean;

  error: string | null;

  generateSignal: () => Promise<void>;
  runPipeline: () => Promise<void>;
  selectWindow: (index: number) => void;
  setSignalType: (type: SignalType) => void;
  updateSignalParams: (params: Record<string, number | string>) => void;
  updateSignalLength: (length: number) => void;
  updateSeed: (seed: number) => void;
  updatePipelineParams: (params: Partial<PipelineParams>) => void;
}

export function usePipeline(): PipelineState {
  const [signalParams, setSignalParams] = useState<SignalParams>({
    signal_type: "sine_to_noise",
    length: 1000,
    seed: 42,
    params: { ...DEFAULT_SIGNAL_PARAMS.sine_to_noise },
  });

  const [signalData, setSignalData] = useState<SignalResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [pipelineParams, setPipelineParams] = useState<PipelineParams>({
    ...DEFAULT_PIPELINE_PARAMS,
  });
  const [pipelineResult, setPipelineResult] =
    useState<PipelineResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [selectedWindowIndex, setSelectedWindowIndex] = useState(0);
  const [windowEmbedding, setWindowEmbedding] =
    useState<EmbeddingResponse | null>(null);
  const [windowPersistence, setWindowPersistence] =
    useState<PersistenceResponse | null>(null);
  const [isLoadingWindow, setIsLoadingWindow] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateSignal = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setPipelineResult(null);
    setWindowEmbedding(null);
    setWindowPersistence(null);
    try {
      const data = await api.generateSignal(signalParams);
      setSignalData(data);
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
      setSelectedWindowIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline failed");
    } finally {
      setIsRunning(false);
    }
  }, [signalData, pipelineParams]);

  const fetchWindowData = useCallback(
    async (windowIdx: number) => {
      if (!signalData || !pipelineResult) return;

      const start =
        windowIdx * pipelineParams.step_size;
      const end = start + pipelineParams.window_size;
      const segment = signalData.signal.slice(start, end);

      if (segment.length === 0) return;

      setIsLoadingWindow(true);
      try {
        const embedding = await api.getEmbedding(
          segment,
          pipelineParams.embedding_delay,
          pipelineParams.embedding_dimension,
          pipelineParams.subsample_size
        );
        const persistence = await api.computePersistence(
          embedding.points,
          pipelineParams.max_simplex_dimension,
          pipelineParams.max_edge_length
        );
        setWindowEmbedding(embedding);
        setWindowPersistence(persistence);
      } catch (e) {
        console.error("Window data fetch failed:", e);
      } finally {
        setIsLoadingWindow(false);
      }
    },
    [signalData, pipelineResult, pipelineParams]
  );

  const selectWindow = useCallback(
    (index: number) => {
      setSelectedWindowIndex(index);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchWindowData(index);
      }, 300);
    },
    [fetchWindowData]
  );

  // Fetch window data when pipeline result first arrives
  useEffect(() => {
    if (pipelineResult && signalData) {
      fetchWindowData(0);
    }
  }, [pipelineResult, signalData, fetchWindowData]);

  const setSignalType = useCallback((type: SignalType) => {
    setSignalParams((prev) => ({
      ...prev,
      signal_type: type,
      params: { ...DEFAULT_SIGNAL_PARAMS[type] },
    }));
  }, []);

  const updateSignalParams = useCallback(
    (params: Record<string, number | string>) => {
      setSignalParams((prev) => ({
        ...prev,
        params: { ...prev.params, ...params },
      }));
    },
    []
  );

  const updateSignalLength = useCallback((length: number) => {
    setSignalParams((prev) => ({ ...prev, length }));
  }, []);

  const updateSeed = useCallback((seed: number) => {
    setSignalParams((prev) => ({ ...prev, seed }));
  }, []);

  const updatePipelineParams = useCallback(
    (params: Partial<PipelineParams>) => {
      setPipelineParams((prev) => ({ ...prev, ...params }));
    },
    []
  );

  return {
    signalParams,
    signalData,
    isGenerating,
    pipelineParams,
    pipelineResult,
    isRunning,
    selectedWindowIndex,
    windowEmbedding,
    windowPersistence,
    isLoadingWindow,
    error,
    generateSignal,
    runPipeline,
    selectWindow,
    setSignalType,
    updateSignalParams,
    updateSignalLength,
    updateSeed,
    updatePipelineParams,
  };
}
