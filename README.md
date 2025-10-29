# 신입 PM 듬이의 하루 - 챗봇 시뮬레이터

## 🚀 시작하기

### 1. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# OpenAI API 설정
OPENAI_API_KEY=your-actual-openai-api-key-here

# 서버 설정
PORT=3000

# 기타 설정
NODE_ENV=development
```

### 2. 의존성 설치

```bash
npm install express dotenv
```

### 3. 서버 실행

```bash
node server.js
```

### 3. 브라우저에서 접속

```
http://localhost:3000
```

## 🔧 API 키 발급 방법

1. [OpenAI Platform](https://platform.openai.com/api-keys)에 접속
2. 계정 생성 및 로그인
3. "Create new secret key" 클릭
4. 생성된 API 키를 `.env` 파일에 설정

## 📁 프로젝트 구조

```
chatbot_project/
├── index.html          # 메인 페이지
├── intro.html          # 도입부 페이지
├── chatbot.html        # 챗봇 인터페이스
├── analyzing.html       # 분석 페이지
├── result.html         # 결과 페이지
├── server.js           # Node.js 서버
├── .env                # 환경변수 (생성 필요)
├── js/
│   └── app.js          # 메인 JavaScript
└── css/
    └── style.css       # 스타일시트
```

## 🛡️ 보안 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요
- API 키는 외부에 노출되지 않도록 주의하세요
- 프로덕션 환경에서는 더 강력한 보안 설정을 사용하세요

## 🐛 문제 해결

### API 키 오류 (401)
- `.env` 파일에 올바른 API 키가 설정되었는지 확인
- API 키가 `sk-`로 시작하는지 확인
- OpenAI 계정에 충분한 크레딧이 있는지 확인

### 서버 실행 오류
- Node.js가 설치되어 있는지 확인
- 포트 3000이 사용 중인지 확인
- 의존성 패키지가 설치되었는지 확인

