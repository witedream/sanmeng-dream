import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from database import engine, Base
from routers import characters, worldbooks, llm_configs, chat

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="梦女站 Dream Girl", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(characters.router)
app.include_router(worldbooks.router)
app.include_router(llm_configs.router)
app.include_router(chat.router)


@app.get("/api/status")
def status():
    return {"status": "ok", "version": "1.0.0"}


# Serve static frontend
frontend_dir = Path(__file__).parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
