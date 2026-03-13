import numpy as np


def takens_embedding(signal: np.ndarray, delay: int, dimension: int) -> np.ndarray:
    T = len(signal)
    N = T - (dimension - 1) * delay
    result = np.empty((N, dimension))
    for i in range(dimension):
        result[:, i] = signal[i * delay : i * delay + N]
    return result
