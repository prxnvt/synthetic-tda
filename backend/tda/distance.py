import numpy as np


def euclidean(a, b):
    return np.linalg.norm(a - b)


def manhattan(a, b):
    return np.abs(a - b).sum()


def chebyshev(a, b):
    return max(abs(ai - bi) for ai, bi in zip(a, b))


def cosine_metric(a, b):
    return 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def pairwise_distances(points: np.ndarray, metric: str) -> np.ndarray:
    N = len(points)
    distances_matrix = np.zeros((N, N))
    if metric == "euclidean":
        metric_fn = euclidean
    elif metric == "manhattan":
        metric_fn = manhattan
    elif metric == "chebyshev":
        metric_fn = chebyshev
    elif metric == "cosine":
        metric_fn = cosine_metric
    else:
        metric_fn = euclidean
    for i in range(N):
        for j in range(i + 1, N):
            d = metric_fn(points[i], points[j])
            distances_matrix[i][j] = d
            distances_matrix[j][i] = d
    return distances_matrix
