"""Datos de prueba: usuarios, piezas, seguimientos, me gusta, guardados y comentarios.

Uso (con la API levantada con Docker):  docker compose exec api python seed.py
Se puede repetir: si los usuarios de prueba ya existen, no hace nada.
Todos los usuarios de prueba tienen la misma contraseña (solo para desarrollo).
"""
from sqlalchemy import select

from database import SessionLocal
from models import Categoria, Comentario, Guardado, MeGusta, Pieza, Seguimiento, Usuario
from seguridad import hashear_password

CLAVE = "demo12345"

# (username, bio)
USUARIOS = [
    ("camila", "Cartas de béisbol y mesas de juego. Colecciono desde los 12."),
    ("diego", "Retro gaming: cartuchos, consolas y portátiles."),
    ("sofia", "Vinilos de jazz y electrónica. Mi tocadiscos manda."),
    ("mateo", "Figuras y juguetes vintage."),
    ("valentina", "Un poco de todo, siempre buscando la próxima pieza."),
]

# (dueño, categoría, nombre, descripción, foto en frontend/public/fotos)
PIEZAS = [
    ("camila", "cartas", "Carta de béisbol 1989", "Edición de colección en buen estado, guardada en funda.", "carta-beisbol.jpg"),
    ("camila", "cartas", "Mesa de cartas", "Mi set de cartas listo para una partida.", "mesa-cartas.jpg"),
    ("camila", "cartas", "Carta rookie firmada", "Con certificado de autenticidad.", "carta-beisbol.jpg"),
    ("diego", "videojuegos", "Cartucho NES", "Funciona perfecto, etiqueta original.", "cartucho-nes.jpg"),
    ("diego", "videojuegos", "Game Boy clásica", "Pantalla sin rayas y carcasa original.", "gameboy.jpg"),
    ("diego", "videojuegos", "Cartucho de plataformas", "Lo compré en una feria, jamás lo vendería.", "cartucho-nes.jpg"),
    ("sofia", "vinilos", "Vinilo negro clásico", "Prensado original, suena increíble.", "vinilo-negro.jpg"),
    ("sofia", "vinilos", "Vinilo turquesa edición limitada", "Solo 500 copias en el mundo.", "vinilo-turquesa.jpg"),
    ("sofia", "vinilos", "Vinilo de jazz", "Reedición con portada original.", "vinilo-negro.jpg"),
    ("mateo", "juguetes", "Robot de latón", "Juguete de cuerda de los años 60.", "robot.jpg"),
    ("mateo", "juguetes", "Soldadito de plomo", "Pintado a mano, parte de un set de 12.", "soldado.jpg"),
    ("mateo", "juguetes", "Robot espacial", "Con luces que aún funcionan.", "robot.jpg"),
    ("valentina", "juguetes", "Soldado de colección", "Lo encontré en un mercado de pulgas.", "soldado.jpg"),
    ("valentina", "videojuegos", "Game Boy verde", "Edición especial, con su caja.", "gameboy.jpg"),
    ("valentina", "vinilos", "Vinilo turquesa", "Mi primera pieza de la colección.", "vinilo-turquesa.jpg"),
]

# (seguidor, seguido)
SEGUIMIENTOS = [
    ("camila", "diego"), ("camila", "sofia"), ("camila", "mateo"),
    ("diego", "camila"), ("diego", "sofia"),
    ("sofia", "camila"), ("sofia", "valentina"),
    ("mateo", "camila"), ("mateo", "diego"), ("mateo", "sofia"),
    ("valentina", "camila"), ("valentina", "diego"), ("valentina", "mateo"),
]

# (usuario, nombre de la pieza, comentario)
COMENTARIOS = [
    ("diego", "Carta de béisbol 1989", "¡Qué buen estado! ¿La compraste o te la regalaron?"),
    ("sofia", "Game Boy clásica", "Mi primera consola, me trae muchos recuerdos."),
    ("camila", "Vinilo turquesa edición limitada", "Hermoso el color."),
    ("valentina", "Robot de latón", "Tiene que ser difícil de encontrar así."),
]


def main() -> None:
    with SessionLocal() as db:
        if db.scalar(select(Usuario).where(Usuario.username == USUARIOS[0][0])):
            print("Los datos de prueba ya existen; no se agregó nada.")
            return

        categorias = {c.slug: c for c in db.scalars(select(Categoria))}
        usuarios = {
            nombre: Usuario(
                username=nombre, email=f"{nombre}@vitrina.app", bio=bio,
                password_hash=hashear_password(CLAVE),
            )
            for nombre, bio in USUARIOS
        }
        db.add_all(usuarios.values())
        db.flush()

        piezas = {}
        for dueno, categoria, nombre, descripcion, foto in PIEZAS:
            piezas[nombre] = Pieza(
                nombre=nombre, descripcion=descripcion, imagen_url=f"/fotos/{foto}",
                usuario_id=usuarios[dueno].id, categoria_id=categorias[categoria].id,
            )
        db.add_all(piezas.values())
        db.flush()

        db.add_all(
            Seguimiento(seguidor_id=usuarios[a].id, seguido_id=usuarios[b].id) for a, b in SEGUIMIENTOS
        )
        # Cada usuario da me gusta y guarda las piezas de las personas que sigue.
        for a, b in SEGUIMIENTOS:
            for pieza in piezas.values():
                if pieza.usuario_id == usuarios[b].id:
                    db.add(MeGusta(usuario_id=usuarios[a].id, pieza_id=pieza.id))
                    if pieza.id % 2 == 0:
                        db.add(Guardado(usuario_id=usuarios[a].id, pieza_id=pieza.id))
        db.add_all(
            Comentario(usuario_id=usuarios[u].id, pieza_id=piezas[p].id, texto=t) for u, p, t in COMENTARIOS
        )
        db.commit()
        print(f"Listo: {len(USUARIOS)} usuarios, {len(PIEZAS)} piezas.")
        print(f"Ingresa con camila@vitrina.app (o diego@, sofia@, mateo@, valentina@) y la clave {CLAVE}")


main()
