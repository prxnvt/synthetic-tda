from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np
import time

from tda.persistence import compute_persistence as _compute_persistence
from tda.embedding import takens_embedding
from tda.pipeline import tda_anomaly_pipeline

router = APIRouter()


class PersistenceRequest(BaseModel):
    points: list[list[float]]
    max_dimension: int = 2
    max_edge_length: float = 2.0
    metric: str = "euclidean"


class PersistencePairOut(BaseModel):
    birth: float
    death: float | None
    dimension: int


class PersistenceResponse(BaseModel):
    pairs: list[PersistencePairOut]
    betti_summary: dict[str, int]
    computation_time_ms: float


@router.post("/compute-persistence", response_model=PersistenceResponse)
def compute_persistence_endpoint(req: PersistenceRequest):
    start = time.perf_counter()
    points = np.array(req.points)
    pairs = _compute_persistence(
        points,
        max_dimension=req.max_dimension,
        max_edge_length=req.max_edge_length,
        metric=req.metric,
    )
    elapsed = (time.perf_counter() - start) * 1000

    pairs_out = []
    betti = {}
    essential_counts: dict[int, int] = {}

    for p in pairs:
        pairs_out.append(
            PersistencePairOut(
                birth=p.birth_value,
                death=p.death_value,
                dimension=p.dimension,
            )
        )
        if p.death_value is None:
            essential_counts[p.dimension] = essential_counts.get(p.dimension, 0) + 1

    for d in range(req.max_dimension + 1):
        betti[f"beta_{d}"] = essential_counts.get(d, 0)

    return PersistenceResponse(
        pairs=pairs_out, betti_summary=betti, computation_time_ms=round(elapsed, 1)
    )


class EmbeddingRequest(BaseModel):
    signal_segment: list[float]
    delay: int = 3
    dimension: int = 3
    subsample: int = 150


class EmbeddingResponse(BaseModel):
    points: list[list[float]]
    num_points: int


@router.post("/embedding", response_model=EmbeddingResponse)
def embedding_endpoint(req: EmbeddingRequest):
    signal = np.array(req.signal_segment)
    cloud = takens_embedding(signal, req.delay, req.dimension)

    if len(cloud) > req.subsample:
        rng = np.random.default_rng(0)
        idx = rng.choice(len(cloud), size=req.subsample, replace=False)
        cloud = cloud[idx]

    return EmbeddingResponse(
        points=cloud.tolist(),
        num_points=len(cloud),
    )


class PipelineRequest(BaseModel):
    signal: list[float]
    window_size: int = 100
    step_size: int = 20
    embedding_delay: int = 1
    embedding_dimension: int = 3
    max_simplex_dimension: int = 2
    max_edge_length: float = 2.0
    anomaly_threshold_sigma: float = 2.0
    subsample_size: int = 150


class PipelineResponse(BaseModel):
    window_centers: list[int]
    features: dict[str, list[float]]
    anomalies: list[bool]
    num_windows: int
    computation_time_ms: float


@router.post("/run-pipeline", response_model=PipelineResponse)
def run_pipeline_endpoint(req: PipelineRequest):
    start = time.perf_counter()
    signal = np.array(req.signal)

    result = tda_anomaly_pipeline(
        signal,
        window_size=req.window_size,
        step_size=req.step_size,
        embedding_delay=req.embedding_delay,
        embedding_dimension=req.embedding_dimension,
        max_simplex_dimension=req.max_simplex_dimension,
        max_edge_length=req.max_edge_length,
        anomaly_threshold_sigma=req.anomaly_threshold_sigma,
        subsample_size=req.subsample_size,
    )

    elapsed = (time.perf_counter() - start) * 1000

    return PipelineResponse(
        window_centers=result["window_centers"],
        features=result["features"],
        anomalies=result["anomalies"],
        num_windows=len(result["window_centers"]),
        computation_time_ms=round(elapsed, 1),
    )
