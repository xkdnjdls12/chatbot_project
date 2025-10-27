const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// 환경변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 서빙
app.use(express.static('.'));

// JSON 파싱 미들웨어
app.use(express.json());

// API 키를 안전하게 제공하는 엔드포인트
app.get('/api/config', (req, res) => {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'API 키가 환경변수에 설정되지 않았습니다.',
                message: '.env 파일에 OPENAI_API_KEY를 설정해주세요.'
            });
        }
        
        // API 키를 클라이언트에 전달
        res.json({ 
            apiKey: apiKey,
            status: 'success'
        });
        
    } catch (error) {
        console.error('API 키 전달 오류:', error);
        res.status(500).json({ 
            error: '서버 오류가 발생했습니다.',
            message: error.message 
        });
    }
});

// OpenAI API 프록시 엔드포인트 (CORS 문제 해결)
app.post('/api/openai', async (req, res) => {
    try {
        const { messages, model = 'gpt-3.5-turbo', max_tokens = 500, temperature = 0.7 } = req.body;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens,
                temperature
            })
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            return res.status(response.status).json({
                error: 'OpenAI API 호출 실패',
                details: errorData
            });
        }
        
        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.error('OpenAI API 프록시 오류:', error);
        res.status(500).json({
            error: '서버 오류가 발생했습니다.',
            message: error.message
        });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📝 환경변수 확인:`);
    console.log(`   - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '설정됨 ✅' : '설정되지 않음 ❌'}`);
    console.log(`🌐 브라우저에서 http://localhost:${PORT} 로 접속하세요.`);
});

// 환경변수 검증
if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  경고: OPENAI_API_KEY 환경변수가 설정되지 않았습니다.');
    console.log('📋 .env 파일에 다음을 추가하세요:');
    console.log('   OPENAI_API_KEY=your-actual-api-key-here');
}

