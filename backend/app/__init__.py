"""
Flask 애플리케이션 팩토리

create_app() 함수를 통해 Flask 앱을 생성하고 초기화합니다.
환경별(development/production/testing) 설정을 지원합니다.
"""

import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask
from flask_cors import CORS

from app.config import get_config
from app.extensions import db, jwt, limiter


def create_app(config_name=None):
    """
    Flask 애플리케이션 팩토리
    
    Args:
        config_name (str): 설정 환경 ('development', 'production', 'testing')
                          None이면 FLASK_ENV 환경 변수 사용
    
    Returns:
        Flask: 초기화된 Flask 앱
    """
    # Flask 앱 생성
    app = Flask(__name__)
    
    # 설정 로드
    config_class = get_config(config_name)
    app.config.from_object(config_class)
    
    # 확장 초기화
    initialize_extensions(app)
    
    # CORS 설정
    setup_cors(app)
    
    # 블루프린트 등록
    register_blueprints(app)
    
    # 헬스체크 엔드포인트 등록 (Cloud Run 용)
    register_health_check(app)
    
    # 에러 핸들러 등록
    register_error_handlers(app)
    
    # 로깅 설정
    setup_logging(app)
    
    # CLI 명령 등록
    register_cli_commands(app)
    
    # 앱 시작 로그
    app.logger.info(f'TechExplained 앱 시작 (환경: {config_name or "development"})')
    
    return app


def initialize_extensions(app):
    """Flask 확장 초기화"""
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    
    # 앱 컨텍스트에서 테이블 생성
    with app.app_context():
        db.create_all()


def setup_cors(app):
    """CORS 설정"""
    CORS(
        app,
        origins=app.config.get('CORS_ORIGINS', []),
        supports_credentials=True,
        allow_headers=['Content-Type', 'Authorization'],
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        expose_headers=['Authorization']
    )


def register_blueprints(app):
    """블루프린트 등록"""
    # 라우트 임포트 (순환 import 방지를 위해 여기서 import)
    from app.routes import auth, articles, concepts, collections, knowledge_map, search
    
    # API 버전 접두사
    api_prefix = '/api/v1'
    
    # 블루프린트 등록
    app.register_blueprint(auth.bp, url_prefix=f'{api_prefix}/auth')
    app.register_blueprint(articles.bp, url_prefix=f'{api_prefix}/articles')
    app.register_blueprint(concepts.bp, url_prefix=f'{api_prefix}/concepts')
    app.register_blueprint(collections.bp, url_prefix=f'{api_prefix}/collections')
    app.register_blueprint(knowledge_map.bp, url_prefix=f'{api_prefix}/knowledge-map')
    app.register_blueprint(search.bp, url_prefix=f'{api_prefix}/search')
    
    app.logger.info('블루프린트 등록 완료')


def register_health_check(app):
    """헬스체크 엔드포인트 등록 (Cloud Run 용)"""
    from flask import jsonify
    from datetime import datetime
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """
        헬스체크 엔드포인트
        
        Cloud Run이 서비스 상태를 확인하는 데 사용
        GET /health
        """
        return jsonify({
            'status': 'healthy',
            'service': 'foreigneye-backend',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 200
    
    @app.route('/', methods=['GET'])
    def root():
        """
        루트 엔드포인트
        
        API 정보 제공
        GET /
        """
        return jsonify({
            'service': 'ForeignEye Backend API',
            'version': 'v1',
            'status': 'running',
            'endpoints': {
                'health': '/health',
                'api': '/api/v1',
                'docs': 'See README.md for API documentation'
            }
        }), 200
    
    app.logger.info('헬스체크 엔드포인트 등록 완료')


def register_error_handlers(app):
    """전역 에러 핸들러 등록"""
    from app.utils.exceptions import APIException
    from app.utils.response import error_response
    
    @app.errorhandler(APIException)
    def handle_api_exception(e):
        """커스텀 API 예외 처리"""
        return error_response(
            code=e.code,
            message=e.message,
            status=e.status_code,
            details=e.details
        )
    
    @app.errorhandler(404)
    def handle_not_found(e):
        """404 Not Found"""
        return error_response(
            code='NOT_FOUND',
            message='요청한 리소스를 찾을 수 없습니다.',
            status=404
        )
    
    @app.errorhandler(405)
    def handle_method_not_allowed(e):
        """405 Method Not Allowed"""
        return error_response(
            code='METHOD_NOT_ALLOWED',
            message='허용되지 않은 HTTP 메서드입니다.',
            status=405
        )
    
    @app.errorhandler(429)
    def handle_rate_limit(e):
        """429 Rate Limit Exceeded"""
        return error_response(
            code='RATE_LIMIT_EXCEEDED',
            message='요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
            status=429
        )
    
    @app.errorhandler(500)
    def handle_internal_error(e):
        """500 Internal Server Error"""
        app.logger.error(f'Internal error: {e}', exc_info=True)
        return error_response(
            code='INTERNAL_ERROR',
            message='서버 내부 오류가 발생했습니다.',
            status=500
        )
    
    app.logger.info('에러 핸들러 등록 완료')


def setup_logging(app):
    """로깅 설정"""
    if not app.debug and not app.testing:
        # 로그 디렉토리 생성
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        # 파일 핸들러 생성
        file_handler = RotatingFileHandler(
            app.config.get('LOG_FILE', 'logs/techexplained.log'),
            maxBytes=app.config.get('LOG_MAX_BYTES', 10485760),
            backupCount=app.config.get('LOG_BACKUP_COUNT', 10)
        )
        
        # 로그 포맷 설정
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        
        # 로그 레벨 설정
        log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO'))
        file_handler.setLevel(log_level)
        
        # 핸들러 추가
        app.logger.addHandler(file_handler)
        app.logger.setLevel(log_level)
        
        app.logger.info('로깅 설정 완료')


def register_cli_commands(app):
    """CLI 명령 등록"""
    
    @app.cli.command('init-db')
    def init_db():
        """데이터베이스 초기화"""
        with app.app_context():
            db.create_all()
            print('✓ 데이터베이스 테이블이 생성되었습니다.')
    
    @app.cli.command('drop-db')
    def drop_db():
        """데이터베이스 삭제 (주의!)"""
        with app.app_context():
            if input('정말 모든 테이블을 삭제하시겠습니까? (yes/no): ') == 'yes':
                db.drop_all()
                print('✓ 모든 테이블이 삭제되었습니다.')
            else:
                print('취소되었습니다.')
    
    @app.cli.command('create-admin')
    def create_admin():
        """관리자 계정 생성"""
        from app.models.user import User
        
        username = input('관리자 사용자명: ')
        email = input('이메일: ')
        password = input('비밀번호: ')
        
        with app.app_context():
            # 중복 확인
            if User.query.filter_by(username=username).first():
                print('✗ 이미 존재하는 사용자명입니다.')
                return
            
            # 관리자 생성
            admin = User(username=username, email=email)
            admin.set_password(password)
            db.session.add(admin)
            db.session.commit()
            
            print(f'✓ 관리자 계정이 생성되었습니다: {username}')
    
    app.logger.info('CLI 명령 등록 완료')

