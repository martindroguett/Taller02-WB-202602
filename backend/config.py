from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Configuracion(BaseSettings):
    """Lee la configuración desde las variables de entorno o desde el .env de la raíz del repo."""

    # "../.env" sirve al ejecutar desde backend/; en Docker las variables llegan por env_file.
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    # Si existe (por ejemplo, la conexión de Neon), reemplaza a las variables POSTGRES_*.
    database_url: str | None = None

    jwt_secret: str
    jwt_algoritmo: str = "HS256"
    jwt_expira_minutos: int = 60 * 24

    cors_origenes: list[str] = ["http://localhost:4200"]

    @property
    def url_base_datos(self) -> str | URL:
        if self.database_url:
            return self.database_url
        # URL.create escapa la contraseña aunque tenga caracteres como @ o /.
        return URL.create(
            "postgresql+psycopg",
            username=self.postgres_user,
            password=self.postgres_password,
            host=self.postgres_host,
            port=self.postgres_port,
            database=self.postgres_db,
        )


configuracion = Configuracion()
