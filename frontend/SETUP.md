# ForeignEye Frontend - 설치 및 실행 가이드

## 📦 1단계: 의존성 설치

```bash
# frontend 디렉토리로 이동
cd frontend

# npm 패키지 설치
npm install
```

설치되는 주요 패키지:
- React 18.2
- TypeScript 5.2
- Vite 5.0
- Chakra UI
- TanStack Query
- Axios
- React Router DOM

## ⚙️ 2단계: 환경 설정

`.env` 파일이 이미 생성되어 있습니다. 필요시 수정:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## 🚀 3단계: 실행

### 백엔드 서버 먼저 실행

```bash
# 프로젝트 루트로 이동
cd ..

# Python 가상환경 활성화 (Windows)
venv\Scripts\activate

# Flask 서버 실행
flask run --port=5000 --debug
```

백엔드가 `http://localhost:5000`에서 실행됩니다.

### 프론트엔드 개발 서버 실행

새 터미널을 열고:

```bash
# frontend 디렉토리로 이동
cd frontend

# 개발 서버 시작
npm run dev
```

프론트엔드가 `http://localhost:3000`에서 실행됩니다.

## ✅ 4단계: 동작 확인

1. 브라우저에서 `http://localhost:3000` 접속
2. "시작하기" 버튼 클릭 → 회원가입
3. 로그인 후 기사 목록 확인
4. 기사 클릭 → 상세 페이지
5. 개념 "수집하기" 버튼 테스트

## 🧪 테스트 계정 생성

```bash
# 회원가입 화면에서
Username: testuser
Email: test@foreigneye.com
Password: Test123!
```

## 📝 추가 명령어

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview

# 린트 체크
npm run lint
```

## 🔧 문제 해결

### CORS 에러 발생 시

백엔드 `app/__init__.py`에서 CORS 설정 확인:

```python
from flask_cors import CORS
CORS(app, origins=['http://localhost:3000'])
```

### Port 3000이 이미 사용 중일 때

`vite.config.ts`에서 포트 변경:

```typescript
server: {
  port: 3001,  // 다른 포트로 변경
}
```

### 의존성 설치 오류

```bash
# 캐시 클리어 후 재설치
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install
```

## 🎯 다음 단계

Phase 1 완료 후:
- Phase 2: 3D 그래프 통합
- 대시보드 페이지 구현
- 추가 기능 개발

---

**설치 완료! 지식 탐험을 시작하세요! 🌍**
