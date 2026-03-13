import numpy as np
from typing import Tuple


def sine_to_noise(
    length: int = 1000,
    period: float = 50,
    amplitude: float = 1.0,
    noise_std: float = 1.0,
    transition_start: int = 500,
    transition_end: int = 700,
    seed: int = 42,
) -> Tuple[np.ndarray, list[int], list[str]]:
    """3-phase signal: clean sine -> sine + ramping noise -> pure noise."""
    rng = np.random.default_rng(seed)
    t = np.arange(length)
    signal = np.zeros(length)

    # Phase 1: clean sine
    signal[:transition_start] = amplitude * np.sin(
        2 * np.pi * t[:transition_start] / period
    )

    # Phase 2: sine + ramping noise
    trans_len = transition_end - transition_start
    ramp = np.linspace(0, 1, trans_len)
    signal[transition_start:transition_end] = amplitude * np.sin(
        2 * np.pi * t[transition_start:transition_end] / period
    ) + rng.normal(0, noise_std, trans_len) * ramp

    # Phase 3: pure noise
    signal[transition_end:] = rng.normal(0, noise_std, length - transition_end)

    regime_labels = [0] * length
    for i in range(transition_start, transition_end):
        regime_labels[i] = 1
    for i in range(transition_end, length):
        regime_labels[i] = 2

    return signal, regime_labels, ["Periodic", "Transition", "Noise"]


def frequency_shift(
    length: int = 1000,
    period_1: float = 50,
    period_2: float = 20,
    shift_point: int = 500,
    transition_type: str = "abrupt",
    seed: int = 42,
) -> Tuple[np.ndarray, list[int], list[str]]:
    """Signal with frequency change — abrupt or linear transition."""
    t = np.arange(length)
    signal = np.zeros(length)

    if transition_type == "abrupt":
        signal[:shift_point] = np.sin(2 * np.pi * t[:shift_point] / period_1)
        signal[shift_point:] = np.sin(2 * np.pi * t[shift_point:] / period_2)
        regime_labels = [0] * shift_point + [1] * (length - shift_point)
        regime_names = [f"Period={period_1}", f"Period={period_2}"]
    else:
        # Linear transition over 100 samples centered at shift_point
        trans_half = 50
        ts = max(0, shift_point - trans_half)
        te = min(length, shift_point + trans_half)

        signal[:ts] = np.sin(2 * np.pi * t[:ts] / period_1)
        signal[te:] = np.sin(2 * np.pi * t[te:] / period_2)

        # Transition region: interpolate frequency
        trans_t = t[ts:te]
        alpha = np.linspace(0, 1, te - ts)
        freq = (1 - alpha) / period_1 + alpha / period_2
        phase = np.cumsum(2 * np.pi * freq)
        signal[ts:te] = np.sin(phase)

        regime_labels = [0] * length
        for i in range(ts, te):
            regime_labels[i] = 1
        for i in range(te, length):
            regime_labels[i] = 2
        regime_names = [f"Period={period_1}", "Transition", f"Period={period_2}"]

    return signal, regime_labels, regime_names


def intermittent_bursts(
    length: int = 1000,
    period: float = 50,
    amplitude: float = 1.0,
    burst_interval: int = 200,
    burst_duration: int = 30,
    burst_intensity: float = 2.0,
    seed: int = 42,
) -> Tuple[np.ndarray, list[int], list[str]]:
    """Periodic signal with intermittent noise bursts."""
    rng = np.random.default_rng(seed)
    t = np.arange(length)
    signal = amplitude * np.sin(2 * np.pi * t / period)

    regime_labels = [0] * length

    burst_start = burst_interval
    while burst_start < length:
        burst_end = min(burst_start + burst_duration, length)
        signal[burst_start:burst_end] += rng.normal(
            0, burst_intensity, burst_end - burst_start
        )
        for i in range(burst_start, burst_end):
            regime_labels[i] = 1
        burst_start += burst_interval

    return signal, regime_labels, ["Periodic", "Burst"]


def superposition(
    length: int = 1000,
    freq_1: float = 50,
    freq_2: float = 13,
    amp_1: float = 1.0,
    amp_2: float = 0.8,
    onset_time: int = 500,
    seed: int = 42,
) -> Tuple[np.ndarray, list[int], list[str]]:
    """Single frequency -> dual frequency superposition."""
    t = np.arange(length)
    signal = amp_1 * np.sin(2 * np.pi * t / freq_1)

    # Add second frequency after onset
    signal[onset_time:] += amp_2 * np.sin(2 * np.pi * t[onset_time:] / freq_2)

    regime_labels = [0] * onset_time + [1] * (length - onset_time)
    return signal, regime_labels, ["Single Frequency", "Superposition"]
