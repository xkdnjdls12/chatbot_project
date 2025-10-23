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
    
    // 입력 프롬프트 숨기기
    document.getElementById('inputPrompt').style.display = 'none';
    
    // 다음 시나리오로 진행
    proceedToNext();
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
            description: "아침에 출근을 하니 우리 회사 상품의 매출이 급감했다는 보고를 받았다. 빠르게 해결하지 않으면 큰 손해를 입을 수도 있는 상황....! 문제의 이유를 어떻게 찾아볼까?",
            character: "char4.png"
        },
        {
            title: "휴.. 급한 불은 껐다...",
            description: "다행히 빠르게 문제를 해결해 큰 손해는 막았다. 오전 10시 회의가 있었지? 얼른 가보자. 경쟁사도 같은 상품을 낸다는데, 어떻게 할까?",
            character: "char5.png"
        },
        {
            title: "회의실에서의 논의",
            description: "팀원들과 함께 회의를 진행하고 있다. 각자 다른 의견을 제시하고 있는데, 어떤 방향으로 결정을 내려야 할까?",
            character: "char4.png"
        },
        {
            title: "고객 피드백 수집",
            description: "실제 고객들의 의견을 들어보니 예상과 다른 반응들이 나오고 있다. 이 상황에서 어떻게 대응해야 할까?",
            character: "char5.png"
        },
        {
            title: "최종 결정의 순간",
            description: "모든 정보를 종합해보니 이제 최종 결정을 내려야 할 때다. 어떤 선택을 하면 좋을까?",
            character: "char4.png"
        }
    ];
    
    if (currentScenario <= scenarios.length) {
        const scenario = scenarios[currentScenario - 1];
        document.querySelector('.scenario-title').textContent = scenario.title;
        document.querySelector('.scenario-description').textContent = scenario.description;
        
        // 캐릭터 이미지 업데이트
        if (scenario.character) {
            document.querySelector('.character-image').src = `images/avatars/${scenario.character}`;
        }
        
        // 선택지 업데이트
        updateChoices();
        
        // 시간 업데이트
        updateTime();
        
        // 진행 상황 업데이트
        updateProgress();
    } else {
        // 모든 시나리오 완료 - 종합 분석
        showFinalAnalysis();
    }
}

// 선택지 업데이트
function updateChoices() {
    const choiceSets = [
        [
            "최근 제품을 직접 써보면서 어디서 불편함이 느껴지는지 감을 잡아보자!",
            "데이터를 먼저 확인해서 어떤 단계에서 이탈이 발생했는지 분석해보자!"
        ],
        [
            "시장을 빠르게 점유하는 것이 중요해! 완벽하지 않더라도 경쟁사보다 빠르게 출시해보자.",
            "출시만 서두르다 우리 브랜드 이미지가 떨어질 수도 있어. 충분한 테스트 후에 퀄리티 있는 상품으로 출시하는 것이 맞지."
        ],
        [
            "팀원들의 의견을 모두 들어보고 합의점을 찾아보자.",
            "빠른 결정이 필요하니 리더십을 발휘해서 방향을 제시하자."
        ],
        [
            "고객의 의견을 더 자세히 들어보고 개선점을 찾아보자.",
            "현재 상황을 정확히 파악하고 단계적으로 접근해보자."
        ],
        [
            "모든 정보를 종합해서 신중하게 결정하자.",
            "직감과 경험을 바탕으로 빠르게 결정하자."
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

// 시간 업데이트
function updateTime() {
    const timeElement = document.querySelector('.time');
    const times = [
        '09:00 AM',
        '09:55 AM',
        '10:30 AM',
        '11:15 AM',
        '12:00 PM'
    ];
    
    if (currentScenario <= times.length) {
        timeElement.textContent = times[currentScenario - 1];
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
// 종합 분석 화면
async function showFinalAnalysis() {
    const scenarioSection = document.querySelector('.scenario-section');
    scenarioSection.innerHTML = `
        <div class="final-analysis">
            <h3>🎯 PM 유형 분석 중...</h3>
            <p>모든 답변을 종합하여 분석하고 있습니다.</p>
            <div class="loading-spinner"></div>
        </div>
    `;
    
    // 다른 섹션들 숨기기
    document.querySelector('.choices-section').style.display = 'none';
    document.querySelector('.action-buttons-section').style.display = 'none';
    document.querySelector('.character-section').style.display = 'none';
    
    try {
        // 종합 분석 요청
        const analysis = await analyzeAllReasons();
        
        // 분석 결과 표시
        displayFinalAnalysis(analysis);
        
    } catch (error) {
        console.error('종합 분석 오류:', error);
        showAnalysisError();
    }
}

// 모든 이유 종합 분석
async function analyzeAllReasons() {
    const allReasons = userReasons.map(reason => 
        `시나리오 ${reason.scenario}: ${reason.reason}`
    ).join('\n');
    
    const messages = [
        {
            role: "system",
            content: "당신은 PM 전문가입니다. 사용자가 5개 시나리오에서 입력한 모든 답변을 종합하여 PM 유형을 분석하고, 장단점과 개선 방향을 제시해주세요. 한국어로 응답하세요."
        },
        {
            role: "user",
            content: `사용자가 입력한 모든 답변들:\n${allReasons}\n\n이 모든 답변을 종합하여 PM 유형을 분석하고, 장단점과 개선 방향을 제시해주세요.`
        }
    ];
    
    const requestBody = {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 1000,
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

// 최종 분석 결과 표시
function displayFinalAnalysis(analysis) {
    const scenarioSection = document.querySelector('.scenario-section');
    scenarioSection.innerHTML = `
        <div class="final-analysis-result">
            <h3>🎯 PM 유형 분석 결과</h3>
            <div class="analysis-content">
                ${analysis}
            </div>
            <div class="user-reasons-summary">
                <h4>📝 입력한 답변들:</h4>
                <ul>
                    ${userReasons.map((reason, index) => 
                        `<li><strong>시나리오 ${reason.scenario}:</strong> ${reason.reason}</li>`
                    ).join('')}
                </ul>
            </div>
            <button onclick="location.href='index.html'" class="action-button primary">메인으로 돌아가기</button>
        </div>
    `;
}

// 분석 오류 표시
function showAnalysisError() {
    const scenarioSection = document.querySelector('.scenario-section');
    scenarioSection.innerHTML = `
        <div class="analysis-error">
            <h3>❌ 분석 오류</h3>
            <p>분석 중 오류가 발생했습니다. 다시 시도해주세요.</p>
            <button onclick="location.reload()" class="action-button primary">다시 시도</button>
            <button onclick="location.href='index.html'" class="action-button secondary">메인으로 돌아가기</button>
        </div>
    `;
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
