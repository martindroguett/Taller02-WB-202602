from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, Request, Response, status
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, selectinload

from database import Sesion
from imagenes import asignar_imagen, url_imagen
from models import Categoria, Guardado, MeGusta, Pieza, Usuario
from schemas import DatosPieza, Dueno, Pagina, PiezaRespuesta
from seguridad import UsuarioActual, UsuarioOpcional

router = APIRouter(prefix="/piezas", tags=["Piezas"])

Limite = Annotated[int, Query(ge=1, le=50)]
Desplazamiento = Annotated[int, Query(ge=0)]


def a_respuesta(pieza: Pieza, request: Request, gustada: bool, guardada: bool) -> PiezaRespuesta:
    return PiezaRespuesta(
        id=pieza.id,
        nombre=pieza.nombre,
        descripcion=pieza.descripcion,
        categoria=pieza.categoria.slug,
        imagen_url=url_imagen(pieza, request),
        dueno=Dueno.model_validate(pieza.usuario),
        megusta=pieza.megusta,
        guardados=pieza.guardados,
        gustada=gustada,
        guardada=guardada,
        creado_en=pieza.creado_en,
        actualizado_en=pieza.actualizado_en,
    )


def a_respuestas(
    db: Session, piezas: list[Pieza], request: Request, usuario: Usuario | None
) -> list[PiezaRespuesta]:
    """Arma las respuestas y marca qué piezas le gustaron o guardó el usuario del token.

    Hace dos consultas para toda la lista, no dos por pieza: busca de una vez los ids marcados.
    """
    ids = [pieza.id for pieza in piezas]
    gustadas: set[int] = set()
    guardadas: set[int] = set()
    if usuario is not None and ids:
        gustadas = set(db.scalars(
            select(MeGusta.pieza_id).where(MeGusta.usuario_id == usuario.id, MeGusta.pieza_id.in_(ids))
        ))
        guardadas = set(db.scalars(
            select(Guardado.pieza_id).where(Guardado.usuario_id == usuario.id, Guardado.pieza_id.in_(ids))
        ))
    return [a_respuesta(pieza, request, pieza.id in gustadas, pieza.id in guardadas) for pieza in piezas]


def paginar(
    db: Session,
    consulta: Select,
    request: Request,
    usuario: Usuario | None,
    limite: int,
    desplazamiento: int,
) -> Pagina[PiezaRespuesta]:
    """Cuenta el total y trae una página de piezas. La consulta ya debe venir ordenada."""
    total = db.scalar(select(func.count()).select_from(consulta.order_by(None).subquery()))
    piezas = db.scalars(
        consulta.options(selectinload(Pieza.usuario), selectinload(Pieza.categoria))
        .limit(limite)
        .offset(desplazamiento)
    ).all()
    return Pagina(
        items=a_respuestas(db, list(piezas), request, usuario),
        total=total,
        limite=limite,
        desplazamiento=desplazamiento,
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
    usuario: UsuarioOpcional,
    q: str | None = None,
    categoria: str | None = None,
    orden: Literal["recientes", "populares"] = "recientes",
    limite: Limite = 20,
    desplazamiento: Desplazamiento = 0,
):
    consulta = select(Pieza)
    if q and q.strip():
        texto = q.strip()

        consulta = consulta.where(
            or_(Pieza.nombre.icontains(texto, autoescape=True), Pieza.descripcion.icontains(texto, autoescape=True))
        )
    if categoria:

        consulta = consulta.join(Pieza.categoria).where(Categoria.slug == categoria)

    recientes = (Pieza.creado_en.desc(), Pieza.id.desc())
    if orden == "populares":
        # Más me gusta primero; si empatan, la más nueva.
        consulta = consulta.order_by(Pieza.megusta.desc(), *recientes)
    else:
        consulta = consulta.order_by(*recientes)

    return paginar(db, consulta, request, usuario, limite, desplazamiento)


@router.get("/{id}", response_model=PiezaRespuesta)
def ver_pieza(id: int, request: Request, db: Sesion, usuario: UsuarioOpcional):
    return a_respuestas(db, [pieza_o_404(db, id)], request, usuario)[0]


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
    return a_respuestas(db, [pieza], request, usuario)[0]


@router.put("/{id}", response_model=PiezaRespuesta)
def editar_pieza(id: int, datos: DatosPieza, usuario: UsuarioActual, request: Request, db: Sesion):
    pieza = pieza_propia(db, id, usuario)
    pieza.nombre = datos.nombre
    pieza.descripcion = datos.descripcion
    pieza.categoria = categoria_por_slug(db, datos.categoria)
    asignar_imagen(pieza, datos.imagen_url)
    db.commit()
    db.refresh(pieza)
    return a_respuestas(db, [pieza], request, usuario)[0]


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_pieza(id: int, usuario: UsuarioActual, db: Sesion):
    pieza = pieza_propia(db, id, usuario)
    db.delete(pieza)
    db.commit()
