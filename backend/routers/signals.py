from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
import time

from signals.generators import sine_to_noise, frequency_shift, intermittent_bursts, superposition
from signals.lorenz import lorenz_signal

router = APIRouter()


class SignalRequest(BaseModel):
    signal_type: str
    length: int = 1000
    params: dict[str, Any] = {}
    seed: int = 42


class SignalResponse(BaseModel):
    signal: list[float]
    regime_labels: list[int]
    regime_names: list[str]
    length: int


@router.post("/generate-signal", response_model=SignalResponse)
def generate_signal(req: SignalRequest):
    generators = {
        "sine_to_noise": sine_to_noise,
        "frequency_shift": frequency_shift,
        "intermittent_bursts": intermittent_bursts,
        "superposition": superposition,
        "lorenz": lorenz_signal,
    }

    if req.signal_type not in generators:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown signal type: {req.signal_type}. Available: {list(generators.keys())}",
        )

    gen_fn = generators[req.signal_type]
    sig, labels, names = gen_fn(length=req.length, seed=req.seed, **req.params)

    return SignalResponse(
        signal=sig.tolist(),
        regime_labels=labels,
        regime_names=names,
        length=len(sig),
    )
