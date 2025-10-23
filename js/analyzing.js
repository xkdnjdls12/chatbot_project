// 결과 분석 중 화면 JavaScript

// 페이지 로드 시 애니메이션 및 자동 전환
document.addEventListener('DOMContentLoaded', function() {
    // 카드 등장 애니메이션
    const analyzingCard = document.querySelector('.analyzing-card');
    analyzingCard.style.opacity = '0';
    analyzingCard.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        analyzingCard.style.transition = 'all 0.6s ease';
        analyzingCard.style.opacity = '1';
        analyzingCard.style.transform = 'translateY(0)';
    }, 100);
    
    // 캐릭터 이미지 애니메이션
    const character = document.querySelector('.analyzing-character');
    character.style.transform = 'scale(0.8)';
    character.style.transition = 'transform 0.5s ease';
    
    setTimeout(() => {
        character.style.transform = 'scale(1)';
    }, 300);
    
    // 스토리 텍스트 순차 등장
    const storyTexts = document.querySelectorAll('.story-text');
    storyTexts.forEach((text, index) => {
        text.style.opacity = '0';
        text.style.transform = 'translateX(-20px)';
        text.style.transition = 'all 0.4s ease';
        
        setTimeout(() => {
            text.style.opacity = '1';
            text.style.transform = 'translateX(0)';
        }, 800 + (index * 200));
    });
    
    // AI 분석 수행 후 결과 페이지로 전환
    performAnalysis();
});

// AI 분석 수행
async function performAnalysis() {
    try {
        console.log('🔍 AI 분석 시작...');
        
        // 로컬 스토리지에서 사용자 데이터 가져오기
        const userData = JSON.parse(localStorage.getItem('userTestData') || '{}');
        console.log('📊 사용자 데이터:', userData);
        
        if (!userData.reasons || userData.reasons.length === 0) {
            console.log('⚠️ 사용자 데이터가 없습니다. 기본 결과로 전환합니다.');
            setTimeout(() => {
                window.location.href = 'result.html';
            }, 2000);
            return;
        }
        
        console.log('🤖 OpenAI API 호출 시작...');
        // OpenAI API 호출
        const analysisResult = await callOpenAIAnalysis(userData.reasons);
        console.log('✅ AI 분석 결과:', analysisResult);
        
        // 결과를 로컬 스토리지에 저장
        localStorage.setItem('analysisResult', analysisResult);
        console.log('💾 분석 결과 저장 완료');
        
        // 결과 페이지로 전환
        setTimeout(() => {
            window.location.href = 'result.html';
        }, 1000);
        
    } catch (error) {
        console.error('💥 분석 중 오류:', error);
        // 오류 발생 시에도 결과 페이지로 전환
        setTimeout(() => {
            window.location.href = 'result.html';
        }, 2000);
    }
}

// OpenAI API 호출
async function callOpenAIAnalysis(reasons) {
    console.log('🔑 API 키 로드 중...');
    
    // .env 파일에서 API 키 로드
    const envData = await loadEnvFile();
    const OPENAI_API_KEY = envData.OPENAI_API;
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
    
    console.log('🔑 API 키 상태:', OPENAI_API_KEY ? '✅ 로드됨' : '❌ 없음');
    
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API 키를 찾을 수 없습니다.');
    }
    
    const allReasons = reasons.map(reason => 
        `시나리오 ${reason.scenario}: 선택지 "${reason.choice}" - 이유: ${reason.reason}`
    ).join('\n');
    
    console.log('📝 분석할 사용자 답변:', allReasons);
    
    const messages = [
        {
            role: "system",
            content: `당신은 PM 전문가입니다. 사용자가 5개 시나리오에서 입력한 모든 답변을 종합하여 PM 유형을 분석해주세요.

다음 형식으로 응답해주세요:
PM유형: [유형명]
AI맞춤분석: [상세 분석 내용]
나만의강점: [강점 내용]
내가보완할부분: [보완점 내용]

한국어로 응답하고, 각 섹션은 명확하게 구분해주세요.`
        },
        {
            role: "user",
            content: `사용자가 입력한 모든 답변들:\n${allReasons}\n\n이 모든 답변을 종합하여 PM 유형을 분석해주세요.`
        }
    ];
    
    const requestBody = {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7
    };
    
    console.log('🚀 OpenAI API 요청 시작...');
    console.log('📡 요청 URL:', OPENAI_API_URL);
    
    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
    });
    
    console.log('📡 API 응답 상태:', response.status, response.statusText);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 호출 실패:', errorText);
        throw new Error(`API 호출 실패: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ API 응답 데이터:', data);
    
    return data.choices[0].message.content;
}

// 분석 진행률 표시 (선택사항)
function showProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = `
        <div class="progress-fill"></div>
    `;
    
    document.querySelector('.analyzing-section').appendChild(progressBar);
}
