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
    
    // 이유가 없어도 진행 가능하도록 수정
    if (!reason) {
        console.log('이유 없이 진행');
        proceedToNext();
        return;
    }
    
    try {
        // 선택한 옵션과 문항 ID 가져오기
        const selectedChoice = userChoices[userChoices.length - 1];
        const selectedOption = selectedChoice.choice; // A 또는 B
        const questionId = `Q${currentScenario}`;
        
        console.log('🔍 통합 분석 시작:', { reason, selectedOption, questionId });
        
        // 통합 분석 호출
        const analysisResult = await analyzeUserReason(reason, selectedOption, questionId);
        console.log('🤖 통합 분석 결과:', analysisResult);
        
        // JSON 파싱
        let parsedResult;
        try {
            parsedResult = JSON.parse(analysisResult);
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
            return;
        }
        
        // 피드백 결과 검증
        if (parsedResult.feedback && parsedResult.feedback.decision === 'reject') {
            showValidationError(parsedResult.feedback.message);
            return;
        }
        
        // 통과된 경우 사용자 이유 저장
        userReasons.push({
            scenario: currentScenario,
            choice: selectedChoice.text,
            reason: reason,
            feedback: parsedResult.feedback,
            mapping: parsedResult.mapping,
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
        console.error('💥 통합 분석 중 오류:', error);
        alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 통합 피드백 및 매핑 시스템
async function analyzeUserReason(reason, selectedOption, questionId) {
    console.log('🔍 통합 분석 시작:', { reason, selectedOption, questionId });
    
    // 32가지 유형 매핑을 위한 패턴 생성
    const userChoices = JSON.parse(localStorage.getItem('userTestData') || '{}').choices || [];
    const pattern = userChoices.map(choice => choice.choice).join('');
    
    const messages = [
        {
            role: "system",
            content: `당신은 "피드백 생성 및 예외처리 + 32유형 매핑" 시스템입니다.

==============================
[0] 입력/출력 계약 (I/O Contract)
==============================
■ 입력(JSON):
- 다음 중 하나 이상을 포함할 수 있습니다.
  1) reason_input: 단일 문항(reason) 분석용
     {
       "question_id": "Q1"~"Q5",
       "selected_option": "A" | "B",
       "reason": "문자열"
     }
  2) selections 또는 pattern: 5문항 전체 선택 기반 32유형 매핑용
     - selections: {"Q1":"A|B","Q2":"A|B","Q3":"A|B","Q4":"A|B","Q5":"A|B"}
     - 또는 pattern: "AAAAA" ~ "BBBBB" (정확히 5자, 각 자리 A/B)

■ 출력(JSON):
{
  "feedback": null | { ...피드백 출력 스키마... },
  "mapping": null | {
    "pattern": "A/B 5자",
    "type_name": "매핑된 유형명",
    "type_index": 1~32 (선택사항),
    "details": {
      "short_intro": "...",
      "long_intro": "...",
      "strengths": ["..."],
      "areas_to_improve": ["..."],
      "best_match_pm": "...",
      "contrasting_pm": "..."
    }
  }
}

==============================
[1] 피드백 생성 및 예외처리 규칙
==============================

당신은 "피드백 생성 및 예외처리 시스템"입니다.  
입력은 다음 JSON 형식으로 주어집니다:

{
  "question_id": "Q1" ~ "Q5",
  "selected_option": "A" | "B",
  "reason": "문자열"
}

아래의 규칙을 순서대로 적용하세요.

-----------------------------------------
1️⃣ CLEANUP 단계
-----------------------------------------
- reason 문자열에서 특수문자, 이모티콘, 구두점(.,!?~@#$/%^&* 등)을 제거합니다.
- 연속된 공백은 하나로 축소합니다.
- 띄어쓰기, 맞춤법, 문법 오류는 무시합니다.
- 길이 계산 시 공백 제외 기준(length_no_space)을 사용합니다.

-----------------------------------------
2️⃣ EMPTY CHECK
-----------------------------------------
- length_no_space == 0 → reject("EMPTY", "답변이 입력되지 않았습니다. 다시 작성해주세요.")

-----------------------------------------
3️⃣ PROFANITY CHECK
-----------------------------------------
- 비속어나 모욕적 표현이 포함되면 → reject("PROFANITY", "부적절한 표현이 섞여있습니다. 다시 작성해주세요.")
- 금칙어 예시: 씨발, 시발, ㅆㅂ, 병신, ㅂㅅ, 개같, 좆, 존나, fuck, shit, bitch, asshole
- 대소문자, 특수기호, 띄어쓰기 섞여도 탐지합니다.

-----------------------------------------
4️⃣ LENGTH CHECK
-----------------------------------------
- 공백 제외 길이 < 5 또는 > 50 → reject("LENGTH", "답변의 길이가 부적절합니다. (5~50자)")

-----------------------------------------
5️⃣ 유의미도 점수 계산
-----------------------------------------
✅ 모든 검사를 통과했다면 아래 점수를 계산합니다.

초기값:
- semantic_relevance = 6.0
- specificity = 6.0
- expression_quality = 8.0

총합 계산:
총합 = 의미일치도*0.4 + 구체성*0.3 + 표현품질*0.3  
PASS 기준: 총합 ≥ 7.0

-----------------------------------------
6️⃣ 세부 점수 규칙
-----------------------------------------

🧩 의미일치도 (semantic_relevance)
- 직접 일치 단서 1개 이상 → +3.0
- 암시적 의미 단서 1개 이상 → +2.0
- 의사결정 표현(~하자/해야/먼저/진행) → +1.0
- 무관 단어(점심, 배고파, 날씨 등) 포함 시 → -3.0
- 0~10 사이로 클램프

암시 단서 예시:
- Q1-A: 직접, 써보, 느껴, 만져, 현장, 고객입장  
- Q1-B: 데이터, 수치, 지표, 로그, 분석, 패턴  
- Q2-A: 빨리, 서둘, 즉시, 먼저, 시간없, 급하, 빠르  
- Q2-B: 검증, 테스트, 브랜드, 품질, 리스크, 신중  
- Q3-A: 일정, 우선순위, 대안, 현실적, 계획  
- Q3-B: 협업, 공감, 소통, 조율, 배려  
- Q4-A: 목표, 조정, 재배분, 효율, 집중  
- Q4-B: 완성도, 지원, 도와, 케어, 품질우선  
- Q5-A: 성과, 지표, 유입, 성장, 매출, 퍼센트  
- Q5-B: 만족, 경험, 평가, 피드백, 충성, 사용자중심

🧩 구체성 (specificity)
- 행동/절차 단어: 하자, 한다, 진행, 분석, 정리 → +1.5  
- 대상/맥락 단서: 인물, 역할, 상황, 목표, 리스크 → +1.5  
- 도구/자료: 데이터, 로그, 인터뷰, 설문, 실험, 프로토타입 → +2.0  
- 논리 연결어: 왜냐하면, 그래서, 때문에, 즉, 결론적으로 → +1.0  
- 위 중 하나라도 있으면 최소 7.0으로 보정  
- 0~10 사이로 클램프

🧩 표현품질 (expression_quality)
- 기본값 8.0
- 길이(공백 제외) ≥ 10 → +1.0  
- 연결어(그래서/때문에/즉 등) 존재 → +1.0  
- 의미 불명확·무관 주제 → -3.0  
- 0~10 사이로 클램프

-----------------------------------------
7️⃣ 최종 판정
-----------------------------------------
- 총합 < 7 → reject("LOW_SIGNIFICANCE", "답변이 다소 모호합니다. 좀 더 구체적으로 작성해주세요.")
- 총합 ≥ 7 → pass

-----------------------------------------
8️⃣ 출력(JSON 형식)
-----------------------------------------
결과는 반드시 아래 형식으로 출력합니다.

{
  "decision": "pass" | "reject",
  "reject_reason": null | "EMPTY" | "PROFANITY" | "LENGTH" | "LOW_SIGNIFICANCE",
  "scores": {
    "semantic_relevance": 0~10,
    "specificity": 0~10,
    "expression_quality": 0~10,
    "weighted_total": 0~10
  },
  "message": "사용자에게 보여줄 피드백 문장",
  "outputs": {
    "summary": "40~60자 요약 문장",
    "strengths": ["40~60자 문장 최대 3개"],
    "areas_to_improve": ["40~60자 문장 최대 3개"]
  }
}

==============================
[2] 32유형 매핑 규칙
==============================
- pattern → analyzing.js 내 1:1 매핑 테이블에서 해당 유형을 조회
- 결과 객체는 아래 형태로 구성:
{
  "pattern": "ABBAB",
  "type_name": "예: 싹싹 김치 형",
  "details": {
    "short_intro": "...",
    "long_intro": "...",
    "strengths": ["...", "..."],
    "areas_to_improve": ["...", "..."],
    "best_match_pm": "...",
    "contrasting_pm": "..."
  }
}

==============================
[3] 최종 출력 포맷(반드시 준수)
==============================
- 항상 다음 최상위 JSON 키를 포함:
{
  "feedback": null | {...피드백 출력 스키마...},
  "mapping": null | {...매핑 출력 스키마...}
}
- 어느 한 쪽 입력이 없으면 해당 키에 null을 넣어 반환`
        },
        {
            role: "user",
            content: `{
  "reason_input": {
    "question_id": "${questionId}",
    "selected_option": "${selectedOption}",
    "reason": "${reason}"
  },
  "pattern": "${pattern}"
}`
        }
    ];
    
    const requestBody = {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 1500,
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
        model: "gpt-4",
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
        model: "gpt-4",
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

// 디버깅용 점수 계산 테스트 함수 (새로운 LLM-Judge 버전)
async function testScoring() {
    console.log('🧪 LLM-Judge 기반 하이브리드 점수 계산 테스트 시작');
    
    // 테스트 케이스 1: Q1-A 선택, 현장/고객입장 포함
    const testCase1 = {
        text: '현장에서 고객입장으로 결제까지 체험해 보겠습니다.',
        scenario: 1,
        selectedOption: 'A'
    };
    
    console.log('테스트 케이스 1:', testCase1);
    const result1 = await calculateMeaningfulnessScore(testCase1.text, testCase1.scenario, testCase1.selectedOption);
    console.log('테스트 케이스 1 결과:', result1);
    
    // 테스트 케이스 2: Q1-B 선택, 데이터/분석 포함
    const testCase2 = {
        text: '데이터를 분석해서 이탈 지점을 찾아보겠습니다.',
        scenario: 1,
        selectedOption: 'B'
    };
    
    console.log('테스트 케이스 2:', testCase2);
    const result2 = await calculateMeaningfulnessScore(testCase2.text, testCase2.scenario, testCase2.selectedOption);
    console.log('테스트 케이스 2 결과:', result2);
    
    // 테스트 케이스 3: 모호한 답변
    const testCase3 = {
        text: '그냥 해보자',
        scenario: 1,
        selectedOption: 'A'
    };
    
    console.log('테스트 케이스 3:', testCase3);
    const result3 = await calculateMeaningfulnessScore(testCase3.text, testCase3.scenario, testCase3.selectedOption);
    console.log('테스트 케이스 3 결과:', result3);
    
    // 테스트 케이스 4: 상충 단서 포함 (이제 감점 없음)
    const testCase4 = {
        text: '현장에서 고객입장으로 체험해보겠습니다.',
        scenario: 1,
        selectedOption: 'B' // B 선택했는데 A 단서 포함
    };
    
    console.log('테스트 케이스 4 (상충 단서 테스트):', testCase4);
    const result4 = await calculateMeaningfulnessScore(testCase4.text, testCase4.scenario, testCase4.selectedOption);
    console.log('테스트 케이스 4 결과:', result4);
    
    // 테스트 케이스 5: 부분 일치만 있는 경우
    const testCase5 = {
        text: '고객 관점에서 체험해보겠습니다.',
        scenario: 1,
        selectedOption: 'A' // A 선택, 부분 일치 단서만 포함
    };
    
    console.log('테스트 케이스 5 (부분 일치 테스트):', testCase5);
    const result5 = await calculateMeaningfulnessScore(testCase5.text, testCase5.scenario, testCase5.selectedOption);
    console.log('테스트 케이스 5 결과:', result5);
    
    console.log('🧪 LLM-Judge 기반 하이브리드 점수 계산 테스트 완료');
}

// 전역 함수로 등록 (브라우저 콘솔에서 호출 가능)
window.testScoring = testScoring;
