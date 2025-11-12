# 🚀 ForeignEye 빠른 시작 가이드

## 단 3단계로 앱 실행하기!

---

## ⚡ Step 1: 프론트엔드 설치

```bash
cd frontend
npm install
```

⏱️ 예상 소요 시간: 2-3분

---

## ⚡ Step 2: 백엔드 서버 시작

**새 터미널**을 열고:

```bash
# 프로젝트 루트로 이동
cd c:\workspace\CapStone_Project_2025\ForeignEye

# 가상환경 활성화 (Windows)
venv\Scripts\activate

# Flask 서버 실행
flask run --port=5000 --debug
```

✅ "Running on http://127.0.0.1:5000" 메시지 확인

---

## ⚡ Step 3: 프론트엔드 개발 서버 시작

**또 다른 터미널**을 열고:

```bash
cd c:\workspace\CapStone_Project_2025\ForeignEye\frontend
npm run dev
```

✅ "Local: http://localhost:3000" 메시지 확인

---

## 🌐 Step 4: 브라우저에서 확인

브라우저를 열고 **http://localhost:3000** 접속!

---

## 🎯 첫 테스트 시나리오

### 1. 회원가입
- 홈페이지에서 "시작하기" 클릭
- 정보 입력:
  ```
  사용자명: testuser
  이메일: test@foreigneye.com
  비밀번호: Test123!
  ```

### 2. 기사 탐험
- 자동으로 기사 목록 페이지로 이동
- 아무 기사나 클릭

### 3. 개념 수집
- 기사 상세 페이지에서 개념 확인
- "수집하기" 버튼 클릭
- 성공 메시지 확인! 🎉

---

## ❗ 문제 해결

### "CORS 에러" 발생 시

백엔드 Flask 앱이 CORS를 허용하는지 확인:

```python
# app/__init__.py
from flask_cors import CORS
CORS(app, origins=['http://localhost:3000'])
```

### Port 3000이 이미 사용중

다른 포트 사용:

```bash
npm run dev -- --port 3001
```

### 백엔드가 없을 때

백엔드 API가 없으면 프론트엔드만 볼 수 있습니다 (로그인/기사는 안됨).
인수인계 문서를 참고하여 백엔드를 먼저 설정하세요.

---

## 📚 더 알아보기

- **프론트엔드 문서**: `frontend/README.md`
- **설치 가이드**: `frontend/SETUP.md`
- **프로젝트 상태**: `PROJECT_STATUS.md`
- **백엔드 API**: `FOREIGNEYE_HANDOFF.md`

---

**즐거운 코딩 되세요! 🌍**
