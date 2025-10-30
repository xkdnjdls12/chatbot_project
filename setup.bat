@echo off
echo ========================================
echo   신입 PM 듬이의 하루 - 챗봇 시뮬레이터
echo ========================================
echo.

echo 1. 의존성 설치 중...
call npm install

echo.
echo 2. 환경변수 파일 생성 중...
if not exist .env (
    echo # OpenAI API 설정 > .env
    echo OPENAI_API_KEY=your-openai-api-key-here >> .env
    echo. >> .env
    echo # 서버 설정 >> .env
    echo PORT=3000 >> .env
    echo. >> .env
    echo # 기타 설정 >> .env
    echo NODE_ENV=development >> .env
    echo .env 파일이 생성되었습니다.
    echo.
    echo ⚠️  중요: .env 파일에 실제 OpenAI API 키를 설정해주세요!
    echo    OPENAI_API_KEY=your-actual-api-key-here
    echo.
) else (
    echo .env 파일이 이미 존재합니다.
)

echo.
echo 3. 서버 시작 중...
echo    브라우저에서 http://localhost:3000 으로 접속하세요.
echo.
echo    서버를 중지하려면 Ctrl+C를 누르세요.
echo.

call node server.js

pause

