"""Use only with a disposable migrated database: TEST_API_URL=http://localhost:8000/api python3 backend/tests/test_comentarios_http.py."""
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


def registrar():
    nombre = 'coment_' + uuid4().hex[:12]
    codigo, respuesta = pedir('POST', '/auth/registro', {
        'username': nombre, 'email': nombre + '@example.com', 'password': 'prueba123'
    })
    assert codigo == 201, respuesta
    return nombre, respuesta['access_token']


class ComentariosHTTP(unittest.TestCase):
    def test_comentar_listar_y_eliminar(self):
        dueno, token_dueno = registrar()
        autor, token_autor = registrar()
        _, token_otro = registrar()
        codigo, pieza = pedir('POST', '/piezas', {
            'nombre': 'Pieza', 'descripcion': 'Descripción', 'categoria': 'vinilos',
            'imagen_url': '/fotos/vinilo-negro.jpg',
        }, token_dueno)
        self.assertEqual(codigo, 201, pieza)
        ruta = f"/piezas/{pieza['id']}/comentarios"

        self.assertEqual(pedir('GET', ruta)[1]['total'], 0)
        self.assertEqual(pedir('POST', ruta, {'texto': 'Hola'})[0], 401)
        for texto in ['', '   ', 'x' * 301]:
            self.assertEqual(pedir('POST', ruta, {'texto': texto}, token_autor)[0], 422)
        self.assertEqual(pedir('POST', '/piezas/0/comentarios', {'texto': 'Hola'}, token_autor)[0], 404)

        codigo, primero = pedir('POST', ruta, {'texto': '  Muy linda  '}, token_autor)
        self.assertEqual(codigo, 201, primero)
        self.assertEqual((primero['texto'], primero['autor']['username']), ('Muy linda', autor))
        segundo = pedir('POST', ruta, {'texto': 'Gracias'}, token_dueno)[1]

        pagina = pedir('GET', ruta)[1]
        self.assertEqual([c['id'] for c in pagina['items']], [primero['id'], segundo['id']])
        self.assertEqual(pagina['total'], 2)
        self.assertEqual(pedir('GET', ruta + '?limite=1&desplazamiento=1')[1]['items'][0]['id'], segundo['id'])

        borrar = f"/comentarios/{primero['id']}"
        self.assertEqual(pedir('DELETE', borrar)[0], 401)
        self.assertEqual(pedir('DELETE', borrar, token=token_otro)[0], 403)
        self.assertEqual(pedir('DELETE', borrar, token=token_autor), (204, None))
        self.assertEqual(pedir('DELETE', borrar, token=token_autor)[0], 404)
        # El dueño de la pieza puede quitar comentarios de otras personas.
        otro = pedir('POST', ruta, {'texto': 'Spam'}, token_autor)[1]
        self.assertEqual(pedir('DELETE', f"/comentarios/{otro['id']}", token=token_dueno), (204, None))
        self.assertEqual(pedir('GET', ruta)[1]['total'], 1)

        self.assertEqual(pedir('DELETE', f"/piezas/{pieza['id']}", token=token_dueno), (204, None))
        self.assertEqual(pedir('GET', ruta)[0], 404)


if __name__ == '__main__':
    unittest.main()
