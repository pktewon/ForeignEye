"""
Flask 확장 초기화 모듈

모든 Flask 확장(SQLAlchemy, JWT 등)을 앱 컨텍스트 외부에서 생성하고,
앱 팩토리에서 init_app()으로 초기화합니다.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# 확장 객체 생성 (앱 컨텍스트 외부)
db = SQLAlchemy()
jwt = JWTManager()
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="memory://"
)

