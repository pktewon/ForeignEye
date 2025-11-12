"""
TechExplained Application Runner

Flask 개발 서버를 실행하는 엔트리포인트입니다.

사용법:
    python run.py
    
환경 변수:
    FLASK_ENV: 'development', 'production', 'testing' (기본값: development)
    FLASK_DEBUG: 'True' 또는 'False' (기본값: True)
    FLASK_HOST: 호스트 주소 (기본값: 127.0.0.1)
    FLASK_PORT: 포트 번호 (기본값: 5000)
"""

import os
from app import create_app

# 환경 설정
config_name = os.getenv('FLASK_ENV', 'development')
debug = os.getenv('FLASK_DEBUG', 'True') == 'True'

# Cloud Run 호환: PORT 환경 변수 우선 사용
port = int(os.getenv('PORT', os.getenv('FLASK_PORT', 5000)))

# Cloud Run에서는 0.0.0.0으로 바인딩 필수
if config_name == 'production':
    host = '0.0.0.0'
else:
    host = os.getenv('FLASK_HOST', '127.0.0.1')

# Flask 앱 생성
app = create_app(config_name)

if __name__ == '__main__':
    print('=' * 70)
    print('🚀 ForeignEye Backend Server')
    print('=' * 70)
    print(f'환경: {config_name}')
    print(f'디버그: {debug}')
    print(f'주소: http://{host}:{port}')
    print('=' * 70)
    
    # 프로덕션 경고 메시지
    if config_name == 'production' and debug:
        print('⚠️  경고: 프로덕션 환경에서 DEBUG=True로 설정되어 있습니다!')
        print('=' * 70)
    print()
    
    # 개발 서버 실행 (프로덕션에서는 Gunicorn 사용 권장)
    app.run(
        debug=debug,
        host=host,
        port=port,
        use_reloader=debug,
        reloader_type='stat' if debug else None
    )

