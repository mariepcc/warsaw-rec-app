import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta
from config.settings import get_settings

security = HTTPBearer()
settings = get_settings()

COGNITO_REGION = settings.cognito.cognito_region
COGNITO_USER_POOL_ID = settings.cognito.cognito_user_pool_id
COGNITO_APP_CLIENT_ID = settings.cognito.cognito_app_client_id
COGNITO_JWKS_URL = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com"
    f"/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
)

_jwks_cache = {"data": None, "fetched_at": None}
JWKS_TTL = timedelta(hours=1)


def get_jwks():
    now = datetime.utcnow()
    if _jwks_cache["data"] is None or now - _jwks_cache["fetched_at"] > JWKS_TTL:
        response = httpx.get(COGNITO_JWKS_URL, timeout=5.0)
        response.raise_for_status()
        _jwks_cache["data"] = response.json()
        _jwks_cache["fetched_at"] = now
    return _jwks_cache["data"]


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    if credentials.scheme != "Bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials

    unauthorized_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        jwks = get_jwks()
        header = jwt.get_unverified_header(token)

        if header.get("alg", "").lower() == "none":
            raise unauthorized_exception

        key = next(
            (k for k in jwks["keys"] if k["kid"] == header.get("kid")),
            None,
        )
        if not key:
            raise unauthorized_exception

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=COGNITO_APP_CLIENT_ID,
        )
        return {
            "user_id": payload["sub"],
            "email": payload.get("email") or payload.get("cognito:username", ""),
        }

    except HTTPException:
        raise
    except JWTError:
        raise unauthorized_exception
    except Exception:
        raise unauthorized_exception
