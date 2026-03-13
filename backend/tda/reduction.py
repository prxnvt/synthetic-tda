from dataclasses import dataclass

from .filtration import Simplex
from .boundary import BoundaryMatrix


@dataclass
class PersistencePair:
    birth_index: int
    death_index: int | None
    birth_value: float
    death_value: float | None
    dimension: int


def reduce_boundary_matrix(
    boundary: BoundaryMatrix, filtration: list[Simplex]
) -> list[PersistencePair]:
    num_cols = boundary.num_cols
    pivot_lookup: dict[int, int] = {}

    for j in range(num_cols):
        while True:
            pivot = boundary.low(j)
            if pivot is None:
                break
            if pivot not in pivot_lookup:
                break
            boundary.xor_columns(target=j, source=pivot_lookup[pivot])

        if boundary.low(j) is not None:
            pivot_lookup[boundary.low(j)] = j

    paired_births: set[int] = set()
    pairs: list[PersistencePair] = []

    for j in range(num_cols):
        pivot = boundary.low(j)
        if pivot is not None:
            i = pivot
            paired_births.add(i)
            pairs.append(
                PersistencePair(
                    birth_index=i,
                    death_index=j,
                    birth_value=filtration[i].filtration_value,
                    death_value=filtration[j].filtration_value,
                    dimension=filtration[i].dimension,
                )
            )

    for j in range(num_cols):
        if boundary.low(j) is None and j not in paired_births:
            pairs.append(
                PersistencePair(
                    birth_index=j,
                    death_index=None,
                    birth_value=filtration[j].filtration_value,
                    death_value=None,
                    dimension=filtration[j].dimension,
                )
            )

    return pairs
