from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import init_db, get_db_connection
from app.services.data_generator import generate_synthetic_dataset
from app.detection.hybrid_engine import run_hybrid_collusion_pipeline
from app.api import (
    dashboard,
    tenders,
    bidders,
    network,
    alerts,
    detect,
    dataset,
    reports,
    demo
)
import os

app = FastAPI(
    title="PROCUREGUARD AI - Intelligence Engine",
    description="Backend API for AI-Based Detection of Bid Rigging and Collusion in E-Procurement Systems",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(dashboard.router)
app.include_router(tenders.router)
app.include_router(bidders.router)
app.include_router(network.router)
app.include_router(alerts.router)
app.include_router(detect.router)
app.include_router(dataset.router)
app.include_router(reports.router)
app.include_router(demo.router)

@app.on_event("startup")
def startup_event():
    init_db()
    conn = get_db_connection()
    count = conn.execute("SELECT COUNT(*) FROM tenders").fetchone()[0]
    conn.close()

    # Automatically initialize dataset and run initial pipeline if empty
    if count == 0:
        print("[Startup] Initializing default synthetic procurement dataset...")
        generate_synthetic_dataset(num_tenders=120)
        print("[Startup] Running initial baseline AI collusion detection pipeline...")
        run_hybrid_collusion_pipeline()
        print("[Startup] Engine ready!")
    else:
        print(f"[Startup] ProcureGuard engine loaded with {count} active tenders.")

@app.get("/")
def root():
    return {
        "app": "PROCUREGUARD AI",
        "tagline": "Intelligence for Transparent Procurement",
        "status": "Operational",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
