import numpy as np


def sliding_windows(
    signal: np.ndarray, window_size: int, step_size: int = 1
) -> list[np.ndarray]:
    windows = []
    for start in range(0, len(signal) - window_size + 1, step_size):
        windows.append(signal[start : start + window_size])
    return windows
