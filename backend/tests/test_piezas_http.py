"""Use only with a disposable migrated database: TEST_API_URL=http://localhost:8000/api python3 backend/tests/test_piezas_http.py."""
import base64
import json
import os
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

BASE = os.environ['TEST_API_URL'].rstrip('/')


def pedir(metodo, ruta, datos=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    request = Request(BASE + ruta, data=json.dumps(datos).encode() if datos is not None else None,
                      headers=headers, method=metodo)
    try:
        with urlopen(request) as respuesta:
            cuerpo = respuesta.read()
            return respuesta.status, json.loads(cuerpo) if cuerpo else None
    except HTTPError as error:
        with error:
            return error.code, json.loads(error.read())


class PiezasHTTP(unittest.TestCase):
    def test_crud_y_permisos(self):
        tokens = []
        nombres = []
        for _ in range(2):
            nombre = 'pieza_' + uuid4().hex[:12]
            codigo, respuesta = pedir('POST', '/auth/registro', {
                'username': nombre, 'email': nombre + '@example.com', 'password': 'prueba123'
            })
            self.assertEqual(codigo, 201, respuesta)
            tokens.append(respuesta['access_token'])
            nombres.append(nombre)
        codigo, login = pedir('POST', '/auth/login', {
            'email': nombres[0] + '@example.com', 'password': 'prueba123'
        })
        self.assertEqual(codigo, 200)
        self.assertEqual(pedir('GET', '/auth/yo', token=login['access_token'])[1]['username'], nombres[0])
        self.assertEqual(pedir('POST', '/auth/login', {
            'email': nombres[0] + '@example.com', 'password': 'incorrecta'
        })[0], 401)
        png = b'\x89PNG\r\n\x1a\n' + b'prueba'
        foto = 'data:image/png;base64,' + base64.b64encode(png).decode()
        datos = {'nombre': '  Pieza real  ', 'descripcion': '  Descripción  ',
                 'categoria': 'vinilos', 'imagen_url': foto}
        self.assertEqual(pedir('POST', '/piezas', datos)[0], 401)
        for cambio, codigo in [({'nombre': ' '}, 422), ({'descripcion': 'x' * 2001}, 422),
                               ({'categoria': 'no-existe'}, 400),
                               ({'imagen_url': 'data:image/png;base64,YWJj'}, 400),
                               ({'imagen_url': 'data:image/gif;base64,YWJj'}, 400),
                               ({'imagen_url': 'data:image/png;base64,' + base64.b64encode(b'x' * (2 * 1024 * 1024 + 1)).decode()}, 400)]:
            self.assertEqual(pedir('POST', '/piezas', {**datos, **cambio}, tokens[0])[0], codigo)
        codigo, pieza = pedir('POST', '/piezas', datos, tokens[0])
        self.assertEqual(codigo, 201, pieza)
        ruta = '/piezas/' + str(pieza['id'])
        self.assertEqual((pieza['nombre'], pieza['descripcion']), ('Pieza real', 'Descripción'))
        self.assertEqual(pedir('GET', ruta)[1]['id'], pieza['id'])
        self.assertEqual(pedir('GET', '/usuarios/' + nombres[0] + '/piezas')[1]['items'][0]['id'], pieza['id'])
        with urlopen(pieza['imagen_url']) as respuesta:
            self.assertEqual(respuesta.read(), png)
        edicion = {**datos, 'nombre': 'Actualizada', 'imagen_url': pieza['imagen_url']}
        self.assertEqual(pedir('PUT', ruta, edicion)[0], 401)
        self.assertEqual(pedir('DELETE', ruta)[0], 401)
        self.assertEqual(pedir('PUT', ruta, edicion, tokens[1])[0], 403)
        self.assertEqual(pedir('DELETE', ruta, token=tokens[1])[0], 403)
        self.assertEqual(pedir('GET', ruta)[1]['nombre'], 'Pieza real')
        codigo, editada = pedir('PUT', ruta, edicion, tokens[0])
        self.assertEqual(codigo, 200, editada)
        self.assertEqual(pedir('GET', ruta)[1]['nombre'], 'Actualizada')
        with urlopen(editada['imagen_url']) as respuesta:
            self.assertEqual(respuesta.read(), png)
        self.assertEqual(pedir('DELETE', ruta, token=tokens[0]), (204, None))
        self.assertEqual(pedir('GET', ruta)[0], 404)
        self.assertEqual(pedir('PUT', ruta, edicion, tokens[0])[0], 404)
        self.assertEqual(pedir('DELETE', ruta, token=tokens[0])[0], 404)


if __name__ == '__main__':
    unittest.main()
