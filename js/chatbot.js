// OpenAI API 설정
let OPENAI_API_KEY = null; // .env 파일에서 로드됨
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// DOM 요소들
let currentScenario = 1;
let userChoices = [];
let userReasons = []; // 사용자가 입력한 이유들을 저장

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    await loadAPIKey();
    initializeChatbot();
    setupEventListeners();
});

// API 키 로드
async function loadAPIKey() {
    try {
        const envVars = await window.loadEnvFile();
        OPENAI_API_KEY = envVars.OPENAI_API;
        
        if (OPENAI_API_KEY) {
            console.log('API 키 로드 성공:', OPENAI_API_KEY.substring(0, 10) + '...');
        } else {
            console.error('OPENAI_API 키를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('API 키 로드 실패:', error);
    }
}

// 챗봇 초기화
function initializeChatbot() {
    console.log('챗봇이 시작되었습니다.');
    
    if (!OPENAI_API_KEY) {
        console.error('API 키가 로드되지 않았습니다.');
        showAPIKeyError();
        return;
    }
    
    // 초기 시나리오 설정
    updateScenario();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 초기 선택 버튼들
    const choiceButtons = document.querySelectorAll('.choice-button');
    choiceButtons.forEach(button => {
        button.addEventListener('click', function() {
            handleInitialChoice(this);
        });
    });
    
    // 액션 버튼들
    const reasonInputBtn = document.getElementById('reasonInputBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitReason = document.getElementById('submitReason');
    
    if (reasonInputBtn) {
        reasonInputBtn.addEventListener('click', showReasonInput);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', proceedToNext);
    }
    
    if (submitReason) {
        submitReason.addEventListener('click', submitUserReason);
    }
    
    // 엔터키로 이유 제출
    const reasonInput = document.getElementById('reasonInput');
    if (reasonInput) {
        reasonInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitUserReason();
            }
        });
    }
}

// 초기 선택 처리 함수
function handleInitialChoice(button) {
    const choice = button.dataset.choice;
    const choiceText = button.textContent.trim();
    
    // 선택된 버튼 스타일 적용
    button.classList.add('selected');
    
    // 사용자 선택 저장
    userChoices.push({
        scenario: currentScenario,
        choice: choice,
        text: choiceText
    });
    
    console.log('사용자 선택:', choiceText);
    
    // 초기 선택 버튼들 숨기고 액션 버튼들 표시
    document.getElementById('initialChoices').style.display = 'none';
    document.getElementById('actionButtons').style.display = 'flex';
}

// 이유 입력 창 표시
function showReasonInput() {
    document.getElementById('actionButtons').style.display = 'none';
    document.getElementById('inputPrompt').style.display = 'block';
    
    // 입력 필드에 포커스
    setTimeout(() => {
        document.getElementById('reasonInput').focus();
    }, 100);
}

// 다음으로 진행
function proceedToNext() {
    // 다음 시나리오로 진행
    currentScenario++;
    updateScenario();
    
    // UI 초기화
    resetUI();
}

// 사용자 이유 제출
async function submitUserReason() {
    const reasonInput = document.getElementById('reasonInput');
    const reason = reasonInput.value.trim();
    
    if (!reason) {
        alert('이유를 입력해주세요.');
        return;
    }
    
    // 사용자 이유 저장
    userReasons.push({
        scenario: currentScenario,
        reason: reason,
        timestamp: new Date().toISOString()
    });
    
    console.log('사용자 입력 이유:', reason);
    
    // 로딩 표시
    showLoading();
    document.getElementById('inputPrompt').style.display = 'none';
    
    try {
        // OpenAI API로 이유 분석
        const analysis = await analyzeUserReason(reason);
        
        // 분석 결과 처리
        handleReasonAnalysis(analysis);
        
    } catch (error) {
        console.error('분석 오류:', error);
        showError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        hideLoading();
    }
}

// 사용자 이유 분석 함수
async function analyzeUserReason(reason) {
    const messages = [
        {
            role: "system",
            content: "당신은 PM 전문가입니다. 사용자가 제시한 문제 해결 이유를 분석하여 PM 유형을 파악하고, 개선점을 제안해주세요. 한국어로 응답하세요."
        },
        {
            role: "user",
            content: `사용자가 입력한 문제 해결 이유: "${reason}"\n\n이 이유를 바탕으로 PM 유형을 분석하고, 장단점과 개선 방향을 제시해주세요.`
        }
    ];
    
    const requestBody = {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 800,
        temperature: 0.7
    };
    
    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// OpenAI API 호출 함수
async function callOpenAI(userChoice) {
    const messages = [
        {
            role: "system",
            content: "당신은 PM 듬이의 조언자입니다. 사용자의 선택에 따라 다음 상황을 제시하고, PM으로서의 성장을 도와주세요. 한국어로 응답하세요."
        },
        {
            role: "user",
            content: `현재 상황: 회사 상품 매출 급감 문제 해결 중. 사용자 선택: ${userChoice}`
        }
    ];
    
    const requestBody = {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
    };
    
    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// AI 응답 처리
function handleAIResponse(response) {
    console.log('AI 응답:', response);
    
    // 다음 시나리오로 업데이트
    currentScenario++;
    updateScenario();
    
    // 새로운 선택지 생성 (실제로는 AI 응답에 따라 동적으로 생성)
    updateChoices();
}

// 시나리오 업데이트
function updateScenario() {
    const scenarios = [
        {
            title: "오마이갓! 아침부터..",
            description: "아침에 출근을 하니 우리 회사 상품의 매출이 급감했다는 보고를 받았다. 빠르게 해결하지 않으면 큰 손해를 입을 수도 있는 상황....! 문제의 이유를 어떻게 찾아볼까?"
        },
        {
            title: "좋은 접근이야!",
            description: "제품을 직접 사용해보니 몇 가지 문제점을 발견했다. 이제 이 문제들을 어떻게 해결할지 결정해야 한다. 어떤 방향으로 나아갈까?"
        },
        {
            title: "팀과의 협업",
            description: "개발팀과 디자인팀에게 문제점을 공유했다. 이제 함께 해결책을 찾아야 한다. 어떤 방식으로 팀을 이끌어갈까?"
        }
    ];
    
    if (currentScenario <= scenarios.length) {
        const scenario = scenarios[currentScenario - 1];
        document.querySelector('.scenario-title').textContent = scenario.title;
        document.querySelector('.scenario-description').textContent = scenario.description;
        
        // 진행 상황 업데이트
        updateProgress();
    } else {
        // 게임 종료
        showGameEnd();
    }
}

// 선택지 업데이트
function updateChoices() {
    const choiceSets = [
        [
            "최근 제품을 직접 써보면서 어디서 불편함이 느껴지는지 감을 잡아보자!",
            "고객 피드백 데이터를 분석해서 문제점을 찾아보자!"
        ],
        [
            "개발팀과 함께 기술적 해결책을 찾아보자!",
            "마케팅팀과 함께 고객 커뮤니케이션을 개선해보자!"
        ],
        [
            "사용자 테스트를 통해 개선점을 찾아보자!",
            "경쟁사 분석을 통해 차별화 포인트를 찾아보자!"
        ]
    ];
    
    if (currentScenario <= choiceSets.length) {
        const choices = choiceSets[currentScenario - 1];
        const choiceButtons = document.querySelectorAll('.choice-button');
        
        choiceButtons.forEach((button, index) => {
            button.textContent = choices[index] || "다음 단계로 진행";
            button.classList.remove('selected');
        });
    }
}

// 진행 상황 업데이트
function updateProgress() {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < currentScenario) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });
}

// 로딩 표시
function showLoading() {
    document.getElementById('loadingSection').style.display = 'block';
    document.querySelector('.choices-section').style.display = 'none';
}

// 로딩 숨김
function hideLoading() {
    document.getElementById('loadingSection').style.display = 'none';
    document.querySelector('.choices-section').style.display = 'flex';
}

// 에러 표시
function showError(message) {
    alert(message);
}

// 이유 분석 결과 처리
function handleReasonAnalysis(analysis) {
    console.log('PM 유형 분석 결과:', analysis);
    
    // 분석 결과를 시나리오에 표시
    const scenarioSection = document.querySelector('.scenario-section');
    scenarioSection.innerHTML = `
        <div class="analysis-result">
            <h3 class="analysis-title">🎯 PM 유형 분석 결과</h3>
            <div class="analysis-content">
                <p>${analysis}</p>
            </div>
            <div class="user-reasons-summary">
                <h4>📝 입력하신 이유들:</h4>
                <ul>
                    ${userReasons.map(reason => `<li>${reason.reason}</li>`).join('')}
                </ul>
            </div>
            <button onclick="proceedToNext()" class="action-button primary">다음 단계로</button>
        </div>
    `;
    
    // 다른 섹션들 숨기기
    document.querySelector('.character-section').style.display = 'none';
    document.querySelector('.choices-section').style.display = 'none';
    document.querySelector('.action-buttons-section').style.display = 'none';
}

// UI 초기화
function resetUI() {
    // 모든 섹션을 원래 상태로 복원
    document.getElementById('initialChoices').style.display = 'flex';
    document.getElementById('actionButtons').style.display = 'none';
    document.getElementById('inputPrompt').style.display = 'none';
    document.querySelector('.character-section').style.display = 'block';
    
    // 선택된 버튼 스타일 제거
    const selectedButtons = document.querySelectorAll('.choice-button.selected');
    selectedButtons.forEach(button => {
        button.classList.remove('selected');
    });
    
    // 입력 필드 초기화
    const reasonInput = document.getElementById('reasonInput');
    if (reasonInput) {
        reasonInput.value = '';
    }
}

// 게임 종료
function showGameEnd() {
    const scenarioSection = document.querySelector('.scenario-section');
    scenarioSection.innerHTML = `
        <div class="game-end">
            <h2>🎉 축하합니다!</h2>
            <p>PM 듬이의 하루를 성공적으로 완료했습니다!</p>
            <div class="final-summary">
                <h3>📊 최종 분석 결과</h3>
                <p>당신의 선택들:</p>
                <ul>
                    ${userChoices.map(choice => `<li>${choice.text}</li>`).join('')}
                </ul>
                <p>입력하신 이유들:</p>
                <ul>
                    ${userReasons.map(reason => `<li>${reason.reason}</li>`).join('')}
                </ul>
            </div>
            <button onclick="location.href='index.html'" class="start-button">다시 시작하기</button>
        </div>
    `;
    
    document.querySelector('.choices-section').style.display = 'none';
    document.querySelector('.action-buttons-section').style.display = 'none';
    document.querySelector('.character-section').style.display = 'none';
}

// API 키 에러 표시
function showAPIKeyError() {
    const scenarioSection = document.querySelector('.scenario-section');
    scenarioSection.innerHTML = `
        <div class="api-key-error">
            <h3>🔐 API 키 로드 실패</h3>
            <p>.env 파일에서 OPENAI_API 키를 찾을 수 없습니다.</p>
            <div class="error-steps">
                <h4>📋 확인사항:</h4>
                <ul>
                    <li>.env 파일이 프로젝트 루트에 있는지 확인</li>
                    <li>OPENAI_API=sk-... 형식으로 저장되어 있는지 확인</li>
                    <li>브라우저 개발자 도구 콘솔에서 오류 메시지 확인</li>
                </ul>
            </div>
            <button onclick="location.reload()" class="action-button primary">다시 시도</button>
            <button onclick="location.href='index.html'" class="action-button secondary">메인으로 돌아가기</button>
        </div>
    `;
    
    // 다른 섹션들 숨기기
    document.querySelector('.character-section').style.display = 'none';
    document.querySelector('.choices-section').style.display = 'none';
}

// API 키 검증
function validateAPIKey() {
    if (!OPENAI_API_KEY) {
        console.warn('OpenAI API 키가 로드되지 않았습니다!');
        return false;
    }
    return true;
}
