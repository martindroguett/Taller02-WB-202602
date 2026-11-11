"""Datos de prueba: 18 usuarios con sus piezas, seguimientos, me gusta, guardados y comentarios.

Uso (con la API levantada con Docker):  docker compose exec api python seed.py
Las fotos de las piezas están en frontend/public/fotos-demo; se bajan antes con
python3 backend/descargar_fotos_demo.py (ver README).
Se puede repetir: borra a los usuarios de prueba (con todo lo suyo) y los vuelve a crear.
Todos tienen la misma contraseña (solo para desarrollo).
"""
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

from database import SessionLocal
from models import (
    Categoria,
    Comentario,
    ComentarioMeGusta,
    Guardado,
    MeGusta,
    Pieza,
    Seguimiento,
    Usuario,
)
from seguridad import hashear_password
from sqlalchemy import delete, select

CLAVE = "demo12345"

# (username, nombre visible, bio, categorías que colecciona)
USUARIOS = [
    ("camila", "Camila Rojas", "Cartas de béisbol y mesas de juego. Colecciono desde los 12.", ["cartas"]),
    ("diego", "Diego Fuentes", "Retro gaming: cartuchos, consolas y portátiles.", ["videojuegos"]),
    ("sofia", "Sofía Vidal", "Vinilos de jazz y electrónica. Mi tocadiscos manda.", ["vinilos"]),
    ("mateo", "Mateo Soto", "Figuras y juguetes de colección.", ["juguetes"]),
    ("valentina", "Valentina Paz", "Un poco de todo, siempre buscando la próxima pieza.", ["juguetes", "videojuegos", "vinilos", "cartas"]),
    ("andres", "Andrés Molina", "Switch, DS y todo lo de Nintendo. Pregúntame por Zelda.", ["videojuegos"]),
    ("lucia", "Lucía Herrera", "Cartas Pokémon y Lego. Sí, soy adulta.", ["cartas", "juguetes"]),
    ("tomas", "Tomás Araya", "Vinilos de rock y soul. Cajoneo todos los sábados.", ["vinilos"]),
    ("javiera", "Javiera Núñez", "Funko Pop y figuras de anime ordenadas por color.", ["juguetes"]),
    ("felipe", "Felipe Castro", "Juegos de PlayStation y cartas de Yu-Gi-Oh!.", ["videojuegos", "cartas"]),
    ("isidora", "Isidora Vega", "Vinilos de colores, mientras más raros mejor.", ["vinilos"]),
    ("nicolas", "Nicolás Pizarro", "Cartas deportivas antiguas y cromos de álbumes.", ["cartas"]),
    ("catalina", "Catalina Ríos", "Hot Wheels, Cars y autitos a escala.", ["juguetes"]),
    ("benjamin", "Benjamín Salas", "Juegos físicos y discos. Cero digital.", ["videojuegos", "vinilos"]),
    ("antonia", "Antonia Bravo", "Un poco de todo, pero sobre todo cubos Rubik.", ["juguetes", "cartas", "vinilos"]),
    ("joaquin", "Joaquín Tapia", "Cartuchos de Game Boy y DS en su caja.", ["videojuegos"]),
    ("fernanda", "Fernanda Lagos", "Tarot, cartas de juego y todo lo que tenga ilustración.", ["cartas"]),
    ("martin", "Martín Espinoza", "Vinilos y Lego. Armar y escuchar al mismo tiempo.", ["vinilos", "juguetes"]),
]

COMENTARIOS = {
    "cartas": [
        "¡Qué buen estado! ¿La compraste o te la regalaron?",
        "Esa está difícil de encontrar, felicitaciones.",
        "Me encantan los colores de esta carta.",
        "¿La tienes en funda rígida? Yo perdí una por humedad.",
        "Mi abuelo tenía una igual, qué recuerdos.",
        "¿Cuánto pagaste? Me dio curiosidad.",
    ],
    "videojuegos": [
        "Mi primer juego de la infancia, qué nostalgia.",
        "¿Funciona perfecto? Yo tengo uno que no lee.",
        "Qué bien guardado, con caja y todo.",
        "Esa edición es difícil de ver, está genial.",
        "Me falta ese en mi colección, ¿lo cambiarías?",
        "Lo jugué hasta el cansancio, un clásico.",
    ],
    "vinilos": [
        "Hermoso el color, se ve increíble.",
        "¿Cómo suena? Los prensados de colores a veces fallan.",
        "Qué buena portada, directo a mi lista de deseos.",
        "Me tinca ese disco, ¿dónde lo conseguiste?",
        "Se ve impecable, felicitaciones.",
        "Ese me lo perdí en la feria, qué envidia.",
    ],
    "juguetes": [
        "Qué buen detalle, se ve nuevo.",
        "Tengo uno igual pero sin caja, el tuyo gana.",
        "Me encanta, quedó genial en tu repisa.",
        "¿Es de la edición limitada?",
        "Hace años que busco uno así.",
        "Muy bien conservado, se nota el cariño.",
    ],
}

RESPUESTAS = [
    "¡Gracias! Lo conseguí en una feria hace poco.",
    "Sí, vale totalmente la pena.",
    "Te aviso si veo otro parecido.",
    "Lo encontré de casualidad, tuve suerte.",
    "Jaja, gracias, me costó un buen tiempo.",
    "Cuando quieras te lo muestro en persona.",
]

DIAS = 40
raiz = Path(__file__).parent


def main() -> None:
    azar = random.Random(2026)
    ahora = datetime.now(timezone.utc)
    fotos = json.loads((raiz / "fotos_demo.json").read_text(encoding="utf-8"))

    def hace(dias_max: float, dias_min: float = 0) -> datetime:
        return ahora - timedelta(days=azar.uniform(dias_min, dias_max))

    with SessionLocal() as db:
        db.execute(delete(Usuario).where(Usuario.username.in_([u[0] for u in USUARIOS])))
        # Un solo commit al final: si falla la carga, también se revierte el borrado.

        categorias = {c.slug: c for c in db.scalars(select(Categoria))}
        usuarios = {}
        for n, (nombre, visible, bio, _) in enumerate(USUARIOS):
            usuarios[nombre] = Usuario(
                username=nombre, email=f"{nombre}@vitrina.app", nombre_visible=visible, bio=bio,
                password_hash=hashear_password(CLAVE), creado_en=hace(DIAS + 60, DIAS),
            )
        db.add_all(usuarios.values())
        db.flush()

        # Cada pieza va a un coleccionista de su categoría, rotando para repartirlas parejo.
        coleccionistas = {slug: [u[0] for u in USUARIOS if slug in u[3]] for slug in categorias}
        turno = dict.fromkeys(categorias, 0)
        piezas = []
        for foto in fotos:
            slug = foto["categoria"]
            dueno = coleccionistas[slug][turno[slug] % len(coleccionistas[slug])]
            turno[slug] += 1
            fecha = hace(DIAS)
            piezas.append(Pieza(
                nombre=foto["nombre"], descripcion=foto["descripcion"], imagen_url=f"/fotos-demo/{foto['archivo']}",
                usuario_id=usuarios[dueno].id, categoria_id=categorias[slug].id, creado_en=fecha, actualizado_en=fecha,
            ))
        db.add_all(piezas)
        db.flush()

        # Cada usuario sigue a entre 6 y 11 personas, de preferencia con gustos parecidos.
        # camila (la cuenta de la demo) la siguen todos menos dos.
        nombres = [u[0] for u in USUARIOS]
        gustos = {u[0]: set(u[3]) for u in USUARIOS}
        seguimientos = set()
        for a in nombres:
            otros = [b for b in nombres if b != a]
            afines = [b for b in otros if gustos[a] & gustos[b]]
            elegidos = set(azar.sample(afines, min(len(afines), azar.randint(3, 6))))
            elegidos |= set(azar.sample(otros, azar.randint(3, 5)))
            seguimientos |= {(a, b) for b in elegidos}
        seguimientos |= {(a, "camila") for a in nombres[1:-2]}
        seguimientos |= {("camila", b) for b in ("diego", "sofia", "mateo", "lucia", "nicolas", "fernanda", "javiera", "andres")}
        db.add_all(
            Seguimiento(seguidor_id=usuarios[a].id, seguido_id=usuarios[b].id, creado_en=hace(DIAS))
            for a, b in sorted(seguimientos) if a != b
        )

        piezas_de = {}
        for pieza in piezas:
            piezas_de.setdefault(pieza.usuario_id, []).append(pieza)
        seguidos = {}
        for a, b in seguimientos:
            seguidos.setdefault(a, []).append(b)

        # Me gusta y guardados sobre las piezas de la gente que sigue; algunas piezas quedan sin ninguno.
        # Cada usuario además comenta algunas de ellas.
        comentarios = []
        for a, lista in seguidos.items():
            for b in lista:
                for pieza in piezas_de.get(usuarios[b].id, []):
                    if azar.random() < 0.55:
                        db.add(MeGusta(usuario_id=usuarios[a].id, pieza_id=pieza.id, creado_en=hace(DIAS)))
                    if azar.random() < 0.18:
                        db.add(Guardado(usuario_id=usuarios[a].id, pieza_id=pieza.id, creado_en=hace(DIAS)))
                    if azar.random() < 0.12:
                        slug = next(s for s, c in categorias.items() if c.id == pieza.categoria_id)
                        comentarios.append(Comentario(
                            usuario_id=usuarios[a].id, pieza_id=pieza.id, texto=azar.choice(COMENTARIOS[slug]),
                            creado_en=max(pieza.creado_en, hace(DIAS)) + timedelta(hours=azar.uniform(1, 60)),
                        ))
        db.add_all(comentarios)
        db.flush()

        # Los dueños responden a algunos comentarios, y la gente le da me gusta a varios.
        respuestas = []
        dueno_de = {p.id: p.usuario_id for p in piezas}
        for c in comentarios:
            if azar.random() < 0.35 and dueno_de[c.pieza_id] != c.usuario_id:
                respuestas.append(Comentario(
                    usuario_id=dueno_de[c.pieza_id], pieza_id=c.pieza_id, padre_id=c.id,
                    texto=azar.choice(RESPUESTAS), creado_en=c.creado_en + timedelta(hours=azar.uniform(1, 30)),
                ))
        db.add_all(respuestas)
        db.flush()
        gustan = set()
        for c in comentarios + respuestas:
            for u in azar.sample(nombres, azar.randint(0, 4)):
                if usuarios[u].id != c.usuario_id:
                    gustan.add((usuarios[u].id, c.id))
        db.add_all(ComentarioMeGusta(usuario_id=u, comentario_id=c) for u, c in gustan)

        db.commit()
        print(f"Listo: {len(USUARIOS)} usuarios, {len(piezas)} piezas, {len(seguimientos)} seguimientos, "
              f"{len(comentarios) + len(respuestas)} comentarios.")
        print(f"Ingresa con camila@vitrina.app (o diego@, sofia@, mateo@, etc.) y la clave {CLAVE}")


if __name__ == "__main__":
    main()
