# ForeignEye Frontend - Phase 1

> **"확장하는 우주(Expanding Universe)" 학습 경험**
> 
> React + TypeScript + Vite 기반의 3D 지식 그래프 탐험 플랫폼

---

## 📋 프로젝트 개요

ForeignEye는 기술 개념을 3D 지식 그래프로 시각화하여 사용자가 능동적으로 **탐험(Explore)**, **발견(Discover)**, **습득(Acquire)** 할 수 있는 게임화된 학습 플랫폼입니다.

### Phase 1 목표 ✅

- ✅ 기사 목록 페이지 (페이지네이션)
- ✅ 기사 상세 페이지 (개념 표시)
- ✅ 개념 수집 기능
- ✅ JWT 인증 (로그인/회원가입)
- ⏳ Phase 2에서 3D 그래프 추가 예정

---

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 환경 변수 설정

`.env` 파일이 이미 생성되어 있습니다:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### 3. 백엔드 서버 시작

먼저 백엔드 Flask 서버가 실행 중이어야 합니다:

```bash
# 상위 디렉토리로 이동
cd ..

# Python 가상환경 활성화
venv\Scripts\activate  # Windows

# Flask 서버 실행
flask run --port=5000 --debug
```

### 4. 프론트엔드 개발 서버 시작

```bash
# frontend 디렉토리에서
npm run dev
```

앱이 `http://localhost:3000`에서 실행됩니다.

---

## 🛠️ 기술 스택

### Core
- **React 18.2** - UI 라이브러리
- **TypeScript 5.2** - 타입 안전성
- **Vite 5.0** - 빌드 도구

### State & Data
- **TanStack Query (React Query)** - 서버 상태 관리
- **Axios** - HTTP 클라이언트

### UI & Styling
- **Chakra UI** - 컴포넌트 라이브러리
- **Framer Motion** - 애니메이션

### Routing & Auth
- **React Router v6** - 클라이언트 라우팅
- **JWT** - 인증 (localStorage 기반)

---

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── api/              # API 클라이언트
│   │   ├── client.ts     # Axios 인스턴스 + 인터셉터
│   │   ├── auth.ts       # 인증 API
│   │   ├── articles.ts   # 기사 API
│   │   └── collections.ts # 컬렉션 API
│   │
│   ├── components/       # 재사용 컴포넌트
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── contexts/         # React Context
│   │   └── AuthContext.tsx
│   │
│   ├── pages/            # 페이지 컴포넌트
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ArticlesPage.tsx
│   │   └── ArticleDetailPage.tsx
│   │
│   ├── types/            # TypeScript 타입
│   │   └── index.ts
│   │
│   ├── App.tsx           # 메인 앱 + 라우팅
│   ├── main.tsx          # 엔트리 포인트
│   └── vite-env.d.ts     # Vite 환경 타입
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🔑 주요 기능

### 1. 인증 시스템

- **회원가입** (`/register`)
  - 사용자명, 이메일, 비밀번호
  - 비밀번호 확인 검증
  
- **로그인** (`/login`)
  - JWT 토큰 발급
  - localStorage에 저장
  
- **자동 토큰 갱신**
  - Axios 인터셉터로 401 처리
  - Refresh token 자동 사용

### 2. 기사 탐험

- **기사 목록** (`/articles`)
  - 페이지네이션 (10개씩)
  - 최신순 정렬
  - 미리보기 개념 표시
  
- **기사 상세** (`/articles/:id`)
  - 요약 전문
  - 원문 링크
  - 개념 그래프 데이터
  - 개념별 수집 버튼

### 3. 개념 수집

- 기사 내 개념 클릭 → 컬렉션 추가
- 수집 상태 시각화 (녹색 배경)
- 토스트 알림 (성공/실패)
- React Query 캐시 자동 갱신

---

## 🎨 UI/UX 특징

### 디자인 시스템

- **Chakra UI** 기반 일관된 스타일
- 라이트/다크 모드 지원 준비
- 반응형 레이아웃

### 사용자 경험

- **로딩 상태**: Skeleton UI
- **에러 처리**: 친절한 에러 메시지
- **보호된 라우트**: 미인증 시 자동 리다이렉트
- **네비게이션**: 고정 상단바 + 사용자 메뉴

---

## 🔌 API 연동

### API Client 설정

```typescript
// src/api/client.ts
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})

// JWT 토큰 자동 추가
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 주요 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/auth/register` | 회원가입 |
| POST | `/auth/login` | 로그인 |
| GET | `/auth/me` | 내 정보 |
| GET | `/articles` | 기사 목록 |
| GET | `/articles/:id` | 기사 상세 |
| POST | `/collections/concepts` | 개념 수집 |

---

## 📝 개발 가이드

### 새 페이지 추가하기

1. `src/pages/NewPage.tsx` 생성
2. `src/App.tsx`에 라우트 추가
3. 필요시 `ProtectedRoute`로 감싸기

```tsx
<Route
  path="/new-page"
  element={
    <ProtectedRoute>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

### 새 API 추가하기

1. `src/types/index.ts`에 타입 정의
2. `src/api/newApi.ts` 생성
3. React Query 훅으로 사용

```tsx
const { data } = useQuery({
  queryKey: ['newData'],
  queryFn: () => newApi.getData(),
})
```

### 스타일링

Chakra UI 컴포넌트 사용:

```tsx
<Box bg="blue.500" p={4} borderRadius="md">
  <Text color="white">Hello ForeignEye</Text>
</Box>
```

---

## 🧪 테스트 시나리오

### 1. 회원가입 플로우

1. `/register` 접속
2. 정보 입력 (username, email, password)
3. 회원가입 성공 → `/articles`로 자동 이동
4. 네비게이션바에 사용자명 표시

### 2. 기사 탐험 플로우

1. `/articles` 접속 (인증 필요)
2. 기사 목록 확인
3. 기사 클릭 → 상세 페이지
4. 개념 "수집하기" 버튼 클릭
5. 성공 토스트 확인
6. 개념 배경색 녹색으로 변경 확인

### 3. 인증 만료 플로우

1. 로그인 후 일정 시간 대기
2. API 요청 시도
3. Refresh token 자동 갱신
4. Refresh 실패 시 → `/login`으로 리다이렉트

---

## 🐛 트러블슈팅

### "CORS 에러" 발생 시

백엔드 Flask 서버가 CORS를 허용하는지 확인:

```python
# app/__init__.py
from flask_cors import CORS
CORS(app, origins=['http://localhost:3000'])
```

### "Cannot find module" 에러

의존성 재설치:

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### 빌드 에러

타입 에러 확인:

```bash
npm run build
```

---

## 📦 빌드 & 배포

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과물: `dist/` 디렉토리

### 프리뷰

```bash
npm run preview
```

---

## 🔜 Phase 2 계획

Phase 1 완료 후 추가 예정:

- [ ] **3D 그래프 시각화** (`3d-force-graph`)
- [ ] **대시보드 페이지** (통합 지식 맵)
- [ ] **개념 검색 기능** (특정 개념 포함 기사 찾기)
- [ ] **사용자 통계** (수집한 개념 수, 강한 연결 등)
- [ ] **컬렉션 페이지** (내가 수집한 모든 개념)

---

## 📚 참고 자료

- [React 공식 문서](https://react.dev/)
- [Chakra UI 문서](https://chakra-ui.com/)
- [TanStack Query 문서](https://tanstack.com/query)
- [Vite 문서](https://vitejs.dev/)

---

## 💡 기여 가이드

1. 새 기능은 별도 브랜치에서 개발
2. TypeScript 엄격 모드 준수
3. Chakra UI 스타일 가이드 따르기
4. 컴포넌트 재사용성 고려

---

## 📄 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

**ForeignEye Frontend Team** 🌍
