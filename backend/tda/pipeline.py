import numpy as np

from .windowing import sliding_windows
from .embedding import takens_embedding
from .persistence import compute_persistence
from .features import persistence_summary


def tda_anomaly_pipeline(
    signal: np.ndarray,
    window_size: int = 100,
    step_size: int = 10,
    embedding_delay: int = 1,
    embedding_dimension: int = 3,
    max_simplex_dimension: int = 2,
    max_edge_length: float = np.inf,
    anomaly_threshold_sigma: float = 2.0,
    subsample_size: int = 150,
) -> dict:
    windows = sliding_windows(signal, window_size, step_size)

    window_centers = [
        i * step_size + window_size // 2 for i in range(len(windows))
    ]

    all_summaries: list[dict] = []

    for w in windows:
        cloud = takens_embedding(w, embedding_delay, embedding_dimension)

        if len(cloud) > subsample_size:
            rng = np.random.default_rng(0)
            idx = rng.choice(len(cloud), size=subsample_size, replace=False)
            cloud = cloud[idx]

        pairs = compute_persistence(
            cloud,
            max_dimension=max_simplex_dimension,
            max_edge_length=max_edge_length,
        )
        all_summaries.append(persistence_summary(pairs))

    feature_keys = list(all_summaries[0].keys()) if all_summaries else []
    features: dict[str, list[float]] = {}
    for key in feature_keys:
        features[key] = [s[key] for s in all_summaries]

    anomalies = [False] * len(windows)
    for key in feature_keys:
        vals = np.array(features[key])
        mean = vals.mean()
        std = vals.std()
        if std > 0:
            flags = np.abs(vals - mean) > anomaly_threshold_sigma * std
            for i in range(len(anomalies)):
                if flags[i]:
                    anomalies[i] = True

    return {
        "window_centers": window_centers,
        "features": features,
        "anomalies": anomalies,
    }
