from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import configuracion
from routers import auth, piezas

app = FastAPI(title="Vitrina API", version="0.1.0")

# Permite que Angular (otro origen: localhost:4200) llame a la API desde el navegador.
app.add_middleware(
    CORSMiddleware,
    allow_origins=configuracion.cors_origenes,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(piezas.router, prefix="/api")


@app.get("/api/salud", tags=["Salud"])
def salud():
    return {"estado": "ok"}
