"""Use only with a disposable migrated database: TEST_API_URL=http://localhost:8000/api python3 backend/tests/test_interacciones_http.py."""
import json
import os
import unittest
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen
from uuid import uuid4

BASE = os.environ["TEST_API_URL"].rstrip("/")


def pedir(metodo, ruta, datos=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(BASE + ruta, data=json.dumps(datos).encode() if datos is not None else None,
                      headers=headers, method=metodo)
    try:
        with urlopen(request) as respuesta:
            cuerpo = respuesta.read()
            return respuesta.status, json.loads(cuerpo) if cuerpo else None
    except HTTPError as error:
        with error:
            return error.code, json.loads(error.read())


class InteraccionesHTTP(unittest.TestCase):
    def setUp(self):
        # Cuentas y piezas nuevas en cada prueba: los resultados no dependen de lo que ya haya en la base.
        self.sufijo = uuid4().hex[:10]
        self.tokens = {}
        for rol in ("autor", "fan", "otro"):
            nombre = f"{rol}_{self.sufijo}"
            codigo, cuerpo = pedir("POST", "/auth/registro", {
                "username": nombre, "email": f"{nombre}@example.com", "password": "prueba123"
            })
            self.assertEqual(codigo, 201, cuerpo)
            self.tokens[rol] = cuerpo["access_token"]

    def crear_pieza(self, nombre, token=None, categoria="vinilos"):
        codigo, pieza = pedir("POST", "/piezas", {
            "nombre": f"{nombre} {self.sufijo}", "descripcion": "Prueba", "categoria": categoria,
            "imagen_url": "/fotos/prueba.jpg",
        }, token or self.tokens["autor"])
        self.assertEqual(codigo, 201, pieza)
        return pieza["id"]

    def test_me_gusta(self):
        ruta = f"/piezas/{self.crear_pieza('Gustada')}"
        self.assertEqual(pedir("POST", ruta + "/megusta")[0], 401)
        self.assertEqual(pedir("DELETE", ruta + "/megusta")[0], 401)
        self.assertEqual(pedir("POST", "/piezas/999999999/megusta", token=self.tokens["fan"])[0], 404)

        # Repetir la acción no es error ni suma dos veces.
        for _ in range(2):
            self.assertEqual(pedir("POST", ruta + "/megusta", token=self.tokens["fan"]),
                             (200, {"gustada": True, "megusta": 1}))
        self.assertEqual(pedir("POST", ruta + "/megusta", token=self.tokens["otro"]),
                         (200, {"gustada": True, "megusta": 2}))

        codigo, con_token = pedir("GET", ruta, token=self.tokens["fan"])
        self.assertEqual((codigo, con_token["megusta"], con_token["gustada"]), (200, 2, True))
        codigo, sin_token = pedir("GET", ruta)
        self.assertEqual((codigo, sin_token["megusta"], sin_token["gustada"]), (200, 2, False))

        for _ in range(2):
            self.assertEqual(pedir("DELETE", ruta + "/megusta", token=self.tokens["otro"]),
                             (200, {"gustada": False, "megusta": 1}))

    def test_guardar_y_favoritos(self):
        ids = [self.crear_pieza(f"Guardada {n}") for n in range(3)]
        self.assertEqual(pedir("POST", f"/piezas/{ids[0]}/guardar")[0], 401)
        self.assertEqual(pedir("GET", "/favoritos")[0], 401)
        self.assertEqual(pedir("POST", "/piezas/999999999/guardar", token=self.tokens["fan"])[0], 404)
        self.assertEqual(pedir("GET", "/favoritos", token=self.tokens["fan"]),
                         (200, {"items": [], "total": 0, "limite": 20, "desplazamiento": 0}))

        # Se guardan en el orden 2, 0, 1: Favoritos muestra primero la guardada más recientemente.
        for i in (2, 0, 1):
            self.assertEqual(pedir("POST", f"/piezas/{ids[i]}/guardar", token=self.tokens["fan"]),
                             (200, {"guardada": True, "guardados": 1}))
        self.assertEqual(pedir("POST", f"/piezas/{ids[1]}/guardar", token=self.tokens["fan"]),
                         (200, {"guardada": True, "guardados": 1}))
        codigo, favoritos = pedir("GET", "/favoritos", token=self.tokens["fan"])
        self.assertEqual((codigo, favoritos["total"]), (200, 3))
        self.assertEqual([p["id"] for p in favoritos["items"]], [ids[1], ids[0], ids[2]])
        self.assertTrue(all(p["guardada"] for p in favoritos["items"]))

        codigo, pagina = pedir("GET", "/favoritos?limite=1&desplazamiento=1", token=self.tokens["fan"])
        self.assertEqual((codigo, pagina["total"], [p["id"] for p in pagina["items"]]), (200, 3, [ids[0]]))
        self.assertEqual(pedir("GET", "/favoritos?limite=0", token=self.tokens["fan"])[0], 422)

        carta = self.crear_pieza("Carta", categoria="cartas")
        self.assertEqual(pedir("POST", f"/piezas/{carta}/guardar", token=self.tokens["fan"])[0], 200)
        codigo, cartas = pedir("GET", "/favoritos?categoria=cartas", token=self.tokens["fan"])
        self.assertEqual((codigo, cartas["total"], [p["id"] for p in cartas["items"]]), (200, 1, [carta]))
        codigo, vinilos = pedir("GET", "/favoritos?categoria=vinilos&limite=1&desplazamiento=1", token=self.tokens["fan"])
        self.assertEqual((codigo, vinilos["total"], [p["id"] for p in vinilos["items"]]), (200, 3, [ids[0]]))
        self.assertEqual(pedir("DELETE", f"/piezas/{carta}/guardar", token=self.tokens["fan"])[0], 200)

        # Los favoritos son de cada usuario.
        self.assertEqual(pedir("GET", "/favoritos", token=self.tokens["otro"])[1]["total"], 0)

        for _ in range(2):
            self.assertEqual(pedir("DELETE", f"/piezas/{ids[0]}/guardar", token=self.tokens["fan"]),
                             (200, {"guardada": False, "guardados": 0}))
        codigo, favoritos = pedir("GET", "/favoritos", token=self.tokens["fan"])
        self.assertEqual([p["id"] for p in favoritos["items"]], [ids[1], ids[2]])

        # Al borrar una pieza, desaparece de los favoritos de quien la guardó.
        self.assertEqual(pedir("DELETE", f"/piezas/{ids[1]}", token=self.tokens["autor"])[0], 204)
        codigo, favoritos = pedir("GET", "/favoritos", token=self.tokens["fan"])
        self.assertEqual((favoritos["total"], [p["id"] for p in favoritos["items"]]), (1, [ids[2]]))

    def test_orden_populares(self):
        antigua = self.crear_pieza("Antigua")
        nueva = self.crear_pieza("Nueva")
        filtro = f"/piezas?q={self.sufijo}"
        self.assertEqual([p["id"] for p in pedir("GET", filtro)[1]["items"]], [nueva, antigua])
        self.assertEqual(pedir("POST", f"/piezas/{antigua}/megusta", token=self.tokens["fan"])[0], 200)
        self.assertEqual([p["id"] for p in pedir("GET", filtro + "&orden=populares")[1]["items"]],
                         [antigua, nueva])
        # Sin me gusta, «populares» desempata por la más nueva.
        self.assertEqual(pedir("DELETE", f"/piezas/{antigua}/megusta", token=self.tokens["fan"])[0], 200)
        self.assertEqual([p["id"] for p in pedir("GET", filtro + "&orden=populares")[1]["items"]],
                         [nueva, antigua])
        self.assertEqual(pedir("GET", filtro + "&orden=otro")[0], 422)

    def test_feed_y_seguidos(self):
        autor, fan = f"autor_{self.sufijo}", f"fan_{self.sufijo}"
        primera = self.crear_pieza("Primera")
        segunda = self.crear_pieza("Segunda")
        self.crear_pieza("Ajena", self.tokens["otro"])

        self.assertEqual(pedir("GET", "/feed")[0], 401)
        vacio = {"items": [], "total": 0, "limite": 20, "desplazamiento": 0}
        self.assertEqual(pedir("GET", "/feed", token=self.tokens["fan"]), (200, vacio))
        self.assertEqual(pedir("GET", f"/usuarios/{fan}/seguidos"), (200, vacio))
        self.assertEqual(pedir("GET", f"/usuarios/no_existe_{self.sufijo}/seguidos")[0], 404)

        self.assertEqual(pedir("POST", f"/usuarios/{quote(autor)}/seguir", token=self.tokens["fan"])[0], 200)
        codigo, feed = pedir("GET", "/feed", token=self.tokens["fan"])
        self.assertEqual((codigo, feed["total"]), (200, 2))
        # Solo las piezas de quien sigue, la más nueva primero; nada del usuario «otro».
        self.assertEqual([p["id"] for p in feed["items"]], [segunda, primera])
        self.assertTrue(all(p["dueno"]["username"] == autor for p in feed["items"]))
        codigo, pagina = pedir("GET", "/feed?limite=1&desplazamiento=1", token=self.tokens["fan"])
        self.assertEqual((pagina["total"], [p["id"] for p in pagina["items"]]), (2, [primera]))

        codigo, seguidos = pedir("GET", f"/usuarios/{fan}/seguidos")
        self.assertEqual((codigo, seguidos["total"], [u["username"] for u in seguidos["items"]]),
                         (200, 1, [autor]))
        self.assertEqual(set(seguidos["items"][0]), {"id", "username"})

        self.assertEqual(pedir("DELETE", f"/usuarios/{quote(autor)}/seguir", token=self.tokens["fan"])[0], 200)
        self.assertEqual(pedir("GET", "/feed", token=self.tokens["fan"]), (200, vacio))
        self.assertEqual(pedir("GET", f"/usuarios/{fan}/seguidos"), (200, vacio))


if __name__ == "__main__":
    unittest.main()
