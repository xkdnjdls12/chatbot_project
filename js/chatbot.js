// OpenAI API 설정
let OPENAI_API_KEY = null; // .env 파일에서 로드됨
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
//테스트
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
    
    // 버튼들
    const submitReason = document.getElementById('submitReason');
    const backToActions = document.getElementById('backToActions');
    
    if (submitReason) {
        submitReason.addEventListener('click', submitUserReason);
    }
    
    if (backToActions) {
        backToActions.addEventListener('click', backToInitialChoices);
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
    
    // 선택한 선택지 텍스트를 프롬프트에 표시
    const promptText = document.querySelector('.prompt-text');
    if (promptText) {
        promptText.textContent = choiceText;
    }
    
    // 초기 선택 버튼들 숨기고 이유 입력 창 표시
    document.getElementById('initialChoices').style.display = 'none';
    document.getElementById('inputPrompt').style.display = 'block';
    
    // 입력 필드에 포커스
    setTimeout(() => {
        document.getElementById('reasonInput').focus();
    }, 100);
}

// 초기 선택으로 돌아가기
function backToInitialChoices() {
    // 마지막 선택을 취소
    if (userChoices.length > 0) {
        userChoices.pop();
        console.log('선택 취소됨. 남은 선택:', userChoices);
    }
    
    // 이유 입력 창 숨기기
    document.getElementById('inputPrompt').style.display = 'none';
    
    // 초기 선택 버튼들 다시 표시
    document.getElementById('initialChoices').style.display = 'flex';
    
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
    
    console.log('초기 선택으로 돌아가기');
}

// 다음으로 진행
function proceedToNext() {
    // "다음으로" 버튼 클릭 시 공백으로 처리
    userReasons.push({
        scenario: currentScenario,
        choice: userChoices[userChoices.length - 1].text,
        reason: '', // 공백 처리
        timestamp: new Date().toISOString()
    });
    
    console.log('다음으로 버튼 클릭 - 공백 처리됨');
    
    // 로컬 스토리지에 사용자 데이터 저장
    const userData = {
        choices: userChoices,
        reasons: userReasons,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('userTestData', JSON.stringify(userData));
    console.log('💾 사용자 데이터 저장 완료 (공백 포함):', userData);
    
    // 다음 시나리오로 진행
    currentScenario++;
    updateScenario();
    
    // UI 초기화
    resetUI();
}

// 검증 관련 함수들 제거 - 결과 페이지에서 통합 처리

// 사용자 이유 제출
function submitUserReason() {
    const reasonInput = document.getElementById('reasonInput');
    const reason = reasonInput.value.trim();
    
    // 선택한 옵션과 문항 ID 가져오기
    const selectedChoice = userChoices[userChoices.length - 1];
    
    // 사용자 이유 저장 (AI 분석 없이)
    userReasons.push({
        scenario: currentScenario,
        choice: selectedChoice.text,
        reason: reason || '', // 빈 문자열로 저장
        timestamp: new Date().toISOString()
    });
    
    console.log('✅ 사용자 이유 저장 완료:', userReasons[userReasons.length - 1]);
    
    // 로컬 스토리지에 사용자 데이터 저장
    const userData = {
        choices: userChoices,
        reasons: userReasons,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('userTestData', JSON.stringify(userData));
    console.log('💾 사용자 데이터 저장 완료:', userData);
    
    // 다음 시나리오로 진행
    proceedToNext();
}

// AI 분석 함수들 제거 - 결과 페이지에서 통합 분석

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
            title: "아침부터 큰일이 났다는 소식이...",
            description: "최근 밀크T 이용 학생 수가 갑자기 줄었다는 것이다.<br>듬이는 원인을 찾아야 한다!<br>어떻게 접근할까?",
            character: "char4.png"
        },
        {
            title: "다행히 원인을 찾아 빠르게 수정했다!",
            description: "이제는 새로 추가될 AI 추천 기능 회의 시간.<br>경쟁사보다 먼저 출시할지, 완성도를 높일지 고민된다.<br>어떤 전략이 맞을까?",
            character: "char5.png"
        },
        {
            title: "디자이너와 개발자가 또 부딪쳤다.",
            description: "\"애니메이션 효과를 더 넣자!\" vs \"지금 일정으론 힘들어요!\"<br>듬이는 둘 사이의 갈등을 해결해야 한다.<br>어떻게 말할까?",
            character: "char6.png"
        },
        {
            title: "어머나! 런칭 일정이 갑자기 일주일 빨라졌다.",
            description: "팀원들은 피곤해 보이고, 분위기가 가라앉았다.<br>듬이는 팀을 다시 힘내게 하고 싶다.<br>어떻게 이끌까?",
            character: "char7.png"
        },
        {
            title: "퇴근 직전, 부문장님이 듬이를 부르셨다.",
            description: "\"듬이 씨, 이번 밀크T 리뉴얼의 핵심 목표가 뭐죠?\"<br>갑작스러운 질문에 잠시 멈칫한다.<br>어떻게 답할까?",
            character: "char8.png"
        }
    ];
    
    if (currentScenario <= scenarios.length) {
        const scenario = scenarios[currentScenario - 1];
        document.querySelector('.scenario-title').textContent = scenario.title;
        document.querySelector('.scenario-description').innerHTML = scenario.description;
        
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
        // 모든 시나리오 완료 - 분석 중 화면으로 이동
        window.location.href = 'analyzing.html';
    }
}

// 선택지 업데이트
function updateChoices() {
    const choiceSets = [
        [
            "직접 밀크T를 써보며 불편한 점을 찾아보자.",
            "데이터로 어떤 단계에서 이탈이 생겼는지 확인하자."
        ],
        [
            "일단 빨리 내서 시장 반응을 먼저 보자.",
            "충분히 테스트해서 완성도를 높이자."
        ],
        [
            "\"일정 안에서 가능한 대안을 먼저 정리해봅시다.\"",
            "\"서로 입장에서 한 번 더 생각해보고 조율해봐요.\""
        ],
        [
            "\"지금이 승부처야. 일정 조정 없이 목표에 집중하자.\"",
            "\"일정은 내가 정리할게. 우린 흐트러지지 않게 차근히 가자.\""
        ],
        [
            "\"새로운 학습자 수를 10% 이상 늘리는 겁니다!\"",
            "\"학생 만족도를 80% 이상으로 올리는 게 목표입니다!\""
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
        '11:00 AM',
        '14:00 PM',
        '17:00 PM'
    ];
    
    if (currentScenario <= times.length) {
        timeElement.textContent = times[currentScenario - 1];
    }
}

// 진행 상황 업데이트
function updateProgress() {
    const segments = document.querySelectorAll('.progress-segment');
    
    // 세그먼트 상태 업데이트
    segments.forEach((segment, index) => {
        segment.classList.remove('completed', 'current');
        
        if (index < currentScenario - 1) {
            segment.classList.add('completed');
        } else if (index === currentScenario - 1) {
            segment.classList.add('current');
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
