from .reduction import PersistencePair


def persistence_summary(pairs: list[PersistencePair]) -> dict:
    by_dim: dict[int, list[float]] = {0: [], 1: [], 2: []}

    for p in pairs:
        if p.death_value is not None:
            lifespan = p.death_value - p.birth_value
            if p.dimension in by_dim:
                by_dim[p.dimension].append(lifespan)

    result = {}
    for k in range(3):
        dim_pairs = by_dim[k]
        result[f"num_h{k}"] = sum(1 for p in pairs if p.dimension == k)
        result[f"max_persistence_h{k}"] = max(dim_pairs) if dim_pairs else 0.0
        result[f"total_persistence_h{k}"] = sum(dim_pairs)
        result[f"mean_persistence_h{k}"] = (
            (sum(dim_pairs) / len(dim_pairs)) if dim_pairs else 0.0
        )

    return result
