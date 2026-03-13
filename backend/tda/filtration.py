import numpy as np
from dataclasses import dataclass
from typing import Tuple
from itertools import combinations


@dataclass
class Simplex:
    vertices: Tuple[int, ...]
    dimension: int
    filtration_value: float
    filtration_index: int = 0


def vietoris_rips(
    distances_matrix: np.ndarray,
    max_dimension: int = 2,
    max_edge_length: float = np.inf,
) -> list[Simplex]:
    simplices = []
    for i in range(distances_matrix.shape[0]):
        s = Simplex(vertices=(i,), dimension=0, filtration_value=0.0)
        simplices.append(s)

    if max_dimension >= 1:
        for i, j in combinations(range(distances_matrix.shape[0]), 2):
            fv = distances_matrix[i, j]
            if fv <= max_edge_length:
                simplices.append(
                    Simplex(vertices=(i, j), dimension=1, filtration_value=fv)
                )

    if max_dimension >= 2:
        for i, j, k in combinations(range(distances_matrix.shape[0]), 3):
            if (
                distances_matrix[i, j] <= max_edge_length
                and distances_matrix[i, k] <= max_edge_length
                and distances_matrix[j, k] <= max_edge_length
            ):
                fv = max(
                    distances_matrix[i, j],
                    distances_matrix[i, k],
                    distances_matrix[j, k],
                )
                simplices.append(
                    Simplex(vertices=(i, j, k), dimension=2, filtration_value=fv)
                )

    for k in range(3, max_dimension + 1):
        for v in combinations(range(distances_matrix.shape[0]), k + 1):
            fv = max(distances_matrix[a, b] for a, b in combinations(v, 2))
            if fv <= max_edge_length:
                simplices.append(
                    Simplex(vertices=v, dimension=k, filtration_value=fv)
                )

    simplices.sort(key=lambda s: (s.filtration_value, s.dimension, s.vertices))
    for idx, s in enumerate(simplices):
        s.filtration_index = idx

    return simplices
