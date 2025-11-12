# 🚀 ForeignEye 배포 체크리스트

배포 전 이 체크리스트의 모든 항목을 확인하세요.

---

## ⚙️ 1. 환경 설정

### 프로덕션 환경 변수 생성
- [ ] `.env.production.example`을 `.env.production`으로 복사
- [ ] `SECRET_KEY` 생성 및 설정
  ```bash
  python -c 'import secrets; print(secrets.token_hex(32))'
  ```
- [ ] `JWT_SECRET_KEY` 생성 및 설정 (SECRET_KEY와 다른 값)
  ```bash
  python -c 'import secrets; print(secrets.token_hex(32))'
  ```
- [ ] `DB_PASSWORD` 강력한 비밀번호로 변경 (최소 16자)
- [ ] `CORS_ORIGINS` 실제 프론트엔드 도메인으로 설정
- [ ] `GNEWS_API_KEY` 및 `OPENROUTER_API_KEY` 확인

### 설정 파일 검증
- [ ] `FLASK_ENV=production` 설정 확인
- [ ] `FLASK_DEBUG=False` 설정 확인
- [ ] `.env.production` 파일이 `.gitignore`에 추가되었는지 확인

---

## 📦 2. 의존성 및 서버

### 패키지 설치
- [ ] `pip install -r requirements.txt` 실행
- [ ] `gunicorn` 설치 확인
  ```bash
  gunicorn --version
  ```
- [ ] Python 버전 확인 (Python 3.8 이상 권장)
  ```bash
  python --version
  ```

### 프로덕션 서버 설정
- [ ] Gunicorn 설정 확인 (워커 수, 타임아웃 등)
- [ ] Nginx 리버스 프록시 설정 (옵션)
- [ ] HTTPS 인증서 설치 (Let's Encrypt 권장)

---

## 🗄️ 3. 데이터베이스

### 데이터베이스 준비
- [ ] 프로덕션 MySQL 서버 설치 및 실행
- [ ] 데이터베이스 생성 (`foreigneye_prod_db`)
- [ ] 데이터베이스 사용자 생성 및 권한 부여
  ```sql
  CREATE DATABASE foreigneye_prod_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'foreigneye_prod_user'@'localhost' IDENTIFIED BY 'strong_password';
  GRANT ALL PRIVILEGES ON foreigneye_prod_db.* TO 'foreigneye_prod_user'@'localhost';
  FLUSH PRIVILEGES;
  ```
- [ ] 연결 테스트
  ```bash
  mysql -u foreigneye_prod_user -p -h localhost foreigneye_prod_db
  ```

### 데이터베이스 마이그레이션
- [ ] `python reset_db.py` 실행 (초기 설정)
- [ ] 테이블 생성 확인
  ```sql
  SHOW TABLES;
  ```

---

## 🔒 4. 보안

### 환경 변수 보안
- [ ] `.env.production` 파일 권한 설정 (600)
  ```bash
  chmod 600 .env.production
  ```
- [ ] 비밀 키를 환경 변수 관리 서비스로 이전 (옵션)
  - AWS Secrets Manager
  - Azure Key Vault
  - HashiCorp Vault

### 네트워크 보안
- [ ] 방화벽 규칙 설정 (필요한 포트만 개방)
- [ ] SSH 키 기반 인증 설정
- [ ] 불필요한 서비스 비활성화

### CORS 설정
- [ ] 프로덕션 도메인으로 CORS 제한 확인
- [ ] Preflight 요청 테스트

---

## 🧪 5. 테스트

### 로컬 테스트
- [ ] `test_api.sh` 스크립트 실행 (Linux/Mac)
  ```bash
  chmod +x test_api.sh
  ./test_api.sh
  ```
- [ ] 모든 핵심 API 엔드포인트 테스트
  - [ ] 로그인 (POST /auth/login)
  - [ ] 기사 목록 (GET /articles)
  - [ ] 기사 상세 (GET /articles/{id})
  - [ ] 개념 수집 (POST /collections/concepts)
  - [ ] 개념 검색 (GET /search/articles_by_concept)
  - [ ] 지식 맵 (GET /knowledge-map)

### 프로덕션 환경 테스트
- [ ] 프로덕션 URL로 기본 헬스체크
- [ ] 인증 토큰 발급 및 검증
- [ ] 에러 핸들링 테스트 (404, 401, 500)

---

## 📊 6. ETL 파이프라인

### 초기 데이터 로딩
- [ ] GNews API 키 유효성 확인
- [ ] OpenRouter API 키 유효성 확인
- [ ] `python -m etl.run` 실행
- [ ] 기사 및 개념 데이터 확인
  ```sql
  SELECT COUNT(*) FROM Article;
  SELECT COUNT(*) FROM Concept;
  ```

### 스케줄링 설정 (옵션)
- [ ] Cron Job 설정 (Linux)
  ```bash
  crontab -e
  # 매일 오전 6시에 ETL 실행
  0 6 * * * cd /path/to/ForeignEye && /path/to/venv/bin/python -m etl.run >> logs/etl_cron.log 2>&1
  ```
- [ ] Windows Task Scheduler 설정 (Windows)

---

## 🚀 7. 배포

### 배포 스크립트 실행
- [ ] Linux/Mac: `./deploy.sh` 실행
- [ ] Windows: `deploy.bat` 실행
- [ ] 서버 시작 확인
  ```bash
  curl http://localhost:8000/api/v1/articles
  ```

### 프로세스 관리 (옵션)
- [ ] Systemd 서비스 파일 생성 (Linux)
  ```bash
  sudo nano /etc/systemd/system/foreigneye.service
  ```
- [ ] 서비스 등록 및 시작
  ```bash
  sudo systemctl enable foreigneye
  sudo systemctl start foreigneye
  sudo systemctl status foreigneye
  ```

---

## 📈 8. 모니터링

### 로깅
- [ ] 로그 디렉토리 확인 (`logs/`)
- [ ] 로그 파일 권한 설정
- [ ] 로그 로테이션 설정 (logrotate)

### 서버 모니터링
- [ ] CPU 사용률 모니터링
- [ ] 메모리 사용률 모니터링
- [ ] 디스크 사용률 모니터링
- [ ] 네트워크 트래픽 모니터링

### 애플리케이션 모니터링 (옵션)
- [ ] Sentry 연동 (에러 추적)
- [ ] Datadog 연동 (성능 모니터링)
- [ ] Prometheus + Grafana (메트릭 시각화)

---

## 🔄 9. 백업 및 복구

### 백업 설정
- [ ] 데이터베이스 자동 백업 스크립트 작성
  ```bash
  mysqldump -u user -p foreigneye_prod_db > backup_$(date +%Y%m%d).sql
  ```
- [ ] Cron Job으로 일일 백업 스케줄링
- [ ] 백업 파일 원격 저장소 업로드 (AWS S3, Google Cloud Storage 등)

### 복구 테스트
- [ ] 백업 파일로 복구 테스트 수행
- [ ] 복구 절차 문서화

---

## 📝 10. 문서화

### 운영 문서 작성
- [ ] API 문서 최신화
- [ ] 배포 절차 문서 작성
- [ ] 트러블슈팅 가이드 작성
- [ ] 긴급 연락처 및 에스컬레이션 절차 문서화

### 팀 공유
- [ ] 배포 일정 공지
- [ ] 운영 권한 이관
- [ ] 교육 및 인수인계

---

## ✅ 최종 확인

배포 전 마지막 확인:
- [ ] 모든 환경 변수가 올바르게 설정되었는가?
- [ ] 데이터베이스 연결이 정상적으로 작동하는가?
- [ ] API 테스트가 모두 통과했는가?
- [ ] HTTPS가 정상적으로 작동하는가?
- [ ] 로그가 정상적으로 기록되는가?
- [ ] 백업 시스템이 작동하는가?

**모든 항목을 확인했다면 배포 준비 완료입니다! 🎉**

---

## 🚨 배포 후 모니터링 (첫 24시간)

- [ ] 서버 응답 시간 모니터링
- [ ] 에러 로그 확인
- [ ] 데이터베이스 연결 풀 상태 확인
- [ ] 메모리 누수 체크
- [ ] API 호출 빈도 확인

---

**작성일**: 2025-11-12  
**작성자**: ForeignEye DevOps Team
