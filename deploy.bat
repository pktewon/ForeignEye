@echo off
REM ForeignEye 백엔드 배포 스크립트 (Windows)

echo =====================================
echo ForeignEye Backend Deployment Script
echo =====================================
echo.

REM 1. 환경 변수 확인
if not exist .env.production (
    echo Error: .env.production file not found!
    echo Please create .env.production from .env.production.example
    exit /b 1
)

echo [OK] Found .env.production

REM 2. 가상환경 활성화
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate
echo [OK] Virtual environment activated

REM 3. 의존성 설치
echo Installing dependencies...
pip install -r requirements.txt
echo [OK] Dependencies installed

REM 4. 데이터베이스 마이그레이션 (선택적)
set /p reset_db="Do you want to reset the database? (yes/no): "
if "%reset_db%"=="yes" (
    echo Resetting database...
    python reset_db.py
    echo [OK] Database reset complete
)

REM 5. ETL 파이프라인 실행 (선택적)
set /p run_etl="Do you want to run ETL pipeline? (yes/no): "
if "%run_etl%"=="yes" (
    echo Running ETL pipeline...
    python -m etl.run
    echo [OK] ETL pipeline complete
)

REM 6. Waitress 시작 (Windows용 WSGI 서버)
echo.
echo =====================================
echo Starting Waitress server...
echo =====================================
echo.

set FLASK_ENV=production
waitress-serve --port=8000 --call "app:create_app" production
