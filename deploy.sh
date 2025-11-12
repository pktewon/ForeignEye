#!/bin/bash
# ForeignEye 백엔드 배포 스크립트 (Linux/Unix)

set -e  # 에러 발생 시 스크립트 중단

echo "====================================="
echo "ForeignEye Backend Deployment Script"
echo "====================================="
echo ""

# 1. 환경 변수 확인
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

echo "✓ Found .env.production"

# 2. 가상환경 활성화
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "✓ Virtual environment activated"

# 3. 의존성 설치
echo "Installing dependencies..."
pip install -r requirements.txt
echo "✓ Dependencies installed"

# 4. 데이터베이스 마이그레이션 (선택적)
read -p "Do you want to reset the database? (yes/no): " reset_db
if [ "$reset_db" = "yes" ]; then
    echo "Resetting database..."
    python reset_db.py
    echo "✓ Database reset complete"
fi

# 5. ETL 파이프라인 실행 (선택적)
read -p "Do you want to run ETL pipeline? (yes/no): " run_etl
if [ "$run_etl" = "yes" ]; then
    echo "Running ETL pipeline..."
    python -m etl.run
    echo "✓ ETL pipeline complete"
fi

# 6. Gunicorn 시작
echo ""
echo "====================================="
echo "Starting Gunicorn server..."
echo "====================================="
echo ""

# 환경 변수 로드
export $(cat .env.production | xargs)

# Gunicorn 실행
gunicorn -w 4 \
  -b 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile logs/access.log \
  --error-logfile logs/error.log \
  "app:create_app('production')"
