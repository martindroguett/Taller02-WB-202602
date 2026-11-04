export interface UsuarioPrivadoApi {
  id: number;
  username: string;
  email: string;
  nombre_visible: string | null;
  bio: string;
  avatar_url: string | null;
  seguidores: number;
  siguiendo: number;
  creado_en: string;
}

export interface TokenRespuestaApi {
  access_token: string;
  token_type: 'bearer';
  usuario: UsuarioPrivadoApi;
}

export interface DatosRegistroApi {
  username: string;
  email: string;
  password: string;
}

export type DatosLoginApi = Pick<DatosRegistroApi, 'email' | 'password'>;
