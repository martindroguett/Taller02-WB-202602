from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, Request, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from database import Sesion
from imagenes import asignar_imagen, url_imagen
from models import Categoria, Pieza, Usuario
from schemas import DatosPieza, Dueno, Pagina, PiezaRespuesta
from seguridad import UsuarioActual

router = APIRouter(prefix="/piezas", tags=["Piezas"])


def a_respuesta(pieza: Pieza, request: Request) -> PiezaRespuesta:
    return PiezaRespuesta(
        id=pieza.id,
        nombre=pieza.nombre,
        descripcion=pieza.descripcion,
        categoria=pieza.categoria.slug,
        imagen_url=url_imagen(pieza, request),
        dueno=Dueno.model_validate(pieza.usuario),

        megusta=0,
        guardados=0,
        gustada=False,
        guardada=False,
        creado_en=pieza.creado_en,
        actualizado_en=pieza.actualizado_en,
    )


def pieza_o_404(db: Session, id: int) -> Pieza:
    pieza = db.get(Pieza, id)
    if pieza is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="La pieza no existe")
    return pieza


def pieza_propia(db: Session, id: int, usuario: Usuario) -> Pieza:
    """Primero 404 si no existe, después 403 si es de otra persona."""
    pieza = pieza_o_404(db, id)
    if pieza.usuario_id != usuario.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Solo el dueño puede modificar esta pieza")
    return pieza


def categoria_por_slug(db: Session, slug: str) -> Categoria:
    categoria = db.scalar(select(Categoria).where(Categoria.slug == slug))
    if categoria is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="La categoría no existe")
    return categoria


@router.get("", response_model=Pagina[PiezaRespuesta])
def listar_piezas(
    request: Request,
    db: Sesion,
    q: str | None = None,
    categoria: str | None = None,
    orden: Literal["recientes", "populares"] = "recientes",
    limite: Annotated[int, Query(ge=1, le=50)] = 20,
    desplazamiento: Annotated[int, Query(ge=0)] = 0,
):
    consulta = select(Pieza)
    if q and q.strip():
        texto = q.strip()
    
        consulta = consulta.where(
            or_(Pieza.nombre.icontains(texto, autoescape=True), Pieza.descripcion.icontains(texto, autoescape=True))
        )
    if categoria:
    
        consulta = consulta.join(Pieza.categoria).where(Categoria.slug == categoria)

    total = db.scalar(select(func.count()).select_from(consulta.subquery()))

    piezas = db.scalars(
        consulta.options(selectinload(Pieza.usuario), selectinload(Pieza.categoria))
        .order_by(Pieza.creado_en.desc(), Pieza.id.desc())
        .limit(limite)
        .offset(desplazamiento)
    ).all()

    return Pagina(
        items=[a_respuesta(pieza, request) for pieza in piezas],
        total=total,
        limite=limite,
        desplazamiento=desplazamiento,
    )


@router.get("/{id}", response_model=PiezaRespuesta)
def ver_pieza(id: int, request: Request, db: Sesion):
    return a_respuesta(pieza_o_404(db, id), request)


@router.get("/{id}/imagen", response_class=Response)
def imagen_pieza(id: int, db: Sesion):
    pieza = db.get(Pieza, id)
    if pieza is None or pieza.imagen_tipo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="La pieza no tiene una imagen guardada")
    # imagen_datos es diferido: recién aquí se lee de la base.
    return Response(
        content=pieza.imagen_datos,
        media_type=pieza.imagen_tipo,
        # La dirección cambia con ?v= en cada edición, así que el navegador puede guardarla por un año.
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@router.post("", response_model=PiezaRespuesta, status_code=status.HTTP_201_CREATED)
def crear_pieza(datos: DatosPieza, usuario: UsuarioActual, request: Request, db: Sesion):
    pieza = Pieza(
        nombre=datos.nombre,
        descripcion=datos.descripcion,
        categoria=categoria_por_slug(db, datos.categoria),
        usuario=usuario,
    )
    asignar_imagen(pieza, datos.imagen_url)
    db.add(pieza)
    db.commit()
    db.refresh(pieza) 
    return a_respuesta(pieza, request)


@router.put("/{id}", response_model=PiezaRespuesta)
def editar_pieza(id: int, datos: DatosPieza, usuario: UsuarioActual, request: Request, db: Sesion):
    pieza = pieza_propia(db, id, usuario)
    pieza.nombre = datos.nombre
    pieza.descripcion = datos.descripcion
    pieza.categoria = categoria_por_slug(db, datos.categoria)
    asignar_imagen(pieza, datos.imagen_url)
    db.commit()
    db.refresh(pieza)  
    return a_respuesta(pieza, request)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_pieza(id: int, usuario: UsuarioActual, db: Sesion):
    pieza = pieza_propia(db, id, usuario)
    db.delete(pieza)
    db.commit()
