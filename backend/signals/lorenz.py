import numpy as np
from typing import Tuple


def lorenz_signal(
    length: int = 3000,
    sigma: float = 10.0,
    beta: float = 8.0 / 3.0,
    rho_start: float = 28.0,
    rho_end: float = 150.0,
    rho_change_time: float = 0.5,
    dt: float = 0.01,
    seed: int = 42,
) -> Tuple[np.ndarray, list[int], list[str]]:
    """Lorenz system with time-varying rho via RK4 integration.

    Returns the x-component, subsampled to `length` points.
    rho_change_time is the fraction of total time at which rho starts changing.
    """
    # We integrate enough steps to get `length` output samples
    # Use 10x oversampling then subsample
    total_steps = length * 10
    change_step = int(rho_change_time * total_steps)

    x, y, z = 1.0, 1.0, 1.0
    xs = np.empty(total_steps)

    for step in range(total_steps):
        # Time-varying rho
        if step < change_step:
            rho = rho_start
        else:
            # Linear ramp from rho_start to rho_end
            alpha = (step - change_step) / max(1, total_steps - change_step)
            rho = rho_start + alpha * (rho_end - rho_start)

        # RK4 integration
        def deriv(x_, y_, z_, rho_):
            dx = sigma * (y_ - x_)
            dy = x_ * (rho_ - z_) - y_
            dz = x_ * y_ - beta * z_
            return dx, dy, dz

        k1x, k1y, k1z = deriv(x, y, z, rho)
        k2x, k2y, k2z = deriv(
            x + 0.5 * dt * k1x, y + 0.5 * dt * k1y, z + 0.5 * dt * k1z, rho
        )
        k3x, k3y, k3z = deriv(
            x + 0.5 * dt * k2x, y + 0.5 * dt * k2y, z + 0.5 * dt * k2z, rho
        )
        k4x, k4y, k4z = deriv(
            x + dt * k3x, y + dt * k3y, z + dt * k3z, rho
        )

        x += dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x)
        y += dt / 6 * (k1y + 2 * k2y + 2 * k3y + k4y)
        z += dt / 6 * (k1z + 2 * k2z + 2 * k3z + k4z)

        xs[step] = x

    # Subsample to desired length
    indices = np.linspace(0, total_steps - 1, length, dtype=int)
    signal = xs[indices]

    # Normalize to reasonable range
    signal = (signal - signal.mean()) / (signal.std() + 1e-8)

    # Regime labels
    change_idx = int(rho_change_time * length)
    regime_labels = [0] * change_idx + [1] * (length - change_idx)
    regime_names = [f"rho={rho_start}", f"rho->{rho_end}"]

    return signal, regime_labels, regime_names
