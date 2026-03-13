from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import signals, tda

app = FastAPI(title="Synthetic TDA Demo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals.router, prefix="/api")
app.include_router(tda.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
