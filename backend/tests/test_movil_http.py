"""Funciones móviles (Taller 3): código escaneado, ubicación, piezas cercanas y pieza al azar.

Use only with a disposable migrated database: TEST_API_URL=http://localhost:8000/api python3 backend/tests/test_movil_http.py
"""
import base64
import unittest
from uuid import uuid4

from test_piezas_http import pedir

FOTO = 'data:image/png;base64,' + base64.b64encode(b'\x89PNG\r\n\x1a\n' + b'prueba').decode()


class MovilHTTP(unittest.TestCase):
    def setUp(self):
        nombre = 'movil_' + uuid4().hex[:12]
        codigo, respuesta = pedir('POST', '/auth/registro', {
            'username': nombre, 'email': nombre + '@example.com', 'password': 'prueba123'
        })
        self.assertEqual(codigo, 201, respuesta)
        self.token = respuesta['access_token']
        self.codigo = 'EAN-' + uuid4().hex[:10]

    def crear(self, **extra):
        datos = {'nombre': 'Pieza móvil', 'descripcion': 'Desde el celular',
                 'categoria': 'videojuegos', 'imagen_url': FOTO, **extra}
        return pedir('POST', '/piezas', datos, self.token)

    def test_codigo_y_ubicacion(self):
        # Antofagasta y Santiago, a unos 1.100 km.
        codigo, cerca = self.crear(codigo=self.codigo, latitud=-23.65, longitud=-70.40)
        self.assertEqual(codigo, 201, cerca)
        self.assertEqual((cerca['codigo'], cerca['latitud'], cerca['longitud']), (self.codigo, -23.65, -70.40))
        codigo, lejos = self.crear(latitud=-33.45, longitud=-70.66)
        self.assertEqual(codigo, 201, lejos)

        # Validaciones: latitud sin longitud y coordenadas fuera de rango.
        self.assertEqual(self.crear(latitud=-23.6)[0], 422)
        self.assertEqual(self.crear(latitud=-91, longitud=0)[0], 422)

        # Buscar por el código escaneado.
        codigo, pagina = pedir('GET', '/piezas?codigo=' + self.codigo)
        self.assertEqual(codigo, 200)
        self.assertEqual([p['id'] for p in pagina['items']], [cerca['id']])

        # Cercanas: solo la que está dentro del radio, con la distancia calculada.
        codigo, pagina = pedir('GET', '/piezas?orden=cercanas&lat=-23.66&lng=-70.40&radio_km=20&limite=50')
        self.assertEqual(codigo, 200, pagina)
        ids = [p['id'] for p in pagina['items']]
        self.assertIn(cerca['id'], ids)
        self.assertNotIn(lejos['id'], ids)
        item = next(p for p in pagina['items'] if p['id'] == cerca['id'])
        self.assertAlmostEqual(item['distancia_km'], 1.11, delta=0.05)
        self.assertEqual(pedir('GET', '/piezas?orden=cercanas')[0], 400)

        # Editar conserva o quita los datos móviles.
        ruta = '/piezas/' + str(cerca['id'])
        edicion = {'nombre': 'Editada', 'descripcion': 'x', 'categoria': 'videojuegos',
                   'imagen_url': cerca['imagen_url']}
        codigo, editada = pedir('PUT', ruta, edicion, self.token)
        self.assertEqual(codigo, 200, editada)
        self.assertEqual((editada['codigo'], editada['latitud']), (None, None))

    def test_aleatoria(self):
        codigo, pieza = self.crear()
        self.assertEqual(codigo, 201)
        codigo, azar = pedir('GET', '/piezas/aleatoria')
        self.assertEqual(codigo, 200, azar)
        self.assertIn('id', azar)
        codigo, otra = pedir('GET', '/piezas/aleatoria?excluir=' + str(azar['id']))
        if codigo == 200:
            self.assertNotEqual(otra['id'], azar['id'])


if __name__ == '__main__':
    unittest.main()
