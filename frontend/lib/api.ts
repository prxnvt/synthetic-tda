import {
  SignalParams,
  SignalResponse,
  PersistenceResponse,
  EmbeddingResponse,
  PipelineParams,
  PipelineResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  generateSignal: (params: SignalParams) =>
    post<SignalResponse>("/generate-signal", params),

  computePersistence: (
    points: number[][],
    maxDim: number,
    maxEdge: number
  ) =>
    post<PersistenceResponse>("/compute-persistence", {
      points,
      max_dimension: maxDim,
      max_edge_length: maxEdge,
      metric: "euclidean",
    }),

  getEmbedding: (
    segment: number[],
    delay: number,
    dim: number,
    subsample: number
  ) =>
    post<EmbeddingResponse>("/embedding", {
      signal_segment: segment,
      delay,
      dimension: dim,
      subsample,
    }),

  runPipeline: (signal: number[], params: PipelineParams) =>
    post<PipelineResponse>("/run-pipeline", { signal, ...params }),
};
