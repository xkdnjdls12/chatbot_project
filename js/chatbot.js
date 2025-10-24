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
    // 선택한 선택지 텍스트 가져오기
    const selectedChoice = userChoices[userChoices.length - 1];
    const promptText = document.querySelector('.prompt-text');
    
    // 프롬프트 텍스트를 선택한 선택지로 업데이트
    if (promptText && selectedChoice) {
        promptText.textContent = selectedChoice.text;
    }
    
    document.getElementById('actionButtons').style.display = 'none';
    document.getElementById('inputPrompt').style.display = 'block';
    
    // 입력 필드에 포커스
    setTimeout(() => {
        document.getElementById('reasonInput').focus();
    }, 100);
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

// 욕설 및 비속어 검증
function containsInappropriateLanguage(text) {
    const inappropriateWords = [
        '존나', '개같이', '씨발', '좆', '병신', '미친', '빡쳐', '짜증', '개', '놈', '새끼',
        '바보', '멍청이', '등신', '꺼져', '닥쳐', '죽어', '빌어먹을', '지랄', '개소리'
    ];
    
    const lowerText = text.toLowerCase();
    return inappropriateWords.some(word => lowerText.includes(word));
}

// 유의미도 점수 계산
function calculateMeaningfulnessScore(text, scenario) {
    // 관련성 (40%)
    const relevanceScore = calculateRelevanceScore(text, scenario);
    
    // 구체성 (30%)
    const specificityScore = calculateSpecificityScore(text);
    
    // 일관성 (15%)
    const consistencyScore = calculateConsistencyScore(text);
    
    // 건전성 (15%)
    const healthinessScore = calculateHealthinessScore(text);
    
    const totalScore = (relevanceScore * 0.4) + (specificityScore * 0.3) + 
                      (consistencyScore * 0.15) + (healthinessScore * 0.15);
    
    console.log(`유의미도 점수: 관련성(${relevanceScore}) + 구체성(${specificityScore}) + 일관성(${consistencyScore}) + 건전성(${healthinessScore}) = ${totalScore.toFixed(2)}`);
    
    return totalScore;
}

// 관련성 점수 계산
function calculateRelevanceScore(text, scenario) {
    const scenarioKeywords = {
        1: ['문제', '해결', '분석', '데이터', '직접', '경험', '사용자', '제품', '매출', '이탈'],
        2: ['출시', '시장', '경쟁', '품질', '테스트', '브랜드', '완벽', '빠르게'],
        3: ['팀', '갈등', '의견', '조율', '소통', '협력', '입장', '차이'],
        4: ['목표', '일정', '업무', '완성도', '속도', '팀원', '분위기', '야근'],
        5: ['목표', '유저', '만족도', '성과', '가치', '사용자', '신규']
    };
    
    const keywords = scenarioKeywords[scenario] || [];
    const textLower = text.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => textLower.includes(keyword));
    
    return Math.min(10, (matchedKeywords.length / keywords.length) * 10);
}

// 구체성 점수 계산
function calculateSpecificityScore(text) {
    // 구체적인 행위, 대상, 도구 언급 여부
    const specificIndicators = [
        /\d+/, // 숫자
        /[가-힣]+(을|를|이|가|은|는)/, // 구체적 명사
        /(방법|과정|절차|단계|기술|도구|시스템)/, // 구체적 방법
        /(경험|경력|실무|프로젝트|팀|회사)/ // 구체적 경험
    ];
    
    const matches = specificIndicators.filter(pattern => pattern.test(text));
    return Math.min(10, (matches.length / specificIndicators.length) * 10);
}

// 일관성 점수 계산
function calculateConsistencyScore(text) {
    // 문법적 일관성과 문맥의 자연스러움
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    
    // 문장 길이의 적절성
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    const lengthScore = avgLength >= 5 && avgLength <= 30 ? 5 : 2;
    
    // 문법적 요소 (주어, 서술어 등)
    const grammarScore = text.includes('을') || text.includes('를') || text.includes('이') || text.includes('가') ? 5 : 2;
    
    return lengthScore + grammarScore;
}

// 건전성 점수 계산
function calculateHealthinessScore(text) {
    // 조롱, 스팸, 무관 주제 여부
    const spamIndicators = ['광고', '홍보', '구매', '할인', '이벤트', '추천', '링크', '사이트'];
    const irrelevantIndicators = ['점심', '저녁', '식사', '날씨', '여행', '영화', '음악', '게임'];
    
    const textLower = text.toLowerCase();
    const hasSpam = spamIndicators.some(indicator => textLower.includes(indicator));
    const hasIrrelevant = irrelevantIndicators.some(indicator => textLower.includes(indicator));
    
    if (hasSpam || hasIrrelevant) return 2;
    if (containsInappropriateLanguage(text)) return 0;
    
    return 10;
}

// 검증 에러 표시
function showValidationError(message) {
    // 기존 에러 메시지 제거
    const existingError = document.querySelector('.validation-error');
    if (existingError) {
        existingError.remove();
    }
    
    // 에러 메시지 생성
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.cssText = `
        background-color: #fee;
        border: 2px solid #fcc;
        border-radius: 8px;
        padding: 10px;
        margin: 10px 0;
        color: #c33;
        font-size: 14px;
        text-align: center;
        animation: shake 0.5s ease-in-out;
    `;
    errorDiv.textContent = message;
    
    // 입력 필드 위에 에러 메시지 삽입
    const inputContainer = document.querySelector('.input-container');
    inputContainer.parentNode.insertBefore(errorDiv, inputContainer);
    
    // 입력 필드 포커스 및 하이라이트
    const reasonInput = document.getElementById('reasonInput');
    reasonInput.style.borderColor = '#fcc';
    reasonInput.focus();
    
    // 3초 후 에러 메시지 자동 제거
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
        reasonInput.style.borderColor = '';
    }, 3000);
}

// 사용자 이유 제출
async function submitUserReason() {
    const reasonInput = document.getElementById('reasonInput');
    const reason = reasonInput.value.trim();
    
    if (!reason) {
        alert('이유를 입력해주세요.');
        return;
    }
    
    try {
        // 선택한 옵션과 문항 ID 가져오기
        const selectedChoice = userChoices[userChoices.length - 1];
        const selectedOption = selectedChoice.choice; // A 또는 B
        const questionId = `Q${currentScenario}`;
        
        console.log('🔍 이유 분석 시작:', { reason, selectedOption, questionId });
        
        // AI 분석 호출
        const analysisResult = await analyzeUserReason(reason, selectedOption, questionId);
        console.log('🤖 AI 분석 결과:', analysisResult);
        
        // JSON 파싱
        let parsedResult;
        try {
            parsedResult = JSON.parse(analysisResult);
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
            return;
        }
        
        // 분석 결과 검증
        if (parsedResult.decision === 'reject') {
            showValidationError(parsedResult.message);
            return;
        }
        
        // 통과된 경우 사용자 이유 저장
        userReasons.push({
            scenario: currentScenario,
            choice: selectedChoice.text,
            reason: reason,
            analysis: parsedResult.outputs,
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
        
        // 입력 프롬프트 숨기기
        document.getElementById('inputPrompt').style.display = 'none';
        
        // 다음 시나리오로 진행
        proceedToNext();
        
    } catch (error) {
        console.error('💥 이유 분석 중 오류:', error);
        alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 사용자 이유 분석 함수
async function analyzeUserReason(reason, selectedOption, questionId) {
    console.log('🔍 사용자 이유 분석 시작:', { reason, selectedOption, questionId });
    
    // 의미 그룹 정의
    const meaningGroups = {
        "Q1": {
            "A": ["직접 경험/체험", "사용자 입장", "감각적 관찰", "현장 확인"],
            "B": ["데이터/지표 기반", "정량 분석", "이탈 단계 파악", "원인 추적"]
        },
        "Q2": {
            "A": ["속도/실행/선점", "기회 창출", "불완전해도 빠른 출시"],
            "B": ["품질/완성도", "브랜드 이미지", "충분한 테스트/검증"]
        },
        "Q3": {
            "A": ["일정/현실적 대안", "우선순위", "실행 가능한 계획"],
            "B": ["공감/협업/조율", "관점 전환", "의견 차 좁히기"]
        },
        "Q4": {
            "A": ["목표 조정/재배분", "효율/집중", "현실적 리더십"],
            "B": ["완성도/지원", "팀 케어", "속도보다 품질"]
        },
        "Q5": {
            "A": ["성과/성장 지표", "신규 유입", "수치 목표"],
            "B": ["만족/경험", "사용자 중심", "품질·평가"]
        }
    };
    
    const messages = [
        {
            role: "system",
            content: `당신은 PM 전문가입니다. 사용자의 답변을 분석하여 예외처리 여부와 유의미도를 판정하고, 통과 시 PM 성향 분석을 제공하세요.

# 처리 순서
1) TRIM: reason 앞뒤 공백 제거, length_no_space = reason에서 모든 공백 제거한 길이
2) EMPTY CHECK: length_no_space == 0 → reject("EMPTY", "답변이 입력되지 않았습니다. 다시 작성해주세요.")
3) PROFANITY CHECK: 비속어/모욕 표현 포함 시 → reject("PROFANITY", "부적절한 표현이 섞여있습니다. 다시 작성해주세요.")
4) LENGTH CHECK: length_no_space < 5 or length_no_space > 50 → reject("LENGTH", "답변의 길이가 부적절합니다. 답변은 공백 제외 5~50글자 사이로 작성해주세요.")
5) SCORE: 의미일치도(0~10, w=0.4) + 구체성(0~10, w=0.3) + 표현품질(0~10, w=0.3) → weighted_total
6) DECIDE: weighted_total >= 7 → pass, else → reject("LOW_SIGNIFICANCE", "답변을 분석하지 못하였습니다. 다시 작성해주세요.")

# 점수 산식(느슨한 기준)
- weighted_total = semantic_relevance*0.4 + specificity*0.3 + expression_quality*0.3
- 초깃값: semantic_relevance = 6, specificity = 6, expression_quality = 7

# 의미일치도 판정
- 선택지의 핵심 의미 그룹과 reason의 맥락/의도가 유사하면 ≥7점 부여
- 키워드 일치가 없어도 "비슷한 뜻/상황/의도"면 가산
- 가산 규칙: +2(의미 그룹 직접 일치), +1~2(유사 표현/암시), +1(선택 방향 부합)

# 구체성 판정
- 행위/절차 언급, 대상/맥락, 근거/도구/자료, 예시/근거 신호 중 하나라도 포함되면 ≥7점
- 가산 규칙: +2(근거적 표현), +1~2(구체 행위/절차), +1(상황/맥락)

# 표현품질 판정
- 기본 7점(문법·띄어쓰기 오류·구어체 감점하지 않음)
- 가산: +1~2(논리적 연결어/결론), +1(방향 명확)
- 감점: -2~-5(의미 불명확/무관/난수/스팸)

# PASS 시 생성 규칙
- summary: 이유 텍스트에서 드러난 성향을 2~3문장 느낌으로 40~60자
- strengths: 긍정 신호를 1~3개, 각 40~60자
- areas_to_improve: 균형/보완 포인트 1~3개, 각 40~60자
- 어투: 제안형·중립형(비난 금지)

다음 형식으로 응답하세요:
{
  "decision": "pass | reject",
  "reject_reason": "null | EMPTY | PROFANITY | LENGTH | LOW_SIGNIFICANCE",
  "scores": {
    "semantic_relevance": "0~10",
    "specificity": "0~10", 
    "expression_quality": "0~10",
    "weighted_total": "0~10"
  },
  "message": "사용자에게 보여줄 1줄 피드백",
  "outputs": {
    "summary": "40~60자",
    "strengths": ["각 40~60자, 최대 3개"],
    "areas_to_improve": ["각 40~60자, 최대 3개"]
  }
}`
        },
        {
            role: "user",
            content: `사용자 답변: "${reason}"
선택한 옵션: ${selectedOption}
문항 ID: ${questionId}
의미 그룹: ${JSON.stringify(meaningGroups[questionId] || {})}

위 답변을 분석하여 예외처리 여부와 유의미도를 판정하고, 통과 시 PM 성향 분석을 제공하세요.`
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
            title: "이건 또 무슨일이야 ㅠㅠㅠㅠ",
            description: "회의를 마치고 돌아오니 사무실이 소란스럽다. 디자이너와 개발자가 애니메이션 기능을 두고 갈등 중이다. 당신이 입을 연다.",
            character: "char6.png"
        },
        {
            title: "시간이 없는데.. 어떡하지?",
            description: "어머나, 그런데 일정이 앞당겨졌다... 팀이 모두 지쳐 있는데 어떡하지..? 이번 주 야근만 세 번이에요... 드미는 팀의 분위기를 바꾸고 싶다. 지금 팀을 어떻게 이끌까?",
            character: "char7.png"
        },
        {
            title: "퇴근인데 왜 대표님이 날?",
            description: "팀 분위기가 한결 밝아졌다. 이대로 끝까지 가보자! 그런데 퇴근 직전, 대표님이 부르신다. \"듬이 씨, 이번 프로젝트의 목표는?\"",
            character: "char8.png"
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
        // 모든 시나리오 완료 - 분석 중 화면으로 이동
        window.location.href = 'analyzing.html';
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
            "\"일정 내 가능한 대안부터 우선순위화해서 정리해봅시다.\"",
            "\"한 팀인만큼 서로의 입장에서 한번 더 생각해보고 의견차이를 좁혀봅시다.\""
        ],
        [
            "\"목표를 80% 달성으로 조정하고 업무를 재배분합시다.\"",
            "\"속도보단 완성도를 봅시다. 제가 일정 정리 도와드릴게요.\""
        ],
        [
            "\"신규 유입유저가 10%를 넘을 수 있도록 하겠습니다!\"",
            "\"사용자 만족도가 80%를 넘을 수 있도록 하겠습니다!\""
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
