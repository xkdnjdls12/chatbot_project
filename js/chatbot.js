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

// 욕설 및 비속어 검증 (개선안 v1.2 + Whitelist 오탐 방지)
function containsInappropriateLanguage(text) {
    // 정규식 패턴: 단어 경계 기반 탐지로 일반 단어 내부 부분 일치 오탐 방지
    // 플래그: i (대소문자 무시), u (유니코드)
    const profanityPattern = /(?<![가-힣A-Za-z])(씨\s발|시\s발|ㅆ\sㅂ|병\s신|ㅂ\sㅅ|개\s같|좆|존\s*나|fuck|shit|bitch|asshole)(?![가-힣A-Za-z])/iu;
    
    // Whitelist (오탐 방지용 일반 단어들)
    const whitelistWords = ["현황","도출","개선","파악","결정","출시","분석","검토","측정","도전","기능","제품","서비스","사용자","시장","점유"];
    
    // 1) reason_original에 대해 위 정규식으로 1차 검사
    const hasProfanityMatch = profanityPattern.test(text);
    
    if (!hasProfanityMatch) {
        return false; // 금칙어 패턴이 없으면 통과
    }
    
    // 2) 매칭되면 Whitelist 단어 포함 여부 확인
    const hasWhitelistWord = whitelistWords.some(word => text.includes(word));
    
    if (hasWhitelistWord) {
        console.log('🛡️ PROFANITY Whitelist 적용: 일반 단어 포함으로 오탐 방지');
        return false; // 오탐 가능성 → PROFANITY 미적용(통과)
    }
    
    // 포함 X → PROFANITY 적용(reject)
    console.log('🚫 PROFANITY 탐지: 금칙어 패턴 발견');
    return true;
}

// 유의미도 점수 계산 (강화형 하이브리드 채점 시스템) - 새로운 LLM-Judge 형식
async function calculateMeaningfulnessScore(text, scenario, selectedOption) {
    const questionId = `Q${scenario}`;
    
    try {
        // 1. LLM-Judge 방식으로 의미 기반 점수 계산 (핵심)
        const judgeResult = await calculateSemanticModel(text, questionId, selectedOption);
        const semanticModel = judgeResult.semantic_relevance;
        const judgeConfidence = judgeResult.confidence;
        const judgeRationale = judgeResult.rationale;
        
        // 2. 규칙 기반 보정값 계산 (rule_adjustment)
        const ruleAdjustment = calculateRuleAdjustment(text, scenario, selectedOption);
        
        // 3. LLM 중심 하이브리드 결합: LLM 80% + 규칙 보정 20%
        const semanticRelevance = Math.max(0, Math.min(10, (semanticModel * 0.8) + (ruleAdjustment * 0.2)));
        
        // 4. 구체성과 표현품질은 기존 로직 유지
        const specificity = calculateSpecificity(text, scenario, selectedOption);
        const expressionQuality = calculateExpressionQuality(text, scenario, selectedOption);
        
        // 의미-형식 연동 보정 (semantic safeguard)
        let adjustedSpecificity = specificity;
        let adjustedExpressionQuality = expressionQuality;
        
        if (semanticRelevance >= 7.0) {
            adjustedSpecificity = Math.max(specificity, 6.0);         // 구체성 하한 보정
            adjustedExpressionQuality = Math.max(expressionQuality, 5.5); // 표현품질 최소 보정
            console.log(`🛡️ 의미-형식 연동 보정 적용: semantic_relevance=${semanticRelevance.toFixed(2)}`);
            console.log(`  - 구체성: ${specificity.toFixed(2)} → ${adjustedSpecificity.toFixed(2)}`);
            console.log(`  - 표현품질: ${expressionQuality.toFixed(2)} → ${adjustedExpressionQuality.toFixed(2)}`);
        }
        
        // 5. 최종 가중합 계산 (보정된 값 사용)
        const weightedTotal = (semanticRelevance * 0.6) + (adjustedSpecificity * 0.25) + (adjustedExpressionQuality * 0.15);
        
        // 6. 최종 판정 (PASS 기준: 5.8)
        const decision = weightedTotal < 5.8 ? 'reject' : 'pass';
        
        console.log(`🎯 하이브리드 채점 결과:`);
        console.log(`  - semantic_model: ${semanticModel.toFixed(2)} (80%)`);
        console.log(`  - rule_adjustment: ${ruleAdjustment.toFixed(2)} (20%)`);
        console.log(`  - 결합된 semantic_relevance: ${semanticRelevance.toFixed(2)}`);
        console.log(`  - specificity: ${adjustedSpecificity.toFixed(2)}`);
        console.log(`  - expression_quality: ${adjustedExpressionQuality.toFixed(2)}`);
        console.log(`  - weighted_total: ${weightedTotal.toFixed(2)}`);
        console.log(`  - decision: ${decision}`);
        console.log(`  - judge_confidence: ${judgeConfidence.toFixed(2)}`);
        console.log(`  - judge_rationale: "${judgeRationale}"`);
        
        return {
            weightedTotal,
            decision,
            scores: {
                semantic_model: semanticModel,
                rule_adjustment: ruleAdjustment,
                semantic_relevance: semanticRelevance,
                specificity: adjustedSpecificity,
                expression_quality: adjustedExpressionQuality,
                weighted_total: weightedTotal
            },
            judge_confidence: judgeConfidence,
            judge_rationale: judgeRationale
        };
        
    } catch (error) {
        console.error('하이브리드 채점 오류:', error);
        
        // 오류 시 기존 방식으로 폴백
        console.log('⚠️ 폴백: 기존 키워드 기반 채점 사용');
        const semanticRelevance = calculateRuleAdjustment(text, scenario, selectedOption) + 3.0; // 기본값 3.0 추가
        const specificity = calculateSpecificity(text, scenario, selectedOption);
        const expressionQuality = calculateExpressionQuality(text, scenario, selectedOption);
        
        // 의미-형식 연동 보정 (폴백 모드에서도 적용)
        let adjustedSpecificity = specificity;
        let adjustedExpressionQuality = expressionQuality;
        
        if (semanticRelevance >= 7.0) {
            adjustedSpecificity = Math.max(specificity, 6.0);
            adjustedExpressionQuality = Math.max(expressionQuality, 5.5);
            console.log(`🛡️ 폴백 모드 의미-형식 연동 보정 적용: semantic_relevance=${semanticRelevance.toFixed(2)}`);
        }
        
        const weightedTotal = (semanticRelevance * 0.6) + (adjustedSpecificity * 0.25) + (adjustedExpressionQuality * 0.15);
        const decision = weightedTotal < 5.8 ? 'reject' : 'pass';
        
        console.log(`유의미도 점수 (폴백): 의미일치도(${semanticRelevance.toFixed(2)}) + 구체성(${specificity.toFixed(2)}) + 표현품질(${expressionQuality.toFixed(2)}) = ${weightedTotal.toFixed(2)}`);
        
        return {
            weightedTotal,
            decision,
            scores: {
                semantic_model: 4.0,
                rule_adjustment: semanticRelevance - 3.0,
                semantic_relevance: semanticRelevance,
                specificity: adjustedSpecificity,
                expression_quality: adjustedExpressionQuality,
                weighted_total: weightedTotal
            },
            judge_confidence: 0.3,
            judge_rationale: "폴백 모드"
        };
    }
}

// 의도 프리셋(Intent Presets) 정의 - 상세한 문장 형식
const INTENT_PRESETS = {
    "Q1": {
        "A": {
            "target": [
                "직접 사용하거나 체험을 통해 문제를 탐색한다",
                "사용자 입장에서 제품을 경험하고 불편 지점을 찾는다",
                "현장 중심 관찰을 통해 인사이트를 얻는다",
                "직접 만져보며 개선 아이디어를 도출한다",
                "실사용 경험을 바탕으로 감각적으로 판단한다",
                "고객/유저 입장에서 흐름을 재현하고 느낀다",
                "고객 입장에서 한번 써볼게요",
                "직접 해보면 뭐가 불편한지 알 것 같아요",
                "제가 써보면서 감을 잡아볼게요",
                "일단 써보고 느낌을 정리하겠습니다",
                "유저 입장에서 생각해볼게요"
            ],
            "opposite": [
                "데이터나 로그 기반으로 분석한다",
                "수치적 지표로 문제를 판단한다",
                "정량적 근거를 바탕으로 가설을 검증한다",
                "퍼널 분석을 통해 원인을 찾는다"
            ]
        },
        "B": {
            "target": [
                "데이터나 로그를 기반으로 문제의 원인을 분석한다",
                "수치 지표를 비교하여 이상 패턴을 찾는다",
                "정량적 근거를 통해 개선 방향을 도출한다",
                "이탈 단계나 퍼널 전환율을 분석한다",
                "지표 변화를 모니터링해 가설을 검증한다"
            ],
            "opposite": [
                "직접 체험을 통해 감각적으로 문제를 찾는다",
                "사용자 입장에서 흐름을 느끼고 판단한다"
            ]
        }
    },
    "Q2": {
        "A": {
            "target": [
                "속도와 시장 선점을 중시한다",
                "경쟁사보다 빠르게 출시하는 것을 목표로 한다",
                "완벽하지 않아도 먼저 내어보고 개선한다",
                "빠른 학습 루프와 즉시 행동을 선호한다",
                "MVP나 최소 기능으로 빠르게 시장 반응을 본다",
                "시장 점유나 선점 이익을 전략적으로 고려한다",
                "경쟁사보다 먼저 내야 해요",
                "완벽하진 않아도 빨리 내는 게 중요하죠",
                "일단 만들어서 반응 보자",
                "시간 없으니까 빠르게 진행해야죠",
                "먼저 시작하는 게 유리해요"
            ],
            "opposite": [
                "충분한 검증과 테스트 후 출시한다",
                "완성도와 브랜드 신뢰를 우선한다",
                "품질 리스크를 최소화하려 신중히 접근한다"
            ]
        },
        "B": {
            "target": [
                "충분한 검증과 테스트를 거쳐 출시한다",
                "브랜드 이미지와 품질을 최우선으로 한다",
                "리스크를 줄이고 안정적인 결과를 추구한다",
                "신중한 검토와 QA를 통해 완성도를 높인다",
                "빠른 출시보다 품질 확보를 더 중요하게 본다"
            ],
            "opposite": [
                "경쟁사보다 빠른 출시를 추구한다",
                "속도와 선점을 우선시한다"
            ]
        }
    },
    "Q3": {
        "A": {
            "target": [
                "일정을 고려하여 우선순위를 조정한다",
                "현실적인 계획과 대안을 제시한다",
                "영향도와 난이도를 비교해 결정한다",
                "효율적으로 리소스를 배분한다",
                "문제 상황을 구조적으로 정리한다",
                "중요한 것부터 처리할게요",
                "할 수 있는 것부터 하겠습니다",
                "일정 안에 가능한 것만 우선하죠",
                "급한 순서대로 하겠습니다",
                "우선순위대로 정리할게요"
            ],
            "opposite": [
                "공감과 대화를 통해 조율한다",
                "팀원 간 협업과 합의를 중시한다"
            ]
        },
        "B": {
            "target": [
                "팀원 간 공감과 대화를 중시한다",
                "서로의 입장을 이해하고 조율한다",
                "협업과 합의를 통해 문제를 해결한다",
                "감정적 배려를 통해 갈등을 완화한다",
                "팀워크 중심으로 의사결정을 이끈다"
            ],
            "opposite": [
                "일정과 우선순위를 계산적으로 조정한다",
                "효율을 기준으로 판단한다"
            ]
        }
    },
    "Q4": {
        "A": {
            "target": [
                "목표를 조정하거나 범위를 축소해 효율을 높인다",
                "업무를 재배분해 속도를 확보한다",
                "핵심 목표에 집중해 추진력을 높인다",
                "리소스를 최적화하여 일정을 맞춘다",
                "불필요한 작업을 줄여 효율을 극대화한다",
                "목표 좀 줄이고 가능한 만큼 하죠",
                "일정 맞추려면 핵심만 남겨야 해요",
                "할 일 나눠서 빠르게 처리합시다",
                "지금 리소스로 할 수 있는 만큼 하죠",
                "중요한 부분만 먼저 끝내겠습니다"
            ],
            "opposite": [
                "완성도와 팀 지원을 중시한다",
                "속도보다 품질과 케어를 우선한다"
            ]
        },
        "B": {
            "target": [
                "완성도와 품질 유지를 최우선으로 한다",
                "팀의 상태를 살피며 지원한다",
                "도움을 제공하고 케어를 강화한다",
                "병목을 해소하며 일정 정리를 돕는다",
                "속도보다 안정적 마감을 중시한다"
            ],
            "opposite": [
                "목표를 조정해 효율을 높인다",
                "업무를 재배분해 속도를 확보한다"
            ]
        }
    },
    "Q5": {
        "A": {
            "target": [
                "성과와 성장 지표를 설정하고 관리한다",
                "신규 유입과 전환율 향상을 목표로 한다",
                "매출과 KPI 성과를 중심으로 판단한다",
                "지표 기반으로 성장을 측정한다",
                "데이터로 성과를 추적하고 보고한다",
                "성과를 좀 내봐야죠",
                "유입이나 매출을 늘려야겠어요",
                "지표로 확인해볼게요",
                "결과를 수치로 보고 싶어요",
                "이번엔 수치로 성장 보여줄게요"
            ],
            "opposite": [
                "사용자 만족과 경험 품질을 중시한다",
                "피드백과 평가를 중심으로 개선한다"
            ]
        },
        "B": {
            "target": [
                "사용자 만족과 경험 품질을 중시한다",
                "피드백과 평가 결과를 반영한다",
                "고객 충성도와 감정적 만족을 높인다",
                "사용자 중심으로 서비스 품질을 개선한다",
                "경험 데이터를 기반으로 개선한다"
            ],
            "opposite": [
                "성과나 매출 지표 중심으로 판단한다",
                "유입/전환율 등 성장 수치를 우선한다"
            ]
        }
    }
};

// 시나리오 짧은 설명 함수
function getScenarioShort(questionId) {
    const scenarios = {
        'Q1': "회사 상품 매출 급감 문제 해결 방법 선택",
        'Q2': "경쟁사 대응을 위한 출시 전략 결정", 
        'Q3': "팀 내 갈등 상황에서의 중재 방식",
        'Q4': "일정 압박 상황에서의 리더십 스타일",
        'Q5': "프로젝트 목표 지표 설정 방향"
    };
    return scenarios[questionId] || "PM 의사결정 시나리오";
}

// 의도 프리셋에서 타겟과 반대 의도 추출 함수
function getIntents(question_id, selected_option) {
    const set = INTENT_PRESETS[question_id][selected_option];
    return { target_bullets: set.target, opposite_bullets: set.opposite };
}

// LLM-Judge 프롬프트 문자열 생성 함수
function buildJudgePrompt({question_id, selected_option, scenario_short, reason}) {
    const { target_bullets, opposite_bullets } = getIntents(question_id, selected_option);
    return `
[Role]
You are a strict LLM judge that scores how well a user's short reason matches a target product-management intent.

[Task]
Return a strict JSON only (no prose), scoring 0–10 by meaning (not keywords).

[Context]
- Question ID: ${question_id}
- Selected Option: ${selected_option}
- Scenario (one line): ${scenario_short}

- Target intent (bullets, 3–5):
${target_bullets.map(b=>"- "+b).join("\n")}

- Opposite intent (bullets, 2–4) — for contrast only:
${opposite_bullets.map(b=>"- "+b).join("\n")}

[User Reason]
"${reason}"

[Scoring Rubric]
- 8–10: Clearly matches target intent with concrete alignment (actions, purpose, logic).
- 5–7 : Partially matches; intent is present but incomplete or generic.
- 3–4 : Weakly related; vague or tangential.
- 0–2 : Misaligned or off-topic.
- Synonymous expressions like "competitor first", "faster than others", "market advantage" should receive full credit if they express the target intent.
- 일상적 표현(예: '먼저 할게요', '중요한 것부터 해볼게요', '팀이 피곤하니까 쉬면서 하자', '고객 입장에서 한번 써볼게요')이라도, 핵심 의도(Qx-A/B)의 방향과 일치하면 7점 이상으로 평가하라.

[Output JSON Schema]
{
  "semantic_relevance": <float 0..10>,  // one decimal
  "confidence": <float 0..1>,           // judge's confidence
  "rationale": "<max 1 short sentence>"
}

[Constraints]
- Do not rely on specific keywords; evaluate intent, behavior, purpose, logic.
- Return valid JSON only. No extra text.
`.trim();
}

// LLM-Judge 방식으로 의미 기반 점수 계산 (0~10)
async function calculateSemanticModel(reason, questionId, selectedOption) {
    try {
        const scenarioShort = getScenarioShort(questionId);
        const prompt = buildJudgePrompt({
            question_id: questionId,
            selected_option: selectedOption,
            scenario_short: scenarioShort,
            reason: reason
        });
        
        const response = await callOpenAIForScoring(prompt);
        
        // JSON 파싱 시도
        let result;
        try {
            result = JSON.parse(response.trim());
        } catch (parseError) {
            console.warn('JSON 파싱 실패, 재시도:', parseError);
            // 1회 재시도
            const retryResponse = await callOpenAIForScoring(prompt);
            try {
                result = JSON.parse(retryResponse.trim());
            } catch (retryError) {
                console.error('재시도도 실패, 보수적 처리:', retryError);
                return { semantic_relevance: 4.0, confidence: 0.3, rationale: "JSON 파싱 실패" };
            }
        }
        
        // 유효성 검증
        if (!result.semantic_relevance || isNaN(result.semantic_relevance) || 
            result.semantic_relevance < 0 || result.semantic_relevance > 10) {
            console.warn(`유효하지 않은 점수: ${result.semantic_relevance}, 보수적 처리`);
            return { semantic_relevance: 4.0, confidence: 0.3, rationale: "유효하지 않은 점수" };
        }
        
        // 의미판단 보정 (LLM 레벨)
        let correctedScore = result.semantic_relevance;
        const rationale = result.rationale || "";
        
        // LLM이 rationale에서 "의도에 부합" 또는 "aligned with intent"로 서술한 경우 자동 보정
        if (rationale.includes("의도에 부합") || rationale.includes("aligned with intent") || 
            rationale.includes("intent") || rationale.includes("부합")) {
            correctedScore = Math.max(correctedScore, 7.0);
            console.log(`🎯 LLM rationale 기반 자동 보정: ${result.semantic_relevance} → ${correctedScore}`);
        }
        
        // 중립형이지만 선택지 의도와 논리적 근거 방향이 같은 경우 보정
        const intentAlignmentKeywords = {
            'Q2': { 'B': ['리스크', '브랜드', '품질', '검증', '이미지', '평판', '신뢰도'] },
            'Q5': { 'B': ['만족', '경험', '피드백', '충성', '추천', '입소문', '지속이용', '사용자 중심'] },
            'Q3': { 'B': ['협업', '공감', '소통', '조율', '배려', '서로', '이해', '의견교환', '대화'] }
        };
        
        const keywords = intentAlignmentKeywords[questionId]?.[selectedOption] || [];
        const hasIntentAlignment = keywords.some(keyword => reason.toLowerCase().includes(keyword));
        
        if (hasIntentAlignment && correctedScore < 7.0) {
            correctedScore = Math.max(correctedScore, 7.0);
            console.log(`🎯 의도 정렬 키워드 기반 보정: ${result.semantic_relevance} → ${correctedScore}`);
        }
        
        console.log(`🤖 LLM-Judge 결과 (보정 후):`, { 
            ...result, 
            semantic_relevance: correctedScore,
            original_score: result.semantic_relevance 
        });
        
        return { 
            ...result, 
            semantic_relevance: correctedScore 
        };
        
    } catch (error) {
        console.error('LLM-Judge 점수 계산 오류:', error);
        return { semantic_relevance: 4.0, confidence: 0.3, rationale: "API 오류" };
    }
}

// OpenAI API 호출 함수 (점수 계산용) - gpt-3.5-turbo 사용
async function callOpenAIForScoring(prompt) {
    const messages = [
        {
            role: "system",
            content: "당신은 답변의 의미적 적합성을 평가하는 전문가입니다. 주어진 의도 축들을 기준으로 답변의 적합성을 0~10점으로 정확하게 평가해주세요."
        },
        {
            role: "user",
            content: prompt
        }
    ];
    
    const requestBody = {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 100,
        temperature: 0 // 완전히 일관된 점수 산출
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

// 동의어 사전 및 중립 단어 정의
const SYNONYM_LEXICON = {
    "직접": ["직접","바로","몸소","hands-on","핸즈온"],
    "써보": ["써보","써 본","사용해보","사용해 본","try","trial","테스트 사용"],
    "느껴": ["느껴","체감","감지","직감","피감"],
    "만져": ["만져","손으로","직접 다뤄","다뤄 보"],
    "현장": ["현장","실전","실사용","실환경","real world","real-life"],
    "고객입장": ["고객입장","사용자입장","유저입장","고객 관점","사용자 관점","유저 관점","user perspective"],

    "데이터": ["데이터","data","데이타"], "수치": ["수치","숫자","정량","수치화","metrics"],
    "지표": ["지표","KPI","메트릭","지표값"], "로그": ["로그","log","event log","이벤트 로그","분석 로그"],
    "분석": ["분석","해석","분해","분석적","analytics"], "패턴": ["패턴","경향","트렌드","추세","pattern"],
    "퍼널": ["퍼널","funnel","전환 깔때기","유입-전환"], "전환율": ["전환율","CVR","conversion rate"],

    "빠르": ["빠르","빨리","즉시","신속","speedy","fast"],
    "서둘": ["서둘","서둘러","서두르"],
    "먼저": ["먼저","선점","우선 출시","first mover","first-to-market"],
    "시장선점": ["시장 선점","시장 점유","점유","먼저 먹","선점 효과","market lead","market advantage"],
    "선점": ["선점","시장선점","시장","시장 점유","점유","시장 점유율"],
    "경쟁사대비": ["경쟁사보다","경쟁사 대비","먼저 내","빠르게 출시"],
    "브랜드인지도": ["브랜드 인지도","인지도","first mover","first-to-market","market advantage","market dominance"],
    "MVP": ["MVP","최소기능","min viable","스몰 런칭","라이트 출시"],
    "학습루프": ["학습 루프","빠른 피드백","iterative","iteration","반복 개선"],

    "검증": ["검증","validate","밸리데이션","검토","체크"],
    "테스트": ["테스트","QA","품질 테스트","QA 테스트","테스팅"],
    "브랜드": ["브랜드","brand","브랜드 이미지","브랜드 신뢰"],
    "품질": ["품질","퀄리티","완성도","quality","완성"],
    "리스크": ["리스크","위험","risk","부작용","리스크 관리"],
    "신중": ["신중","보수적","조심스럽","careful","conservative"],

    "일정": ["일정","타임라인","스케줄","schedule","timing","계획"],
    "우선순위": ["우선순위","priority","프라이오리티","선정"],
    "대안": ["대안","옵션","대체안","방안"],
    "현실적": ["현실적","실현 가능","feasible","실행 가능","실제"],
    "계획": ["계획","플랜","plan","로드맵","roadmap"],
    "영향도난이도": ["영향도","난이도","임팩트","코스트","impact effort"],

    "협업": ["협업","콜라보","co-work","협치"],
    "공감": ["공감","empathy","이해","감정 이입"],
    "소통": ["소통","커뮤니케이션","대화","커뮤"],
    "조율": ["조율","합의","align","alignment","컨센서스"],
    "배려": ["배려","케어","consideration","상대 입장"],

    "목표": ["목표","타깃","goal","objective"],
    "조정": ["조정","스코프 조정","범위 축소","scope down","trim"],
    "재배분": ["재배분","리소스 재할당","resource reallocation","분담 조정"],
    "효율": ["효율","효율화","효율적","효율성","efficiency"],
    "집중": ["집중","focus","핵심 우선","핵심 선택"],

    "완성도": ["완성도","완성","완결성","quality bar","퀄리티 바"],
    "지원": ["지원","서포트","support","백업"],
    "도와": ["도와","도움","헬프","help"],
    "케어": ["케어","돌봄","챙김","care"],
    "품질우선": ["품질 우선","quality first","완성 우선","안정 우선"],

    "성과": ["성과","performance","result","성과지표"],
    "유입": ["유입","acquisition","inflow"],
    "성장": ["성장","growth","스케일","scale"],
    "매출": ["매출","revenue","수익","GMV"],
    "퍼센트": ["퍼센트","%","percent","비율","율","증가율"],
    "KPI": ["KPI","핵심 지표","핵심성과"],

    "만족": ["만족","만족도","satisfaction","happy","만족감"],
    "경험": ["경험","UX","사용경험","사용자 경험","경험 품질"],
    "평가": ["평가","평가점수","점수","rating"],
    "피드백": ["피드백","feedback","후기","리뷰"],
    "충성": ["충성","충성도","LTV","재방문","retention"],
    "사용자중심": ["사용자 중심","user-centric","고객 중심","user first"],

    "의사결정": ["하자","해야","먼저","진행","결정","선택","우선하","우선시"],
    "행동절차": ["실행","진행","정리","분류","점검","기록","리스트업","체크리스트","WBS"]
};

const NEUTRAL_WORDS = [
    "정리","진행","개선","확인","점검","대응","조율","리스트업",
    "검토","공유","참고","정돈","정제","업데이트","문의","확인함",
    "고려","반영","논의","의논","체크"
];

// 동의어 확장 함수
function expandSynonyms(keywords) {
    const expanded = [];
    for (const keyword of keywords) {
        expanded.push(keyword); // 원본 키워드 추가
        if (SYNONYM_LEXICON[keyword]) {
            expanded.push(...SYNONYM_LEXICON[keyword]); // 동의어들 추가
        }
    }
    return [...new Set(expanded)]; // 중복 제거
}

// 규칙 기반 보정값 계산 (LLM 보정형 v2.1)
function calculateRuleAdjustment(text, scenario, selectedOption) {
    let adjustment = 0.0; // 기본 보정값 0
    const textLower = text.toLowerCase();
    
    // 문항별 단서 정의 (Q1~Q5, A/B 구분) + 유사어 포함
    const questionKeywords = {
        'Q1': {
            A: ['직접', '써보', '느껴', '만져', '현장', '고객입장', '체험', '실제', '몸으로', '손으로',
                '사용자입장', '유저관점', '유저입장', '실사용', '실전', '실환경', '직접체험', '직접사용'],
            B: ['데이터', '수치', '지표', '로그', '분석', '패턴', '통계', '측정', '정량', '계량',
                '수치분석', '데이터분석', '로그분석', '통계분석', '정량분석', '계량분석']
        },
        'Q2': {
            A: ['빨리', '서둘', '즉시', '먼저', '시간없', '급하', '빠르', '신속', '재빨리', '바로',
                '빠른출시', '신속출시', '즉시출시', '급하게', '서둘러', '재빨리',
                '선점', '시장선점', '시장', '시장 점유', '점유', '시장 점유율',
                '경쟁사보다', '경쟁사 대비', '먼저 내', '빠르게 출시',
                '브랜드 인지도', '인지도', 'first mover', 'first-to-market', 'market advantage', 'market dominance'],
            B: ['검증', '테스트', '브랜드', '품질', '리스크', '신중', '확인', '검토', '완성도', '안전',
                '품질확인', '브랜드이미지', '리스크관리', '신중하게', '완성도확인',
                '브랜드', '리스크', '품질', '검증', '이미지', '평판', '신뢰도', '재출시', '오류', '리뷰']
        },
        'Q3': {
            A: ['일정', '우선순위', '대안', '현실적', '계획', '스케줄', '시간', '효율', '조정', '재배분',
                '일정조정', '우선순위설정', '현실적계획', '시간관리', '효율성'],
            B: ['협업', '공감', '소통', '조율', '배려', '팀워크', '이해', '대화', '조화', '화합',
                '팀협업', '상호이해', '소통강화', '조율과정', '배려심',
                '협업', '공감', '소통', '조율', '배려', '서로', '이해', '의견교환', '대화', '상호존중']
        },
        'Q4': {
            A: ['목표', '조정', '재배분', '효율', '집중', '우선', '중요', '핵심', '최적화', '성과',
                '목표조정', '효율성', '집중도', '우선순위', '핵심과제', '성과관리'],
            B: ['완성도', '지원', '도와', '케어', '품질우선', '보완', '개선', '향상', '발전', '성장',
                '품질완성도', '지원체계', '케어시스템', '개선방안', '향상방안']
        },
        'Q5': {
            A: ['성과', '지표', '유입', '성장', '매출', '퍼센트', '수치', '목표', '달성', '실적',
                '성과지표', '유입증가', '성장률', '매출증가', '달성률', '실적관리'],
            B: ['만족', '경험', '평가', '피드백', '충성', '사용자중심', '감정', '체감', '느낌', '인상',
                '사용자만족', '경험개선', '피드백수집', '충성도', '체감만족',
                '만족', '경험', '피드백', '충성', '추천', '입소문', '지속이용', '사용자 중심', '유저 만족']
        }
    };
    
    const questionId = `Q${scenario}`;
    const keywords = questionKeywords[questionId];
    if (!keywords) return adjustment;
    
    // 현재 세트 단서 확인 (동의어 확장 적용)
    const currentSetKeywords = keywords[selectedOption] || [];
    const expandedKeywords = expandSynonyms(currentSetKeywords);
    const filteredCurrentKeywords = expandedKeywords.filter(keyword => 
        !NEUTRAL_WORDS.some(neutral => keyword.includes(neutral))
    );
    
    const currentMatches = filteredCurrentKeywords.filter(keyword => textLower.includes(keyword));
    console.log(`🔍 규칙 보정 디버깅 - 입력 텍스트: "${text}"`);
    console.log(`🔍 규칙 보정 디버깅 - 현재 세트 키워드:`, currentSetKeywords);
    console.log(`🔍 규칙 보정 디버깅 - 매칭된 키워드:`, currentMatches);
    console.log(`🔍 규칙 보정 디버깅 - 현재 보정값: ${adjustment}`);
    
    // 보정 규칙 적용
    if (currentMatches.length > 0) {
        adjustment += 1.0; // 정식 단서 또는 유사어 1개 이상 포함 → +1.0
        console.log(`정식 단서 발견 (${questionId}-${selectedOption}): ${currentMatches.join(', ')}`);
        console.log(`🔍 규칙 보정 디버깅 - 정식 단서 가산 후 보정값: ${adjustment}`);
    } else {
        // 중립형/유사 의미 단어 확인
        const neutralWords = ['현황', '문제', '도출', '분석', '개선', '확인', '점검', '검토', '정리', '파악'];
        const neutralMatches = neutralWords.filter(word => textLower.includes(word));
        if (neutralMatches.length > 0) {
            adjustment += 0.5; // 중립형/유사 의미 단어 → +0.5
            console.log(`중립형 단어 발견: ${neutralMatches.join(', ')}`);
            console.log(`🔍 규칙 보정 디버깅 - 중립형 단어 가산 후 보정값: ${adjustment}`);
        }
    }
    
    // 무관 단어 확인 (점심, 날씨, 잡담 등)
    const irrelevantWords = ['점심', '배고파', '날씨', '잡담', '놀이', '게임', '영화', '음악', '여행', '휴가'];
    const irrelevantMatches = irrelevantWords.filter(word => textLower.includes(word));
    if (irrelevantMatches.length > 0) {
        adjustment -= 2.0; // 무관 단어 포함 → -2.0
        console.log(`무관 단어 발견: ${irrelevantMatches.join(', ')}`);
        console.log(`🔍 규칙 보정 디버깅 - 무관 단어 감산 후 보정값: ${adjustment}`);
    }
    
    console.log(`🔍 규칙 보정 최종 보정값: ${adjustment}`);
    return adjustment;
}

// 구체성 점수 계산 (LLM 보정형 v2.1)
function calculateSpecificity(text, scenario, selectedOption) {
    let score = 3.5; // 기본 점수 하향 조정 (형식적 문장 인플레 방지)
    const textLower = text.toLowerCase();
    
    // 현재 세트 단서가 있는지 확인 (제한 규칙 적용을 위해)
    const hasCurrentSetKeywords = checkCurrentSetKeywords(text, scenario, selectedOption);
    console.log(`🔍 checkCurrentSetKeywords 결과: ${hasCurrentSetKeywords} (문항: Q${scenario}-${selectedOption})`);
    
    // 의사결정 표현이 있는지 먼저 확인 (동의어 확장 적용)
    const decisionExpressions = expandSynonyms(['의사결정']);
    const hasDecisionExpression = decisionExpressions.some(expr => textLower.includes(expr));
    
    // 행동/절차 단어 확인 (의사결정 표현이 없을 때만)
    if (!hasDecisionExpression) {
        // 기존 행동절차 동의어 + 일상적 수행 동사 추가
        const actionWords = expandSynonyms(['행동절차']);
        const dailyActionWords = ['하자', '한다', '진행', '해보자', '해볼게요', '먼저', '해보는 중', '할게요', '하겠습니다', '해보겠습니다'];
        const allActionWords = [...actionWords, ...dailyActionWords];
        
        const hasActionWord = allActionWords.some(word => textLower.includes(word));
        if (hasActionWord) {
            score += 0.8;
            console.log('행동/절차 단어 발견:', allActionWords.filter(word => textLower.includes(word)));
        }
    } else {
        console.log('의사결정 표현 발견으로 행동/절차 단어 가산 제외');
    }
    
    // 대상/맥락 단서 확인
    const contextWords = ['인물', '역할', '상황', '목표', '리스크', '팀', '고객', '사용자', '제품', '서비스'];
    
    // Q2-A 전용 컨텍스트 단서 추가
    if (scenario === 'Q2' && selectedOption === 'A') {
        contextWords.push('시장', '경쟁사', '점유', '선점', '인지도', '시장 점유율', '브랜드 인지도', 'first mover', 'first-to-market');
    }
    
    const matchedContextWords = contextWords.filter(word => textLower.includes(word));
    console.log('🔍 구체성 디버깅 - 텍스트:', textLower);
    console.log('🔍 구체성 디버깅 - 대상/맥락 단서들:', contextWords);
    console.log('🔍 구체성 디버깅 - 매칭된 단서들:', matchedContextWords);
    console.log('🔍 구체성 디버깅 - 현재 점수 (가산 전):', score);
    
    if (matchedContextWords.length > 0) {
        score += 0.8;
        console.log('대상/맥락 단서 발견:', matchedContextWords);
        console.log('🔍 구체성 디버깅 - 가산 후 점수:', score);
    }
    
    // 도구/자료 단어 확인
    const toolWords = ['데이터', '로그', '인터뷰', '설문', '실험', '프로토타입', '도구', '시스템', '플랫폼', '앱'];
    const hasToolWord = toolWords.some(word => textLower.includes(word));
    if (hasToolWord) {
        score += 1.0;
        console.log('도구/자료 단어 발견:', toolWords.filter(word => textLower.includes(word)));
    }
    
    // 제한 규칙 제거 (사용자 요청)
    // if (!hasCurrentSetKeywords) {
    //     const baseScore = 3.5;
    //     const bonusScore = Math.min(0.5, score - baseScore);
    //     score = baseScore + bonusScore;
    //     console.log('현재 세트 단서 없음 - 구체성 가산 제한 적용');
    // }
    
    // 0~10 사이로 클램프
    return Math.max(0, Math.min(10, score));
}

// 현재 세트 단서 확인 함수 (핵심 단서 + 부분 일치 모두 포함)
function checkCurrentSetKeywords(text, scenario, selectedOption) {
    const textLower = text.toLowerCase();
    
    // 핵심 단서 확인
    const questionKeywords = {
        'Q1': {
            A: ['직접', '써보', '느껴', '만져', '현장', '고객입장', '체험', '실제', '몸으로', '손으로',
                '사용자입장', '유저관점', '유저입장', '실사용', '실전', '실환경', '직접체험', '직접사용'],
            B: ['데이터', '수치', '지표', '로그', '분석', '패턴', '통계', '측정', '정량', '계량',
                '수치분석', '데이터분석', '로그분석', '통계분석', '정량분석', '계량분석']
        },
        'Q2': {
            A: ['빨리', '서둘', '즉시', '먼저', '시간없', '급하', '빠르', '신속', '재빨리', '바로',
                '빠른출시', '신속출시', '즉시출시', '급하게', '서둘러', '재빨리',
                '선점', '시장선점', '시장', '시장 점유', '점유', '시장 점유율',
                '경쟁사보다', '경쟁사 대비', '먼저 내', '빠르게 출시',
                '브랜드 인지도', '인지도', 'first mover', 'first-to-market', 'market advantage', 'market dominance'],
            B: ['검증', '테스트', '브랜드', '품질', '리스크', '신중', '확인', '검토', '완성도', '안전',
                '품질확인', '브랜드이미지', '리스크관리', '신중하게', '완성도확인',
                '브랜드', '리스크', '품질', '검증', '이미지', '평판', '신뢰도', '재출시', '오류', '리뷰']
        },
        'Q3': {
            A: ['일정', '우선순위', '대안', '현실적', '계획', '스케줄', '시간', '효율', '조정', '재배분',
                '일정조정', '우선순위설정', '현실적계획', '시간관리', '효율성'],
            B: ['협업', '공감', '소통', '조율', '배려', '팀워크', '이해', '대화', '조화', '화합',
                '팀협업', '상호이해', '소통강화', '조율과정', '배려심',
                '협업', '공감', '소통', '조율', '배려', '서로', '이해', '의견교환', '대화', '상호존중']
        },
        'Q4': {
            A: ['목표', '조정', '재배분', '효율', '집중', '우선', '중요', '핵심', '최적화', '성과',
                '목표조정', '효율성', '집중도', '우선순위', '핵심과제', '성과관리'],
            B: ['완성도', '지원', '도와', '케어', '품질우선', '보완', '개선', '향상', '발전', '성장',
                '품질완성도', '지원체계', '케어시스템', '개선방안', '향상방안']
        },
        'Q5': {
            A: ['성과', '지표', '유입', '성장', '매출', '퍼센트', '수치', '목표', '달성', '실적',
                '성과지표', '유입증가', '성장률', '매출증가', '달성률', '실적관리'],
            B: ['만족', '경험', '평가', '피드백', '충성', '사용자중심', '감정', '체감', '느낌', '인상',
                '사용자만족', '경험개선', '피드백수집', '충성도', '체감만족',
                '만족', '경험', '피드백', '충성', '추천', '입소문', '지속이용', '사용자 중심', '유저 만족']
        }
    };
    
    // 부분 일치 단서 확인
    const weakRelatedWords = {
        'Q1': ['사용자', '고객', '제품', '체험', '경험', '사용', '테스트'],
        'Q2': ['출시', '시장', '경쟁', '타이밍', '속도', '품질'],
        'Q3': ['팀', '갈등', '의견', '조율', '소통', '협력'],
        'Q4': ['업무', '일정', '팀원', '분위기', '야근', '부담'],
        'Q5': ['유저', '목표', '가치', '사용자', '신규', '기존']
    };
    
    const questionId = `Q${scenario}`;
    const keywords = questionKeywords[questionId];
    if (!keywords) return false;
    
    // 1. 핵심 단서 확인 (동의어 확장 적용)
    const currentSetKeywords = keywords[selectedOption] || [];
    const expandedKeywords = expandSynonyms(currentSetKeywords);
    const hasCoreKeywords = expandedKeywords.some(keyword => textLower.includes(keyword));
    
    // 2. 부분 일치 단서 확인
    const weakWords = weakRelatedWords[questionId] || [];
    const hasWeakKeywords = weakWords.some(word => textLower.includes(word));
    
    // 핵심 단서 또는 부분 일치 단서 중 하나라도 있으면 true
    return hasCoreKeywords || hasWeakKeywords;
}

// 표현품질 점수 계산 (LLM 보정형 v2.1)
function calculateExpressionQuality(text, scenario, selectedOption) {
    let score = 5.0; // 기본값 5.0 (표현 품질 기본치 하향)
    const textLower = text.toLowerCase();
    
    // 현재 세트 단서가 있는지 확인 (제한 규칙 적용을 위해)
    const hasCurrentSetKeywords = checkCurrentSetKeywords(text, scenario, selectedOption);
    
    // 길이 확인 (공백 제외)
    const lengthWithoutSpaces = text.replace(/\s/g, '').length;
    console.log('🔍 표현품질 디버깅 - 텍스트:', text);
    console.log('🔍 표현품질 디버깅 - 텍스트 길이 (공백 제외):', lengthWithoutSpaces);
    console.log('🔍 표현품질 디버깅 - 현재 점수 (가산 전):', score);
    
    if (lengthWithoutSpaces >= 10) {
        score += 0.5;
        console.log('적절한 길이 확인');
        console.log('🔍 표현품질 디버깅 - 길이 가산 후 점수:', score);
    }
    
    // 연결어 확인 (1회 한정)
    const connectors = ['그래서', '때문에', '즉', '따라서', '그러므로', '결론적으로', '요약하면',
                       '이라서', '라서', '해서', '므로', '관점에서', '측면에서'];
    const hasConnector = connectors.some(connector => textLower.includes(connector));
    if (hasConnector) {
        score += 0.5;
        console.log('연결어 발견:', connectors.filter(connector => textLower.includes(connector)));
    }
    
    // 문장 구조 일관성 및 논리 흐름 확인
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
    if (sentences.length > 1) {
        // 문장 간 논리적 연결성 확인
        const hasLogicalFlow = sentences.some(sentence => {
            const sentenceLower = sentence.toLowerCase();
            return connectors.some(connector => sentenceLower.includes(connector)) ||
                   sentenceLower.includes('왜냐하면') || sentenceLower.includes('그러나') ||
                   sentenceLower.includes('하지만') || sentenceLower.includes('또한');
        });
        
        if (hasLogicalFlow) {
            score += 0.5;
            console.log('논리적 흐름 확인');
        }
    }
    
    // 연결어와 논리 흐름 가산은 합산 시 최대 +0.5까지만 적용
    const connectorBonus = hasConnector ? 0.5 : 0;
    const flowBonus = sentences.length > 1 && !hasConnector ? 0.5 : 0;
    const totalBonus = Math.min(0.5, connectorBonus + flowBonus);
    score = 5.0 + (lengthWithoutSpaces >= 10 ? 0.5 : 0) + totalBonus;
    
    // 의미 불명확·무관 주제 확인
    const irrelevantWords = ['점심', '배고파', '날씨', '영화', '음악', '게임', '여행', '쇼핑', '운동'];
    const hasIrrelevant = irrelevantWords.some(word => textLower.includes(word));
    if (hasIrrelevant) {
        score -= 3.0;
        console.log('무관 주제 발견');
    }
    
    // 제한 규칙 제거 (사용자 요청)
    // if (!hasCurrentSetKeywords) {
    //     const baseScore = 5.0;
    //     const bonusScore = Math.min(0.5, score - baseScore);
    //     score = baseScore + bonusScore;
    //     console.log('현재 세트 단서 없음 - 표현품질 가산 제한 적용');
    // }
    
    // 0~10 사이로 클램프
    return Math.max(0, Math.min(10, score));
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

// 사용자 이유 제출 (강화형 점수 계산 로직 적용)
async function submitUserReason() {
    const reasonInput = document.getElementById('reasonInput');
    const reason = reasonInput.value.trim();
    
    // 예외처리는 아래 try 블록에서 처리됨
    
    try {
        // 1️⃣ 예외처리 단계 (최우선)
        
        // EMPTY CHECK
    if (!reason) {
            showValidationError("답변이 입력되지 않았습니다. 다시 작성해주세요.");
        return;
    }
    
        // PROFANITY CHECK
        if (containsInappropriateLanguage(reason)) {
            showValidationError("부적절한 표현이 섞여있습니다. 다시 작성해주세요.");
            return;
        }
        
        // LENGTH CHECK
        const lengthWithoutSpaces = reason.replace(/\s/g, '').length;
        if (lengthWithoutSpaces < 5 || lengthWithoutSpaces > 50) {
            showValidationError("답변의 길이가 부적절합니다. (5~50자)");
            return;
        }
        
        // 선택한 옵션과 문항 ID 가져오기
        const selectedChoice = userChoices[userChoices.length - 1];
        const rawChoice = selectedChoice.choice;
        
        // 선택지 변환 (1→A, 2→B) - 더 명확한 변환 로직
        let selectedOption;
        if (rawChoice === '1') {
            selectedOption = 'A';
        } else if (rawChoice === '2') {
            selectedOption = 'B';
        } else {
            selectedOption = rawChoice; // 이미 A/B인 경우 그대로 사용
        }
        const questionId = `Q${currentScenario}`;
        
        console.log('🔍 선택지 변환:', { rawChoice, selectedOption, questionId });
        
        console.log('🔍 통합 분석 시작:', { reason, selectedOption, questionId });
        
        // 로컬 점수 계산 먼저 수행 (이제 async 함수)
        const scoringResult = await calculateMeaningfulnessScore(reason, currentScenario, selectedOption);
        console.log('📊 로컬 점수 계산 결과:', scoringResult);
        
        // 점수가 5.8 미만이면 거부
        if (scoringResult.decision === 'reject') {
            showValidationError("답변이 다소 모호하거나 선택지 의미와의 연결이 약합니다. 좀 더 구체적으로 작성해주세요.");
            return;
        }
        
        // 로컬 점수가 5.8 이상이면 AI 분석 없이 바로 통과
        console.log('✅ 로컬 점수 통과 - AI 분석 건너뛰고 바로 진행');
        
        const parsedResult = {
            feedback: {
                decision: 'pass',
                message: '좋아요! 답변이 명확하고 문항 의도에 부합합니다.',
                scores: scoringResult.scores,
                judge_confidence: scoringResult.judge_confidence,
                judge_rationale: scoringResult.judge_rationale
            },
            mapping: null
        };
        
        // 로컬 점수가 5.8 미만인 경우 AI 분석 수행 (이제는 이미 위에서 처리됨)
        // scoringResult.decision이 'reject'인 경우는 이미 위에서 처리되었으므로 여기서는 추가 처리 불필요
        
        // 통과된 경우 사용자 이유 저장
        userReasons.push({
            scenario: currentScenario,
            choice: selectedChoice.text,
            reason: reason,
            feedback: parsedResult.feedback,
            mapping: parsedResult.mapping,
            scoringResult: scoringResult, // 전체 채점 결과 저장
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
3️⃣ PROFANITY CHECK (개선안 v1.2 + Whitelist 오탐 방지)
-----------------------------------------
- 비속어나 모욕적 표현이 포함되면 → reject("PROFANITY", "부적절한 표현이 섞여있습니다. 다시 작성해주세요.")
- 탐지 원칙:
  • 원문(reason) 기준으로 검사 (공백 제거·자모 분해본으로 검사하지 않는다)
  • 대소문자, 특수기호, 띄어쓰기가 섞여도 탐지
  • 단어 경계 기반 탐지로 일반 단어 내부 부분 일치 오탐 방지
- 정규식: (?<![가-힣A-Za-z])(씨\s발|시\s발|ㅆ\sㅂ|병\s신|ㅂ\sㅅ|개\s같|좆|존\s*나|fuck|shit|bitch|asshole)(?![가-힣A-Za-z])
- 플래그: i (대소문자 무시), u (유니코드)
- Whitelist (오탐 방지): ["현황","도출","개선","파악","결정","출시","분석","검토","측정","도전","기능","제품","서비스","사용자","시장","점유"]
- 판정 절차:
  1) reason_original에 대해 위 정규식으로 1차 검사
  2) 매칭되면 Whitelist 단어 포함 여부 확인
     - 포함 O → 오탐 가능성 → PROFANITY 미적용(통과)
     - 포함 X → PROFANITY 적용(reject)
- 예시:
  • "현황을 파악해 개선 방안을 도출하려고" → ✅ 통과
  • "시  발 이라도 하자" / "ㅆ ㅂ 진짜" / "f*ck this" → ❌ reject
  • "개같이 열심히" → ❌ reject

-----------------------------------------
4️⃣ LENGTH CHECK
-----------------------------------------
- 공백 제외 길이 < 5 또는 > 50 → reject("LENGTH", "답변의 길이가 부적절합니다. (5~50자)")

-----------------------------------------
5️⃣ 유의미도 점수 계산
-----------------------------------------
✅ 모든 검사를 통과했다면 아래 점수를 계산합니다.

초기값:
 - semantic_relevance = 3.0      // 기본치 원래대로 롤백 (5.0 → 3.0)
 - specificity = 3.5             // 형식 가산만으로 통과되는 현상 억제
 - expression_quality = 5.0      // 표현 품질 기본치 하향

총합 계산:
 총합 = 의미일치도*0.6 + 구체성*0.25 + 표현품질*0.15  
 PASS 기준: 총합 ≥ 5.8           // 통과 문턱 추가 완화 (6.0 → 5.8) - 의미 기반 답변 더 많이 통과

-----------------------------------------
6️⃣ 세부 점수 규칙
-----------------------------------------

🧩 의미일치도 (semantic_relevance) - LLM 중심

LLM이 우선 의미 판단을 수행하고, 규칙 점수는 "보정값(rule_adjustment)"으로만 반영한다.

final_semantic = (llm_semantic * 0.8) + (rule_adjustment * 0.2)

보정 규칙 (rule_adjustment):
- 현재 문항·선택(Qx-A/B)의 정식 단서 또는 유사어 1개 이상 포함 → +1.0
- 중립형/유사 의미 단어(예: 현황, 문제 도출, 분석, 개선 등) → +0.5
- 반대 세트 단서(A↔B) 포함 → 감점하지 않음
  ⚙️ 단, LLM이 "명확히 상충(contradiction)"으로 판정한 경우에만 -1.0
- 무관 단어(점심, 날씨, 잡담 등) 포함 → -2.0
- LLM이 "일상형이지만 의미 일치"로 판단한 경우(예: "사용자 입장에서 보면 그래야지") → semantic_relevance ≥ 7.0
- 0~10 사이로 클램프

 (참고) 단서 세트 예시:
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
 - 행동/절차 단어: 하자, 한다, 진행, 분석, 정리 → +0.8  
   ⚠️ 단, reason에 의사결정 표현(~하자/해야/먼저/진행 등)이 이미 포함된 경우 → 이 항목 가산 제외(중복 방지)
 - 대상/맥락 단서: 인물, 역할, 상황, 목표, 리스크 → +0.8
 - 도구/자료: 데이터, 로그, 인터뷰, 설문, 실험, 프로토타입 → +1.0
 - 논리 연결어(왜냐하면, 그래서, 때문에, 즉, 결론적으로) → ❌ 제외  // 표현품질에서만 반영
 - 여러 항목 동시 존재 시 누적 가능(최대 +3.0)
 - (제한 규칙 제거) 현재 세트 단서 제한 없음  // 사용자 요청으로 제한 규칙 비활성화
- 0~10 사이로 클램프

🧩 표현품질 (expression_quality)
 - 기본값 5.0
 - 길이(공백 제외) ≥ 10 → +0.5
 - 연결어(그래서/때문에/즉 등) 존재 → +0.5 (1회 한정)  // 중복 가산 금지
 - 문장 구조 일관·논리 흐름 명확 → +0.5
 - 의미 불명확·무관 주제 포함 시 → -3.0
 - (제한 규칙 제거) 현재 세트 단서 제한 없음  // 사용자 요청으로 제한 규칙 비활성화
- 0~10 사이로 클램프

-----------------------------------------
7️⃣ 최종 판정
-----------------------------------------
 - 총합(weighted_total) < 6.5 → 
   reject("LOW_SIGNIFICANCE", "답변이 다소 모호하거나 선택지 의미와의 연결이 약합니다. 좀 더 구체적으로 작성해주세요.")
 - 총합(weighted_total) ≥ 6.5 → pass
 
 (구체적 로직 예시)
 if (weighted_total < 6.5) {
   decision = "reject";
   reject_reason = "LOW_SIGNIFICANCE";
   message = "답변이 다소 모호하거나 선택지 의미와의 연결이 약합니다. 좀 더 구체적으로 작성해주세요.";
 } else {
   decision = "pass";
   reject_reason = null;
   message = "좋아요! 답변이 명확하고 문항 의도에 부합합니다.";
 }

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
        model: "gpt-4",
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
            "일정 내 가능한 대안부터 우선순위화해서 정리해봅시다.",
            "한 팀인만큼 서로의 입장에서 한번 더 생각해보고 의견차이를 좁혀봅시다."
        ],
        [
            "목표를 80% 달성으로 조정하고 업무를 재배분합시다.",
            "속도보단 완성도를 봅시다. 제가 일정 정리 도와드릴게요."
        ],
        [
            "신규 유입유저가 10%를 넘을 수 있도록 하겠습니다!",
            "사용자 만족도가 80%를 넘을 수 있도록 하겠습니다!"
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
