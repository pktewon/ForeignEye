# 🚀 ForeignEye Backend - Google Cloud Run 배포 가이드

## 📋 목차
1. [사전 준비](#사전-준비)
2. [Google Cloud SQL 설정](#google-cloud-sql-설정)
3. [Secret Manager 설정](#secret-manager-설정)
4. [수동 배포](#수동-배포)
5. [자동 배포 (Cloud Build)](#자동-배포-cloud-build)
6. [배포 후 확인](#배포-후-확인)
7. [문제 해결](#문제-해결)

---

## 🎯 사전 준비

### 1. Google Cloud CLI 설치 및 로그인

```bash
# Google Cloud CLI 설치 (Windows)
# https://cloud.google.com/sdk/docs/install에서 다운로드

# 로그인
gcloud auth login

# 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# 기본 리전 설정 (서울)
gcloud config set run/region asia-northeast3
```

### 2. 필수 API 활성화

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud Build API (자동 배포용)
gcloud services enable cloudbuild.googleapis.com

# Container Registry API
gcloud services enable containerregistry.googleapis.com

# Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Secret Manager API
gcloud services enable secretmanager.googleapis.com
```

### 3. 프로젝트 권한 확인

Cloud Run에 필요한 역할:
- Cloud Run Admin
- Cloud SQL Client
- Secret Manager Secret Accessor
- Service Account User

---

## 🗄️ Google Cloud SQL 설정

### 1. Cloud SQL 인스턴스 생성

```bash
# MySQL 8.0 인스턴스 생성 (서울 리전)
gcloud sql instances create foreigneye-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=asia-northeast3 \
    --root-password="YOUR_STRONG_ROOT_PASSWORD" \
    --storage-size=10GB \
    --storage-auto-increase

# 데이터베이스 생성
gcloud sql databases create foreigneye_db \
    --instance=foreigneye-db

# 사용자 생성
gcloud sql users create foreigneye_user \
    --instance=foreigneye-db \
    --password="YOUR_STRONG_PASSWORD"
```

### 2. Cloud SQL 연결 이름 확인

```bash
gcloud sql instances describe foreigneye-db --format="value(connectionName)"
# 출력 예: your-project:asia-northeast3:foreigneye-db
```

**중요**: 이 연결 이름을 `.env.prod`의 `DB_HOST`에 사용:
```
DB_HOST=/cloudsql/your-project:asia-northeast3:foreigneye-db
```

---

## 🔐 Secret Manager 설정

### 1. 시크릿 생성

```bash
# SECRET_KEY 생성 및 저장
python -c "import secrets; print(secrets.token_hex(32))" > /tmp/secret_key.txt
gcloud secrets create foreigneye-secret-key \
    --data-file=/tmp/secret_key.txt \
    --replication-policy="automatic"

# JWT_SECRET_KEY 생성 및 저장
python -c "import secrets; print(secrets.token_hex(32))" > /tmp/jwt_key.txt
gcloud secrets create foreigneye-jwt-key \
    --data-file=/tmp/jwt_key.txt \
    --replication-policy="automatic"

# DB_PASSWORD 저장
echo -n "YOUR_DB_PASSWORD" | gcloud secrets create foreigneye-db-password \
    --data-file=- \
    --replication-policy="automatic"

# GNEWS_API_KEY 저장
echo -n "YOUR_GNEWS_API_KEY" | gcloud secrets create gnews-api-key \
    --data-file=- \
    --replication-policy="automatic"

# OPENROUTER_API_KEY 저장
echo -n "YOUR_OPENROUTER_API_KEY" | gcloud secrets create openrouter-api-key \
    --data-file=- \
    --replication-policy="automatic"

# 임시 파일 삭제
rm /tmp/secret_key.txt /tmp/jwt_key.txt
```

### 2. 시크릿 권한 설정

```bash
# Cloud Run 서비스 계정에 Secret Accessor 역할 부여
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding foreigneye-secret-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding foreigneye-jwt-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding foreigneye-db-password \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding gnews-api-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding openrouter-api-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
```

---

## 📦 수동 배포

### 1. Docker 이미지 빌드 및 푸시

```bash
# backend 디렉토리로 이동
cd backend

# 프로젝트 ID 설정
export PROJECT_ID=YOUR_PROJECT_ID

# Docker 이미지 빌드
docker build -t gcr.io/$PROJECT_ID/foreigneye-backend:latest .

# Container Registry에 푸시
docker push gcr.io/$PROJECT_ID/foreigneye-backend:latest
```

### 2. Cloud Run 배포

```bash
gcloud run deploy foreigneye-backend \
    --image=gcr.io/$PROJECT_ID/foreigneye-backend:latest \
    --region=asia-northeast3 \
    --platform=managed \
    --allow-unauthenticated \
    --memory=1Gi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --timeout=300 \
    --set-env-vars="FLASK_ENV=production,FLASK_DEBUG=False,DB_USER=foreigneye_user,DB_PORT=3306,DB_NAME=foreigneye_db,DB_HOST=/cloudsql/YOUR_PROJECT:asia-northeast3:foreigneye-db,CORS_ORIGINS=https://your-frontend-domain.com" \
    --add-cloudsql-instances=YOUR_PROJECT:asia-northeast3:foreigneye-db \
    --set-secrets="SECRET_KEY=foreigneye-secret-key:latest,JWT_SECRET_KEY=foreigneye-jwt-key:latest,DB_PASSWORD=foreigneye-db-password:latest,GNEWS_API_KEY=gnews-api-key:latest,OPENROUTER_API_KEY=openrouter-api-key:latest"
```

**중요 파라미터 설명**:
- `--allow-unauthenticated`: 공개 API (필요시 제거하여 인증 필요)
- `--memory=1Gi`: 메모리 1GB (필요시 조정)
- `--min-instances=0`: 트래픽 없을 때 0으로 축소 (비용 절감)
- `--max-instances=10`: 트래픽 급증 시 최대 10개 인스턴스
- `--add-cloudsql-instances`: Cloud SQL 연결 설정
- `--set-secrets`: Secret Manager에서 환경 변수 주입

### 3. 배포 URL 확인

```bash
gcloud run services describe foreigneye-backend \
    --region=asia-northeast3 \
    --format="value(status.url)"
```

---

## 🤖 자동 배포 (Cloud Build)

### 1. Cloud Build 트리거 생성

```bash
# GitHub 연동 (최초 1회)
gcloud alpha builds connections create github github-connection \
    --region=asia-northeast3

# 트리거 생성
gcloud builds triggers create github \
    --name=foreigneye-backend-deploy \
    --repo-name=YOUR_REPO_NAME \
    --repo-owner=YOUR_GITHUB_USERNAME \
    --branch-pattern="^main$" \
    --build-config=backend/cloudbuild.yaml \
    --substitutions=_CLOUD_SQL_INSTANCE="YOUR_PROJECT:asia-northeast3:foreigneye-db"
```

### 2. cloudbuild.yaml 수정

`backend/cloudbuild.yaml` 파일에서 다음 변수 수정:
```yaml
substitutions:
  _CLOUD_SQL_INSTANCE: 'YOUR_PROJECT_ID:asia-northeast3:foreigneye-db'
```

### 3. 자동 배포 테스트

```bash
# main 브랜치에 푸시하면 자동 배포
git add .
git commit -m "Deploy to Cloud Run"
git push origin main
```

### 4. 빌드 상태 확인

```bash
gcloud builds list --limit=5
```

---

## ✅ 배포 후 확인

### 1. 헬스 체크

```bash
# 배포된 URL 확인
SERVICE_URL=$(gcloud run services describe foreigneye-backend \
    --region=asia-northeast3 \
    --format="value(status.url)")

# 헬스 체크
curl $SERVICE_URL/health

# 기대 응답:
# {
#   "status": "healthy",
#   "service": "foreigneye-backend",
#   "timestamp": "2025-11-12T08:00:00.000000Z"
# }
```

### 2. API 엔드포인트 테스트

```bash
# 루트 엔드포인트
curl $SERVICE_URL/

# 기사 목록 조회 (공개)
curl $SERVICE_URL/api/v1/articles

# 회원가입 테스트
curl -X POST $SERVICE_URL/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser",
        "email": "test@example.com",
        "password": "Test123!",
        "password_confirm": "Test123!"
    }'

# 로그인 테스트
curl -X POST $SERVICE_URL/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser",
        "password": "Test123!"
    }'
```

### 3. 로그 확인

```bash
# 실시간 로그 스트리밍
gcloud run services logs read foreigneye-backend \
    --region=asia-northeast3 \
    --tail

# 최근 100개 로그
gcloud run services logs read foreigneye-backend \
    --region=asia-northeast3 \
    --limit=100
```

### 4. 데이터베이스 확인

```bash
# Cloud SQL Proxy를 통한 로컬 연결 (선택 사항)
gcloud sql connect foreigneye-db --user=foreigneye_user

# MySQL 접속 후
USE foreigneye_db;
SHOW TABLES;
SELECT * FROM User LIMIT 5;
```

---

## 🔧 문제 해결

### 문제 1: 서비스가 시작되지 않음

**증상**: Cloud Run 배포 후 "Service is unhealthy"

**해결**:
```bash
# 로그 확인
gcloud run services logs read foreigneye-backend --region=asia-northeast3 --tail

# 일반적인 원인:
# 1. PORT 환경 변수 미설정 → Dockerfile CMD 확인
# 2. 데이터베이스 연결 실패 → Cloud SQL 인스턴스 연결 설정 확인
# 3. Secret 접근 권한 없음 → IAM 권한 확인
```

### 문제 2: Cloud SQL 연결 실패

**증상**: "Can't connect to MySQL server"

**해결**:
```bash
# Cloud SQL 연결 이름 확인
gcloud sql instances describe foreigneye-db --format="value(connectionName)"

# Cloud Run 배포 시 --add-cloudsql-instances 확인
gcloud run services describe foreigneye-backend \
    --region=asia-northeast3 \
    --format="value(spec.template.spec.containers[0].env)"

# DB_HOST 환경 변수 확인 (Unix Socket 형식)
# 올바른 형식: /cloudsql/PROJECT:REGION:INSTANCE
```

### 문제 3: Secret Manager 접근 오류

**증상**: "Error: Secret not found" 또는 "Permission denied"

**해결**:
```bash
# 시크릿 존재 확인
gcloud secrets list

# 시크릿 버전 확인
gcloud secrets versions list foreigneye-secret-key

# IAM 권한 확인
gcloud secrets get-iam-policy foreigneye-secret-key

# 권한 추가 (필요시)
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding foreigneye-secret-key \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
```

### 문제 4: CORS 오류

**증상**: 프론트엔드에서 "CORS policy" 오류

**해결**:
```bash
# CORS_ORIGINS 환경 변수 확인
gcloud run services describe foreigneye-backend \
    --region=asia-northeast3 \
    --format="value(spec.template.spec.containers[0].env)"

# CORS_ORIGINS 업데이트
gcloud run services update foreigneye-backend \
    --region=asia-northeast3 \
    --set-env-vars="CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-domain.com"
```

### 문제 5: 메모리 부족 (OOM)

**증상**: 로그에 "Memory limit exceeded"

**해결**:
```bash
# 메모리 증가 (512MB → 1GB → 2GB)
gcloud run services update foreigneye-backend \
    --region=asia-northeast3 \
    --memory=2Gi
```

---

## 📊 성능 최적화

### 1. 인스턴스 수 조정

```bash
# 최소 인스턴스 1개 유지 (콜드 스타트 방지, 비용 증가)
gcloud run services update foreigneye-backend \
    --region=asia-northeast3 \
    --min-instances=1

# 최대 인스턴스 증가 (트래픽 급증 대비)
gcloud run services update foreigneye-backend \
    --region=asia-northeast3 \
    --max-instances=50
```

### 2. CPU 및 메모리 조정

```bash
# CPU 2개, 메모리 2GB로 증가
gcloud run services update foreigneye-backend \
    --region=asia-northeast3 \
    --cpu=2 \
    --memory=2Gi
```

### 3. 타임아웃 조정

```bash
# 긴 요청 처리 (최대 3600초)
gcloud run services update foreigneye-backend \
    --region=asia-northeast3 \
    --timeout=600
```

---

## 💰 비용 최적화

### 1. 최소 인스턴스 0으로 설정

```bash
gcloud run services update foreigneye-backend \
    --region=asia-northeast3 \
    --min-instances=0
```

### 2. Cloud SQL 자동 백업 비활성화 (개발 환경)

```bash
gcloud sql instances patch foreigneye-db \
    --no-backup
```

### 3. Cloud SQL 인스턴스 일시 중지 (개발 환경)

```bash
# 중지 (비용 절감)
gcloud sql instances patch foreigneye-db --activation-policy=NEVER

# 재시작
gcloud sql instances patch foreigneye-db --activation-policy=ALWAYS
```

---

## 🔄 업데이트 및 롤백

### 새 버전 배포

```bash
# 새 이미지 빌드
docker build -t gcr.io/$PROJECT_ID/foreigneye-backend:v2 .
docker push gcr.io/$PROJECT_ID/foreigneye-backend:v2

# 배포
gcloud run deploy foreigneye-backend \
    --image=gcr.io/$PROJECT_ID/foreigneye-backend:v2 \
    --region=asia-northeast3
```

### 이전 버전으로 롤백

```bash
# 리비전 목록 확인
gcloud run revisions list \
    --service=foreigneye-backend \
    --region=asia-northeast3

# 특정 리비전으로 롤백
gcloud run services update-traffic foreigneye-backend \
    --region=asia-northeast3 \
    --to-revisions=foreigneye-backend-00001-abc=100
```

---

## 📝 체크리스트

배포 전 최종 확인:

- [ ] Google Cloud SQL 인스턴스 생성 및 DB 초기화
- [ ] Secret Manager에 모든 시크릿 저장
- [ ] `.env.prod` 파일 설정 (DB_HOST, CORS_ORIGINS)
- [ ] Dockerfile 확인 (PORT 환경 변수 사용)
- [ ] Cloud Run 서비스 배포
- [ ] `/health` 엔드포인트 정상 응답 확인
- [ ] API 엔드포인트 테스트 완료
- [ ] 프론트엔드 CORS 테스트 완료
- [ ] 데이터베이스 테이블 생성 확인
- [ ] ETL 파이프라인 실행 (초기 데이터 로딩)

---

## 📞 지원

문제 발생 시:
1. Cloud Run 로그 확인
2. Cloud SQL 연결 상태 확인
3. Secret Manager 권한 확인
4. 이 가이드의 문제 해결 섹션 참조

**ForeignEye DevOps Team** 🚀
