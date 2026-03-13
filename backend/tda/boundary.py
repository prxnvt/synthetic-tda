from .filtration import Simplex


class BoundaryMatrix:
    def __init__(self, num_cols: int):
        self.num_cols = num_cols
        self.columns: list[list[int]] = [[] for _ in range(num_cols)]

    def get_column(self, j: int) -> list[int]:
        return self.columns[j]

    def set_column(self, j: int, rows: list[int]) -> None:
        self.columns[j] = rows

    def xor_columns(self, target: int, source: int) -> None:
        a = self.columns[target]
        b = self.columns[source]
        result = []
        i, j = 0, 0
        while i < len(a) and j < len(b):
            if a[i] < b[j]:
                result.append(a[i])
                i += 1
            elif a[i] > b[j]:
                result.append(b[j])
                j += 1
            else:
                i += 1
                j += 1
        result.extend(a[i:])
        result.extend(b[j:])
        self.columns[target] = result

    def low(self, j: int) -> int | None:
        if self.columns[j]:
            return self.columns[j][-1]
        return None


def build_boundary_matrix(filtration: list[Simplex]) -> BoundaryMatrix:
    simplex_to_index = {s.vertices: s.filtration_index for s in filtration}
    matrix = BoundaryMatrix(len(filtration))

    for s in filtration:
        if s.dimension == 0:
            continue
        rows = []
        for i in range(len(s.vertices)):
            face = s.vertices[:i] + s.vertices[i + 1 :]
            rows.append(simplex_to_index[face])
        rows.sort()
        matrix.set_column(s.filtration_index, rows)

    return matrix
