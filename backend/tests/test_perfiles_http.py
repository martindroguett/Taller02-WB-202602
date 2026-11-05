"""Run only against a disposable API: TEST_API_URL=http://localhost:8000/api python backend/tests/test_perfiles_http.py."""
import json
import os
import unittest
from urllib.error import HTTPError
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
            return respuesta.status, json.load(respuesta)
    except HTTPError as error:
        with error:
            return error.code, json.load(error)


class PerfilesHTTP(unittest.TestCase):
    def test_perfiles_y_seguimientos(self):
        sufijo = uuid4().hex[:10]
        nombres = [f"perfil_{sufijo}", f"autor_{sufijo}"]
        tokens = []
        for nombre in nombres:
            codigo, cuerpo = pedir("POST", "/auth/registro", {
                "username": nombre, "email": f"{nombre}@example.com", "password": "prueba123"
            })
            self.assertEqual(codigo, 201, cuerpo)
            tokens.append(cuerpo["access_token"])

        ruta = f"/usuarios/{nombres[1]}"
        codigo, perfil = pedir("GET", ruta)
        self.assertEqual(codigo, 200)
        self.assertEqual(set(perfil), {"id", "username", "bio", "seguidores", "siguiendo", "lo_sigo"})
        self.assertEqual((perfil["bio"], perfil["seguidores"], perfil["lo_sigo"]), ("", 0, False))
        codigo, vacia = pedir("GET", ruta + "/piezas")
        self.assertEqual((codigo, vacia), (200, {"items": [], "total": 0, "limite": 20, "desplazamiento": 0}))
        self.assertEqual(pedir("POST", ruta + "/seguir")[0], 401)
        self.assertEqual(pedir("POST", ruta + "/seguir", token="invalido")[0], 401)
        self.assertEqual(pedir("DELETE", ruta + "/seguir")[0], 401)
        self.assertEqual(pedir("POST", f"/usuarios/{nombres[0]}/seguir", token=tokens[0])[0], 400)
        for metodo, suf in [("GET", ""), ("GET", "/piezas"), ("POST", "/seguir"), ("DELETE", "/seguir")]:
            self.assertEqual(pedir(metodo, "/usuarios/no_existe_" + sufijo + suf, token=tokens[0])[0], 404)

        for _ in range(2):
            self.assertEqual(pedir("POST", ruta + "/seguir", token=tokens[0]),
                             (200, {"lo_sigo": True, "seguidores": 1}))
        self.assertTrue(pedir("GET", ruta, token=tokens[0])[1]["lo_sigo"])
        self.assertFalse(pedir("GET", ruta)[1]["lo_sigo"])
        self.assertEqual(pedir("GET", f"/usuarios/{nombres[0]}")[1]["siguiendo"], 1)

        ids = []
        for numero in range(3):
            codigo, pieza = pedir("POST", "/piezas", {
                "nombre": f"Pieza {numero}", "descripcion": "Prueba", "categoria": "vinilos",
                "imagen_url": "/fotos/prueba.jpg"
            }, tokens[1])
            self.assertEqual(codigo, 201, pieza)
            ids.append(pieza["id"])
        self.assertEqual(pedir("POST", f"/piezas/{ids[1]}/megusta", token=tokens[0])[0], 200)
        self.assertEqual(pedir("POST", f"/piezas/{ids[1]}/guardar", token=tokens[0])[0], 200)
        codigo, todas = pedir("GET", ruta + "/piezas")
        self.assertEqual((codigo, todas["total"], todas["limite"], todas["desplazamiento"]), (200, 3, 20, 0))
        self.assertEqual([p["id"] for p in todas["items"]], list(reversed(ids)))
        self.assertFalse(todas["items"][1]["gustada"])
        self.assertFalse(todas["items"][1]["guardada"])
        codigo, pagina = pedir("GET", ruta + "/piezas?limite=1&desplazamiento=1", token=tokens[0])
        self.assertEqual(codigo, 200)
        self.assertEqual((pagina["total"], pagina["limite"], pagina["desplazamiento"]), (3, 1, 1))
        self.assertEqual([p["id"] for p in pagina["items"]], [ids[1]])
        self.assertTrue(pagina["items"][0]["gustada"])
        self.assertTrue(pagina["items"][0]["guardada"])
        self.assertEqual(pedir("GET", ruta + "/piezas?limite=0")[0], 422)
        for _ in range(2):
            self.assertEqual(pedir("DELETE", ruta + "/seguir", token=tokens[0]),
                             (200, {"lo_sigo": False, "seguidores": 0}))
        self.assertFalse(pedir("GET", ruta, token=tokens[0])[1]["lo_sigo"])
        self.assertEqual(pedir("GET", f"/usuarios/{nombres[0]}")[1]["siguiendo"], 0)


if __name__ == "__main__":
    unittest.main()
