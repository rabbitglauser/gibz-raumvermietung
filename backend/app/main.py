from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import ping_db
from .routers.reservations import router as reservations_router
from .routers.rooms import router as rooms_router
from .routers.staff import router as staff_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_ok = await ping_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reservations_router)
app.include_router(rooms_router)
app.include_router(staff_router)


@app.get("/")
async def root():
    return {"message": "Backend is running"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": settings.app_name,
    }
