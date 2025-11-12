# ☁️ ForeignEye Backend - Google Cloud Run 마이그레이션 완료 보고서

## 📅 작업 일자
2025-11-12

## 🎯 작업 목표
기존 로컬호스트 기반 백엔드를 Google Cloud Run에 배포하기 위한 설정 변경

---

## ✅ 완료된 작업

### 1. **Dockerfile 최적화** ✓
**파일**: `Dockerfile`

**변경 사항**:
- Cloud Run의 동적 `PORT` 환경 변수 지원
- 비root 사용자로 실행 (보안 강화)
- Python 환경 변수 최적화
- MySQL 클라이언트 라이브러리 설치
- Gunicorn 설정: 2 workers, 4 threads, 120초 timeout

**주요 개선점**:
```dockerfile
# Cloud Run PORT 환경 변수 사용
CMD exec gunicorn --bind :$PORT --workers 2 --threads 4 --timeout 120 run:app
```

### 2. **환경 변수 설정 업데이트** ✓
**파일**: `.env.production.example`

**변경 사항**:
- Google Cloud SQL Unix Socket 연결 설정
- Cloud Run PORT 자동 할당 지원
- CORS_ORIGINS를 실제 Cloud Run URL로 변경 가능하도록 템플릿화
- Secret Manager 사용 권장 사항 추가

**주요 설정**:
```env
# Cloud SQL Unix Socket (권장)
DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME

# Cloud Run이 자동으로 PORT 할당
# PORT 환경 변수 설정 불필요

# CORS 설정
CORS_ORIGINS=https://your-frontend-domain.run.app
```

### 3. **run.py 수정** ✓
**파일**: `run.py`

**변경 사항**:
- Cloud Run `PORT` 환경 변수 우선 사용
- 프로덕션 환경에서 `0.0.0.0` 바인딩 강제
- 프로덕션 디버그 모드 경고 추가

**핵심 로직**:
```python
# Cloud Run 호환: PORT 환경 변수 우선 사용
port = int(os.getenv('PORT', os.getenv('FLASK_PORT', 5000)))

# Cloud Run에서는 0.0.0.0으로 바인딩 필수
if config_name == 'production':
    host = '0.0.0.0'
```

### 4. **Health Check 엔드포인트 추가** ✓
**파일**: `app/__init__.py`

**변경 사항**:
- `/health` 엔드포인트 추가 (Cloud Run 헬스체크용)
- `/` 루트 엔드포인트 추가 (API 정보 제공)

**엔드포인트**:
```
GET /health       → 서비스 상태 확인
GET /             → API 정보 및 버전
GET /api/v1/*     → 기존 API 엔드포인트
```

### 5. **배포 자동화 설정** ✓
**파일**: `cloudbuild.yaml`, `.gcloudignore`

**생성된 파일**:
- `cloudbuild.yaml`: Cloud Build 자동 배포 설정
- `.gcloudignore`: 빌드 시 제외할 파일 목록

**자동 배포 흐름**:
1. GitHub main 브랜치 푸시 감지
2. Docker 이미지 빌드
3. Container Registry에 푸시
4. Cloud Run에 자동 배포
5. Cloud SQL 연결 및 Secret Manager 통합

### 6. **배포 가이드 작성** ✓
**파일**: `CLOUD_RUN_DEPLOYMENT.md`

**포함된 내용**:
- 사전 준비 (Google Cloud CLI, API 활성화)
- Google Cloud SQL 설정
- Secret Manager 설정
- 수동 배포 절차
- 자동 배포 (Cloud Build) 설정
- 배포 후 확인 및 테스트
- 문제 해결 가이드
- 성능 및 비용 최적화

---

## 🔄 변경된 localhost 참조

### Before (로컬 개발 환경)
```python
# app/config.py
DB_HOST = 'localhost'
FLASK_HOST = '127.0.0.1'
FLASK_PORT = 5000
```

### After (Cloud Run 환경)
```python
# 환경 변수로 모두 주입
DB_HOST = os.getenv('DB_HOST', '/cloudsql/PROJECT:REGION:INSTANCE')
PORT = os.getenv('PORT')  # Cloud Run이 자동 할당
host = '0.0.0.0'  # 프로덕션에서 강제
```

### 변경 요약
| 항목 | 로컬 | Cloud Run |
|------|------|-----------|
| DB 연결 | `localhost:3306` | `/cloudsql/...` (Unix Socket) |
| 서버 바인딩 | `127.0.0.1:5000` | `0.0.0.0:$PORT` (동적) |
| CORS | `*` (개발) | 실제 프론트엔드 도메인 |
| 환경 변수 | `.env` 파일 | Secret Manager + 환경 변수 |

---

## 📂 생성/수정된 파일 목록

### 새로 생성된 파일
```
backend/
├── .gcloudignore                      # Cloud Build 제외 파일
├── cloudbuild.yaml                    # 자동 배포 설정
├── CLOUD_RUN_DEPLOYMENT.md            # 배포 가이드
└── CLOUD_RUN_MIGRATION_SUMMARY.md     # 이 문서
```

### 수정된 파일
```
backend/
├── Dockerfile                         # Cloud Run 최적화
├── .env.production.example            # Cloud SQL 연결 설정
├── run.py                             # PORT 환경 변수 지원
└── app/__init__.py                    # Health Check 추가
```

---

## 🚀 배포 절차 요약

### 1단계: Google Cloud 리소스 생성
```bash
# Cloud SQL 인스턴스 생성
gcloud sql instances create foreigneye-db --database-version=MYSQL_8_0

# Secret Manager에 시크릿 저장
gcloud secrets create foreigneye-secret-key --data-file=...
gcloud secrets create foreigneye-jwt-key --data-file=...
gcloud secrets create foreigneye-db-password --data-file=...
```

### 2단계: 환경 변수 설정
```bash
# .env.prod 파일 생성 및 설정
cp .env.production.example .env.prod
nano .env.prod  # 실제 값으로 수정
```

### 3단계: 배포
```bash
# 수동 배포
docker build -t gcr.io/PROJECT_ID/foreigneye-backend .
docker push gcr.io/PROJECT_ID/foreigneye-backend
gcloud run deploy foreigneye-backend --image=...

# 또는 자동 배포 (GitHub 푸시)
git push origin main  # Cloud Build 트리거 자동 실행
```

### 4단계: 배포 확인
```bash
# 헬스 체크
curl https://foreigneye-backend-xxx.run.app/health

# API 테스트
curl https://foreigneye-backend-xxx.run.app/api/v1/articles
```

---

## 🔒 보안 강화 사항

### 1. Secret Manager 사용
민감한 정보를 환경 변수 파일 대신 Secret Manager에 저장:
- SECRET_KEY
- JWT_SECRET_KEY
- DB_PASSWORD
- GNEWS_API_KEY
- OPENROUTER_API_KEY

### 2. Cloud SQL Unix Socket 연결
Public IP 대신 Unix Socket 사용:
- 네트워크 노출 최소화
- Cloud Run과 Cloud SQL 간 안전한 연결

### 3. 비root 사용자 실행
Dockerfile에서 `appuser` 계정으로 실행:
```dockerfile
RUN useradd -m -u 1000 appuser
USER appuser
```

### 4. CORS 제한
프로덕션에서 특정 도메인만 허용:
```env
CORS_ORIGINS=https://your-frontend-domain.com
```

---

## 📊 성능 최적화

### Gunicorn 설정
```dockerfile
# 2 workers, 4 threads (1 vCPU 기준)
CMD exec gunicorn --bind :$PORT --workers 2 --threads 4 --timeout 120 run:app
```

### Cloud Run 리소스
```bash
--memory=1Gi           # 메모리 1GB
--cpu=1                # 1 vCPU
--min-instances=0      # 비용 절감 (콜드 스타트 허용)
--max-instances=10     # 트래픽 급증 대비
--timeout=300          # 5분 타임아웃
```

---

## 💰 예상 비용

### Cloud Run (무료 할당량 초과 시)
- 요청 수: 200만 건/월까지 무료
- CPU: 180,000 vCPU-초/월까지 무료
- 메모리: 360,000 GiB-초/월까지 무료

### Cloud SQL (db-f1-micro)
- 약 $7~10/월 (항상 실행 시)
- 개발 환경: 사용 안 할 때 중지하여 비용 절감 가능

### Container Registry
- 저장소: 5GB까지 무료
- 네트워크 송신: 1GB까지 무료

### Secret Manager
- 처음 6개 버전: 무료
- 액세스: 10,000회/월까지 무료

**총 예상 비용**: 월 $10~20 (소규모 트래픽 기준)

---

## ⚠️ 주의 사항

### 1. 환경 변수 설정 필수
`.env.prod` 파일을 생성하고 다음 값을 반드시 변경:
- `SECRET_KEY`: 64자 무작위 문자열
- `JWT_SECRET_KEY`: 64자 무작위 문자열 (SECRET_KEY와 다름)
- `DB_PASSWORD`: Cloud SQL 비밀번호
- `DB_HOST`: Cloud SQL 연결 이름 (Unix Socket 형식)
- `CORS_ORIGINS`: 실제 프론트엔드 도메인

### 2. Cloud SQL 연결 설정
배포 시 `--add-cloudsql-instances` 옵션 필수:
```bash
--add-cloudsql-instances=PROJECT:REGION:INSTANCE
```

### 3. Secret Manager 권한
Cloud Run 서비스 계정에 Secret Accessor 역할 부여 필수

### 4. 초기 데이터베이스 설정
배포 후 DB 테이블 생성 및 초기 데이터 로딩:
```bash
# Cloud Run 컨테이너에서 실행
gcloud run services describe foreigneye-backend --format="value(status.url)"
# 수동으로 reset_db.py 및 etl/run.py 실행 필요
```

---

## 🧪 테스트 체크리스트

배포 후 반드시 확인:

- [ ] `/health` 엔드포인트 정상 응답 (`status: healthy`)
- [ ] `/` 루트 엔드포인트 API 정보 반환
- [ ] `POST /api/v1/auth/register` 회원가입 성공
- [ ] `POST /api/v1/auth/login` 로그인 성공 및 JWT 토큰 발급
- [ ] `GET /api/v1/articles` 기사 목록 조회 (인증 불필요)
- [ ] `GET /api/v1/articles/{id}` 기사 상세 조회 (JWT 필요)
- [ ] `POST /api/v1/collections/concepts` 개념 수집 (JWT 필요)
- [ ] 프론트엔드에서 CORS 오류 없이 API 호출 가능
- [ ] Cloud Run 로그에 에러 없음
- [ ] Cloud SQL 연결 정상

---

## 📞 다음 단계

### 즉시 수행
1. ✅ `.env.prod` 파일 생성 및 실제 값 설정
2. ✅ Google Cloud SQL 인스턴스 생성
3. ✅ Secret Manager에 시크릿 저장
4. ✅ Cloud Run 배포 실행

### 단기 (1주일 내)
1. Cloud Build 트리거 설정 (자동 배포)
2. 커스텀 도메인 연결
3. Cloud Monitoring 및 Alerting 설정
4. 프론트엔드 CORS 설정 확인

### 중기 (1개월 내)
1. Redis 캐싱 통합 (Cloud Memorystore)
2. Cloud CDN 설정 (정적 콘텐츠)
3. Cloud Armor 설정 (DDoS 방어)
4. 자동 백업 및 재해 복구 계획

---

## 📚 참고 문서

- **배포 가이드**: `CLOUD_RUN_DEPLOYMENT.md`
- **환경 변수 템플릿**: `.env.production.example`
- **자동 배포 설정**: `cloudbuild.yaml`
- **Google Cloud Run 공식 문서**: https://cloud.google.com/run/docs
- **Google Cloud SQL 공식 문서**: https://cloud.google.com/sql/docs

---

## ✅ 완료 확인

이 마이그레이션으로 다음이 달성되었습니다:

✓ 로컬호스트 의존성 제거  
✓ Cloud Run 동적 포트 지원  
✓ Cloud SQL Unix Socket 연결  
✓ Secret Manager 통합  
✓ Health Check 엔드포인트 추가  
✓ 자동 배포 파이프라인 구축  
✓ 보안 강화 (비root 사용자, CORS 제한)  
✓ 성능 최적화 (Gunicorn workers/threads)  
✓ 비용 최적화 (min-instances=0)  

**ForeignEye 백엔드는 이제 Google Cloud Run에 배포할 준비가 완료되었습니다!** 🚀

---

**작성자**: ForeignEye DevOps Team  
**최종 업데이트**: 2025-11-12
