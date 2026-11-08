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

    def test_respuestas_y_megusta(self):
        dueno, token_dueno = registrar()
        autor, token_autor = registrar()
        codigo, pieza = pedir('POST', '/piezas', {
            'nombre': 'Pieza', 'descripcion': 'Descripción', 'categoria': 'cartas',
            'imagen_url': '/fotos/carta-beisbol.jpg',
        }, token_dueno)
        self.assertEqual(codigo, 201, pieza)
        ruta = f"/piezas/{pieza['id']}/comentarios"
        raiz = pedir('POST', ruta, {'texto': 'Original'}, token_autor)[1]
        self.assertIsNone(raiz['padre_id'])

        # Una respuesta cuelga del original; responder a una respuesta cuelga del mismo original.
        respuesta = pedir('POST', ruta, {'texto': 'Respuesta', 'padre_id': raiz['id']}, token_dueno)[1]
        segunda = pedir('POST', ruta, {'texto': 'Otra', 'padre_id': respuesta['id']}, token_autor)[1]
        self.assertEqual((respuesta['padre_id'], segunda['padre_id']), (raiz['id'], raiz['id']))
        self.assertEqual(pedir('POST', ruta, {'texto': 'x', 'padre_id': 0}, token_autor)[0], 404)
        otra = pedir('POST', '/piezas', {
            'nombre': 'Otra', 'descripcion': 'Descripción', 'categoria': 'cartas',
            'imagen_url': '/fotos/carta-beisbol.jpg',
        }, token_dueno)[1]
        self.assertEqual(
            pedir('POST', f"/piezas/{otra['id']}/comentarios", {'texto': 'x', 'padre_id': raiz['id']}, token_autor)[0], 400)

        # Me gusta: idempotente, con total y estado de quien pregunta.
        me_gusta = f"/comentarios/{raiz['id']}/megusta"
        self.assertEqual(pedir('POST', me_gusta)[0], 401)
        self.assertEqual(pedir('POST', me_gusta, token=token_dueno)[1], {'gustado': True, 'megusta': 1})
        self.assertEqual(pedir('POST', me_gusta, token=token_dueno)[1], {'gustado': True, 'megusta': 1})
        self.assertEqual(pedir('POST', me_gusta, token=token_autor)[1], {'gustado': True, 'megusta': 2})
        self.assertEqual(pedir('POST', '/comentarios/0/megusta', token=token_autor)[0], 404)
        primero = pedir('GET', ruta, token=token_dueno)[1]['items'][0]
        self.assertEqual((primero['megusta'], primero['gustado']), (2, True))
        self.assertFalse(pedir('GET', ruta)[1]['items'][0]['gustado'])
        self.assertEqual(pedir('DELETE', me_gusta, token=token_dueno)[1], {'gustado': False, 'megusta': 1})
        self.assertEqual(pedir('DELETE', me_gusta, token=token_dueno)[1], {'gustado': False, 'megusta': 1})

        # Borrar el original borra sus respuestas.
        self.assertEqual(pedir('DELETE', f"/comentarios/{raiz['id']}", token=token_autor), (204, None))
        self.assertEqual(pedir('GET', ruta)[1]['total'], 0)
        self.assertEqual(pedir('DELETE', f"/piezas/{pieza['id']}", token=token_dueno), (204, None))
        self.assertEqual(pedir('DELETE', f"/piezas/{otra['id']}", token=token_dueno), (204, None))


if __name__ == '__main__':
    unittest.main()
