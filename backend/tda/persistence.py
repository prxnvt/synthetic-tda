import numpy as np

from .distance import pairwise_distances
from .filtration import vietoris_rips
from .boundary import build_boundary_matrix
from .reduction import reduce_boundary_matrix, PersistencePair


def compute_persistence(
    points: np.ndarray,
    max_dimension: int = 2,
    max_edge_length: float = np.inf,
    metric: str = "euclidean",
) -> list[PersistencePair]:
    dist_matrix = pairwise_distances(points, metric)
    filtration = vietoris_rips(dist_matrix, max_dimension, max_edge_length)
    boundary = build_boundary_matrix(filtration)
    pairs = reduce_boundary_matrix(boundary, filtration)
    return pairs
