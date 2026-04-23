from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Required for signing JWTs (use a long random string in production, e.g. openssl rand -hex 32)
    jwt_secret: str = "dev-only-change-me-use-openssl-rand-hex-32-in-production"
    jwt_expire_hours: int = 168  # 7 days


settings = Settings()
