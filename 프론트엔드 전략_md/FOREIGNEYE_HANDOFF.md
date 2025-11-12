# ForeignEye 기술 인수인계 문서

> **작성일**: 2025-11-12  
> **대상**: 새로운 ForeignEye-Frontend 프로젝트  
> **목적**: Phase 1 "Crawl" 단계 착수를 위한 백엔드 API 및 아키텍처 이해

---

## 📋 목차

1. [프로젝트 비전: "확장하는 우주(Expanding Universe)" UX](#1-프로젝트-비전-확장하는-우주expanding-universe-ux)
2. [기술 스택 및 아키텍처](#2-기술-스택-및-아키텍처)
3. [백엔드 API 명세](#3-백엔드-api-명세)
4. [데이터 모델](#4-데이터-모델)
5. [ETL 파이프라인](#5-etl-파이프라인)
6. [환경 설정](#6-환경-설정)
7. [Phase 1: Frontend 시작 가이드](#7-phase-1-frontend-시작-가이드)

---

## 1. 프로젝트 비전: "확장하는 우주(Expanding Universe)" UX

### 최종 목표
사용자가 3D 지식 그래프를 통해 능동적으로 **탐험(Explore)**, **발견(Discover)**, **습득(Acquire)** 하며 자신만의 지식 지도를 성장시키는 게임화된 학습 경험 제공.

### 핵심 상호작용 루프

```
[시작] 대시보드 진입
   ↓
   ↓ 3개의 시드 개념(Seed Concepts) 노드 표시
   ↓
[탐험] 개념 노드 클릭
   ↓
   ↓ GET /search/articles_by_concept → 기사 노드 생성
   ↓
[발견] 기사 노드 클릭
   ↓
   ↓ GET /articles/{id} → 유령 개념(Ghost Concepts) 노드 생성
   ↓
[습득] 유령 개념 클릭
   ↓
   ↓ POST /collections/concepts → Solid Concept으로 변환, 컬렉션 추가
   ↓
[성장] 그래프 확장 및 통계 업데이트
```

### 노드 타입 정의

| 노드 타입 | 설명 | 시각적 표현 | 클릭 액션 |
|----------|------|------------|----------|
| **Solid Concept** | 사용자가 수집한 개념 | 실선 원, 강한 색상 | 탐험: 관련 기사 노드 생성 |
| **Ghost Concept** | 미수집 개념 (기사 내 등장) | 점선 원, 흐릿한 색상 | 습득: 컬렉션에 추가 |
| **Article Node** | 기사 | 사각형, 구분 색상 | 발견: 포함된 개념 노드 생성 |

---

## 2. 기술 스택 및 아키텍처

### 2.1 Two-Repo 아키텍처

환경 충돌 해결을 위해 백엔드/프론트엔드 완전 분리.

```
TechExplained/              (현재 백엔드 레포)
├── app/                    (Flask 애플리케이션)
├── etl/                    (데이터 파이프라인)
└── ...

ForeignEye-Frontend/        (새 프론트엔드 레포 - Phase 1 시작)
├── src/
│   ├── pages/
│   ├── api/
│   └── ...
└── package.json
```

### 2.2 기술 스택 상세

#### Backend
- **Framework**: Flask 3.x
- **ORM**: SQLAlchemy
- **Database**: MySQL (PyMySQL 드라이버)
- **Authentication**: Flask-JWT-Extended (stateless, token-based)
- **Rate Limiting**: Flask-Limiter
- **CORS**: Flask-CORS

#### ETL Pipeline
- **News API**: GNews API
- **Web Scraping**: BeautifulSoup4, requests
- **AI Analysis**: OpenRouter API (Claude 3 Haiku)
- **Process**: 크롤링 → 스크래핑 → AI 개념 추출 → DB 저장

#### Frontend (목표 스택)
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **State Management**: @tanstack/react-query
- **3D Visualization**: 3d-force-graph
- **UI Library**: @chakra-ui/react
- **Routing**: react-router-dom

---

## 3. 백엔드 API 명세

### 3.1 인증 (Authentication)

**Base URL**: `/api/v1/auth`

#### POST `/register`
회원가입 및 JWT 토큰 발급

**Request**:
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAi...",
    "refresh_token": "eyJ0eXAi...",
    "user": {
      "user_id": 1,
      "username": "user123",
      "email": "user@example.com"
    },
    "message": "회원가입이 완료되었습니다."
  }
}
```

#### POST `/login`
로그인 및 JWT 토큰 발급

**Request**:
```json
{
  "username": "user123",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAi...",
    "refresh_token": "eyJ0eXAi...",
    "user": { ... },
    "message": "로그인되었습니다."
  }
}
```

#### GET `/me`
현재 사용자 정보 조회

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "username": "user123",
      "email": "user@example.com",
      "stats": {
        "total_concepts": 15,
        "total_articles": 42
      }
    }
  }
}
```

---

### 3.2 기사 (Articles)

**Base URL**: `/api/v1/articles`

#### GET `/`
기사 목록 조회 (페이지네이션)

**Query Params**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `sort`: 정렬 기준 (`created_at`, `title`, 기본값: `created_at`)
- `order`: 정렬 순서 (`asc`, `desc`, 기본값: `desc`)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "article_id": 1,
        "title": "OpenAI Releases GPT-5",
        "title_ko": "OpenAI, GPT-5 출시",
        "original_url": "https://...",
        "summary_ko": "OpenAI가 차세대 언어 모델...",
        "created_at": "2025-11-12T03:00:00Z",
        "concept_count": 5,
        "preview_concepts": [
          { "concept_id": 10, "name": "Large Language Model" },
          { "concept_id": 12, "name": "Transformer Architecture" }
        ]
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_items": 100,
      "items_per_page": 10,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

#### GET `/{article_id}`
기사 상세 조회 (지식 그래프 포함)

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "article": {
      "article_id": 1,
      "title": "OpenAI Releases GPT-5",
      "title_ko": "OpenAI, GPT-5 출시",
      "original_url": "https://...",
      "summary_ko": "OpenAI가 차세대...",
      "created_at": "2025-11-12T03:00:00Z",
      "graph": {
        "nodes": [
          {
            "id": 10,
            "label": "Large Language Model",
            "description": "방대한 텍스트 데이터로...",
            "real_world_examples": ["GPT-4", "Claude"],
            "is_collected": true,
            "is_primary": true
          }
        ],
        "edges": [
          { "from": 10, "to": 12, "strength": 5 }
        ]
      }
    }
  }
}
```

---

### 3.3 검색 (Search) ⭐ 핵심 탐험 API

**Base URL**: `/api/v1/search`

#### GET `/articles_by_concept`
특정 개념을 포함한 기사 검색 (개념 클릭 시 사용)

**Headers**: `Authorization: Bearer <access_token>`

**Query Params**:
- `concept_name`: 개념 이름 (필수, 대소문자 무시)

**Example**: `/api/v1/search/articles_by_concept?concept_name=Transformer%20Architecture`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "concept": "Transformer Architecture",
    "total_results": 8,
    "articles": [
      {
        "article_id": 1,
        "title": "...",
        "summary_ko": "...",
        "preview_concepts": [...]
      }
    ]
  }
}
```

#### GET `/articles_by_multiple_concepts`
여러 개념을 모두 포함한 기사 검색 (AND 조건)

**Query Params**:
- `concepts`: 쉼표로 구분된 개념 이름 (예: `GPT,Transformer`)

**Example**: `/api/v1/search/articles_by_multiple_concepts?concepts=GPT,Transformer`

---

### 3.4 컬렉션 (Collections) ⭐ 핵심 습득 API

**Base URL**: `/api/v1/collections`

#### POST `/concepts`
개념을 사용자 컬렉션에 추가 (유령 → 실체화)

**Headers**: `Authorization: Bearer <access_token>`

**Request**:
```json
{
  "concept_id": 12
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "collection": {
      "user_id": 1,
      "concept_id": 12,
      "collected_at": "2025-11-12T12:00:00Z"
    },
    "concept_name": "Transformer Architecture",
    "new_connections": [
      { "concept_id": 10, "name": "Large Language Model", "strength": 5 }
    ],
    "message": "'Transformer Architecture'를 수집했습니다! 1개의 강한 연결을 발견했습니다."
  }
}
```

#### GET `/concepts`
내 컬렉션 조회

**Headers**: `Authorization: Bearer <access_token>`

**Query Params**:
- `sort`: 정렬 기준 (`collected_at`, `name`)
- `order`: 정렬 순서 (`asc`, `desc`)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "concepts": [
      {
        "concept_id": 10,
        "name": "Large Language Model",
        "description_ko": "...",
        "real_world_examples_ko": ["GPT-4", "Claude"]
      }
    ],
    "total_concepts": 15
  }
}
```

#### DELETE `/concepts/{concept_id}`
컬렉션에서 개념 제거

---

### 3.5 지식 맵 (Knowledge Map)

**Base URL**: `/api/v1/knowledge-map`

#### GET `/`
사용자의 통합 지식 맵 조회 (대시보드용)

**Headers**: `Authorization: Bearer <access_token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "graph": {
      "nodes": [...],
      "edges": [...]
    },
    "stats": {
      "total_concepts": 15,
      "total_articles": 42,
      "strong_connections": 8
    }
  }
}
```

---

## 4. 데이터 모델

### 4.1 주요 테이블 구조

#### `Article` (기사)
```python
{
  "article_id": int (PK),
  "title": str(255),              # 원문 제목
  "title_ko": str(255) | null,    # 한국어 제목
  "original_url": str(512),       # UNIQUE, INDEX
  "summary_ko": text,             # AI 생성 요약
  "graph_cache": text | null,     # JSON 형식 그래프 캐시
  "created_at": datetime          # INDEX
}
```

#### `Concept` (개념)
```python
{
  "concept_id": int (PK),
  "name": str(100),                # UNIQUE, INDEX
  "description_ko": text,          # NOT NULL
  "real_world_examples_ko": json | null
}
```

#### `Article_Concept` (기사-개념 관계)
```python
{
  "id": int (PK),
  "article_id": int (FK),
  "concept_id": int (FK)
}
# INDEX: (article_id, concept_id)
```

#### `User_Collection` (사용자 컬렉션)
```python
{
  "id": int (PK),
  "user_id": int (FK),
  "concept_id": int (FK),
  "collected_at": datetime
}
# UNIQUE: (user_id, concept_id)
```

#### `Concept_Relation` (개념 간 관계)
```python
{
  "relation_id": int (PK),
  "from_concept_id": int (FK),
  "to_concept_id": int (FK),
  "strength": int (1-10),         # 관계 강도
  "relation_type": str(50)        # 관계 유형
}
# INDEX: (from_concept_id, to_concept_id)
```

### 4.2 그래프 캐싱 전략

- **`Article.graph_cache`**: 기사별 그래프를 사전 계산하여 JSON으로 저장
- **목적**: O(N*M) 쿼리 → O(1) 캐시 조회로 성능 최적화
- **업데이트**: ETL 파이프라인 실행 시 자동 생성

---

## 5. ETL 파이프라인

### 5.1 파이프라인 구조

```
[GNewsFetcher] 
    ↓ (GNews API 호출)
    ↓ 기사 URL 수집
    ↓
[WebScraper]
    ↓ (BeautifulSoup)
    ↓ 본문 추출
    ↓
[AIAnalyzer]
    ↓ (OpenRouter - Claude 3 Haiku)
    ↓ 개념 추출 + 요약
    ↓
[DBLoader]
    ↓ (Flask 앱 컨텍스트)
    ↓ DB 저장 + 그래프 캐시 생성
```

### 5.2 핵심 변경 사항

**이전 아키텍처** (폐기됨):
- AI가 개념 정의 생성
- 개념 간 관계를 AI가 추론
- 복잡한 재귀 로직

**현재 아키텍처** (Search-Centric):
- AI는 **개념 이름만** 추출 (간단한 배열)
- 개념 정의는 나중에 필요 시 생성 (지연 로딩)
- 검색 중심 설계: `SearchService.get_articles_by_concept()`

### 5.3 실행 방법

```bash
# 환경 변수 설정 (.env 파일)
GNEWS_API_KEY=your_key
OPENROUTER_API_KEY=your_key

# ETL 실행
python -m etl.run

# 또는 Flask CLI
flask etl run
```

---

## 6. 환경 설정

### 6.1 필수 환경 변수

```bash
# Database
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=foreigneye_db

# Security
SECRET_KEY=your-very-secure-secret-key
JWT_SECRET_KEY=your-jwt-secret-key

# External APIs
GNEWS_API_KEY=your_gnews_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Flask
FLASK_ENV=development
FLASK_APP=app:create_app
```

### 6.2 백엔드 실행

```bash
# 가상환경 활성화
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate      # Windows

# 의존성 설치
pip install -r requirements.txt

# DB 마이그레이션 (자동 생성)
flask run  # create_all()이 자동 실행됨

# 개발 서버 시작
flask run --port=5000 --debug

# 또는
python run.py
```

서버 실행 시 자동으로 다음이 생성됩니다:
- 모든 테이블 (`db.create_all()`)
- CORS 설정 (개발 환경: 모든 origin 허용)

---

## 7. Phase 1: Frontend 시작 가이드

### 7.1 목표

"하얀 화면" 오류 제거 및 안정적인 2D 기반 구축:
1. 기사 목록 페이지 (`ArticlesPage.tsx`)
2. 기사 상세 페이지 (`ArticleDetailPage.tsx`)
3. 개념 수집 버튼 ("[+ 수집하기]")

**3D 그래프는 Phase 2에서 추가**

### 7.2 새 프로젝트 셋업

```bash
# 깨끗한 Vite 프로젝트 생성
npm create vite@latest ForeignEye-Frontend -- --template react-ts

cd ForeignEye-Frontend

# 핵심 의존성만 설치
npm install axios react-router-dom @tanstack/react-query @chakra-ui/react @emotion/react @emotion/styled framer-motion
```

### 7.3 API 클라이언트 구조

```typescript
// src/api/client.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1',
  withCredentials: true,
})

// JWT 인터셉터
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// src/api/articles.ts
export const getArticles = async (params: GetArticlesParams) => {
  const response = await apiClient.get('/articles', { params })
  return response.data.data
}

export const getArticleDetail = async (articleId: number) => {
  const response = await apiClient.get(`/articles/${articleId}`)
  return response.data.data.article
}

// src/api/collections.ts
export const collectConcept = async (conceptId: number) => {
  const response = await apiClient.post('/collections/concepts', { concept_id: conceptId })
  return response.data.data
}
```

### 7.4 필수 페이지 구현

#### ArticlesPage (목록)
- React Query로 `/api/v1/articles` 호출
- 페이지네이션 UI
- 각 기사 카드 클릭 시 `/articles/{id}` 라우팅

#### ArticleDetailPage (상세)
- URL param으로 `article_id` 추출
- React Query로 `/api/v1/articles/{id}` 호출
- 요약 표시
- 개념 목록 (태그 형태)
- 각 개념에 "[+ 수집하기]" 버튼
  - 클릭 시 `POST /collections/concepts`
  - 성공 시 토스트 메시지

### 7.5 환경 변수

```bash
# .env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 8. 체크리스트

### Backend (현재 상태)
- [x] JWT 인증 완료
- [x] CSRF 문제 해결 (JWT는 CSRF 불필요)
- [x] 모든 핵심 API 엔드포인트 구현
- [x] ETL 파이프라인 안정화
- [x] Search-centric 아키텍처 전환
- [x] 그래프 캐싱 최적화

### Frontend Phase 1 (시작 필요)
- [ ] Vite React-TS 프로젝트 생성
- [ ] API 클라이언트 구현
- [ ] ArticlesPage 구현
- [ ] ArticleDetailPage 구현
- [ ] 개념 수집 기능 구현
- [ ] 인증 플로우 (로그인/회원가입)

### Frontend Phase 2 (이후)
- [ ] 3d-force-graph 통합
- [ ] DashboardPage (통합 지식 맵)
- [ ] Expanding Universe UX 구현

---

## 9. API 테스트 예시

### 회원가입 & 로그인
```bash
# 회원가입
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "password_confirm": "Test123!"
  }'

# 로그인 (access_token 저장)
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!"
  }'
```

### 기사 조회
```bash
# 목록
curl http://localhost:5000/api/v1/articles?page=1&limit=5

# 상세 (JWT 필요)
curl http://localhost:5000/api/v1/articles/1 \
  -H "Authorization: Bearer eyJ0eXAi..."
```

### 개념 수집
```bash
curl -X POST http://localhost:5000/api/v1/collections/concepts \
  -H "Authorization: Bearer eyJ0eXAi..." \
  -H "Content-Type: application/json" \
  -d '{"concept_id": 10}'
```

---

## 10. 문의 및 지원

- **백엔드 코드**: `TechExplained/` 레포지토리
- **데이터베이스**: MySQL `foreigneye_db`
- **API 문서**: 이 문서 섹션 3 참조
- **ETL 실행**: `python -m etl.run`

**중요**: Phase 1에서는 3D 그래프 없이 안정적인 2D 앱을 먼저 완성하세요. 캐시 문제를 완전히 해결한 후 Phase 2에서 3D를 추가합니다.
