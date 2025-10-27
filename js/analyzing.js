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
        
        // 이유 작성 여부 확인
        const hasReasons = userData.reasons.some(reason => reason.reason && reason.reason.trim() !== '');
        console.log('📝 이유 작성 여부:', hasReasons ? '작성됨' : '미작성');
        
        // 32가지 유형 매핑 (이유 작성 여부와 관계없이 항상 수행)
        console.log('🔍 32가지 유형 매핑 시작...');
        
        // choices 데이터 확인 및 정리
        let choicesData = userData.choices || [];
        console.log('📊 원본 choices 데이터:', choicesData);
        console.log('📊 choices 데이터 길이:', choicesData.length);
        
        // choices가 없거나 비어있는 경우 경고
        if (!choicesData || choicesData.length === 0) {
            console.error('❌ choices 데이터가 없습니다!');
            console.log('📊 전체 userData:', userData);
            // 기본값으로 빈 배열 사용
            choicesData = [];
        }
        
        console.log('📊 최종 choices 데이터:', choicesData);
        
        const pmTypeResult = getFixedFeedback(choicesData);
        console.log('✅ 32가지 유형 매핑 완료:', pmTypeResult);
        
        if (hasReasons) {
            // 이유가 1개 이상 작성된 경우 - 새로운 LLM 프롬프트 사용
            console.log('🤖 새로운 LLM 프롬프트로 분석 시작...');
            const analysisResult = await callNewLLMAnalysis(userData.choices, userData.reasons);
            console.log('✅ AI 분석 결과:', analysisResult);
            
            // 32가지 유형 정보와 AI 분석 결과를 결합
            const combinedResult = {
                ...pmTypeResult, // 32가지 유형 정보
                aiAnalysis: analysisResult.aiAnalysis,
                strengths: analysisResult.strengths,
                improvements: analysisResult.improvements,
                strengthsTitle: '나만의 강점',
                improvementsTitle: '내가 보완할 부분',
                feedbackType: 'withReasons'
            };
            
            // 결과를 로컬 스토리지에 저장
            localStorage.setItem('analysisResult', JSON.stringify(combinedResult));
            localStorage.setItem('feedbackType', 'withReasons'); // 이유 작성됨 표시
            console.log('💾 결합된 분석 결과 저장 완료');
        } else {
            // 이유가 모두 미작성된 경우 - 새로운 "이유 0개 전용" 프롬프트 사용
            console.log('📋 이유 0개 전용 프롬프트로 분석 시작...');
            const analysisResult = await callNoReasonsAnalysis(userData.choices);
            console.log('✅ 고정값 매핑 결과:', analysisResult);
            
            // 32가지 유형 정보와 고정값 매핑 결과를 결합
            const combinedResult = {
                ...pmTypeResult, // 32가지 유형 정보
                aiAnalysis: analysisResult.aiAnalysis,
                strengths: analysisResult.strengths,
                improvements: analysisResult.improvements,
                strengthsTitle: '강점',
                improvementsTitle: '보완할 부분',
                feedbackType: 'withoutReasons'
            };
            localStorage.setItem('analysisResult', JSON.stringify(combinedResult));
            localStorage.setItem('feedbackType', 'withoutReasons'); // 이유 미작성 표시
            console.log('💾 고정값 매핑 결과 저장 완료');
        }
        
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

// 새로운 LLM 프롬프트를 사용한 OpenAI API 호출
async function callNewLLMAnalysis(choices, reasons) {
    console.log('🔑 API 키 로드 중...');
    
    // .env 파일에서 API 키 로드
    const envData = await loadEnvFile();
    const OPENAI_API_KEY = envData.OPENAI_API;
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
    
    console.log('🔑 API 키 상태:', OPENAI_API_KEY ? '✅ 로드됨' : '❌ 없음');
    
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API 키를 찾을 수 없습니다.');
    }
    
    // 사용자 유형 코드 생성
    const typeCode = choices.map(choice => choice.choice).join('');
    console.log('📊 사용자 유형 코드:', typeCode);
    
    // 사용자 이유 리스트 생성
    const userReasons = reasons.map(reason => reason.reason).filter(reason => reason && reason.trim() !== '');
    console.log('📝 사용자 이유 리스트:', userReasons);
    
    // 32가지 유형 카탈로그에서 해당 유형 정보 가져오기
    const pmTypeResult = getFixedFeedback(choices);
    
    const messages = [
        {
            role: "system",
            content: `역할: 너는 PM 성향 분석 카테고라이저이자 요약 작성기다. 주어진 "사용자 유형 코드(예: AABAA)", "유형별 고정값 카탈로그(32종)", "PM 핵심 지표 정의(5가지)", "사용자가 적은 이유 리스트"를 바탕으로 다음 3개 항목을 생성하라.

입력(Inputs)
type_code: 사용자의 성향 코드. 예: "AABAA"
type_catalog: 32가지 유형별 결과값 목록(간단 소개/자세한 소개/강점 고정값/보완할 부분 고정값 포함).
pm_core_indicators: 5개 핵심 지표 정의
- 문제 해결 방식 (A: 직관형 / B: 논리형)
- 실행 스타일 (A: 빠른 실행 우선 / B: 리스크 관리 우선)
- 커뮤니케이션 (A: 직설형 / B: 조율형)
- 리더십 (A: 드라이브형 / B: 서포트형)
- 전략적 사고 (A: 성과중심형 / B: 가치중심형)
user_reasons: 사용자가 입력한 "이유" 텍스트 배열(0개 이상). 예: ["데이터 중심으로 일정 관리했습니다", "리스크를 먼저 점검합니다", "팀 의견을 먼저 듣습니다"]

산출물(Outputs) — 세 항목을 모두 생성
1. AI 맞춤분석 (aiAnalysis)
- 반영 요소: type_code로 해석한 핵심 지표 성향 + user_reasons의 실제 단서 → 둘 다 녹여라.
- 어조: 긍정적, 전문적인 톤.
- 길이: 공백 제외 길이 80자 이상 100자 미만.
- 금지: 아래 2)·3)와 내용 중복 금지.

2. 나만의 강점 (strengths)
- 반영 요소: type_catalog[type_code]의 강점 고정값 + user_reasons의 강점 측면 단서 → 둘 다 녹여라.
- 어조: 긍정적, 구체적.
- 길이: 공백 제외 80–99자.
- 금지: 1)·3)와 내용 중복 금지.

3. 내가 보완할 부분 (improvements)
- 반영 요소: type_catalog[type_code]의 보완 고정값 + user_reasons의 개선 포인트 단서 → 둘 다 녹여라.
- 어조: 긍정적(성장 가능성 중심), 비난 표현 금지.
- 길이: 공백 제외 80–99자.
- 금지: 1)·2)와 내용 중복 금지.

작성 규칙(중요)
- 중복 방지: 생성 순서는 aiAnalysis → strengths → improvements. 뒤 항목을 만들 때 앞에서 사용한 문장 또는 10자 이상 구절이 겹치면 다른 표현으로 바꿔라.
- 증거 결합: user_reasons에서 핵심 키워드를 추출해 자연스럽게 녹여라(예: "리스크 선점", "데이터 기반 일정", "선경청"). 이유가 1개뿐이어도 반드시 반영하라.
- 정확한 길이 제어: 최종 산출물은 공백을 제외한 문자 수를 기준으로 80–99자 범위여야 한다. 초과 시 문장 경계 우선으로 자연스럽게 축약, 부족 시 의미 훼손 없이 보강.
- 금지 사항: 목록/불릿, 해시태그, 이모지, 따옴표 반복, 자기지시 문구("나는…", "이 모델은…") 금지.
- 풍부함: 같은 의미 반복 대신 구체적 행동/상황/효과를 넣어라(예: "리스크 선점으로 일정 변동 최소화").

출력 형식(Output Schema)
반드시 아래 JSON만 출력하라. JSON 외 텍스트 금지.
{
  "aiAnalysis": "<string>",
  "strengths": "<string>",
  "improvements": "<string>"
}`
        },
        {
            role: "user",
            content: `type_code: "${typeCode}"
type_catalog: ${JSON.stringify(pmTypeResult)}
user_reasons: ${JSON.stringify(userReasons)}

위 정보를 바탕으로 3개 항목을 생성해주세요.`
        }
    ];
    
    const requestBody = {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
    };
    
    console.log('🚀 새로운 LLM 프롬프트로 OpenAI API 요청 시작...');
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
    
    const responseText = data.choices[0].message.content;
    console.log('📝 LLM 응답 텍스트:', responseText);
    
    // JSON 파싱
    try {
        const parsedResult = JSON.parse(responseText);
        console.log('✅ JSON 파싱 성공:', parsedResult);
        return parsedResult;
    } catch (parseError) {
        console.error('❌ JSON 파싱 실패:', parseError);
        console.log('📝 원본 응답:', responseText);
        
        // 파싱 실패 시 기본값 반환
        return {
            aiAnalysis: '사용자의 선택 패턴을 분석한 결과, 체계적이고 논리적인 접근 방식을 보여주는 PM으로 평가됩니다.',
            strengths: '높은 추진력과 결단력을 기반으로 목표를 명확히 설정하고 신속하게 실행하는 성과 중심형 리더십을 보유.',
            improvements: '성과 중심 사고로 인해 공감과 피드백 수용이 다소 부족할 수 있음. 팀원 의견 반영과 소통 강화를 통해 리더십 균형 향상이 필요함.'
        };
    }
}

// 이유 0개(미작성) 전용 OpenAI API 호출
async function callNoReasonsAnalysis(choices) {
    console.log('🔑 API 키 로드 중...');
    
    // .env 파일에서 API 키 로드
    const envData = await loadEnvFile();
    const OPENAI_API_KEY = envData.OPENAI_API;
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
    
    console.log('🔑 API 키 상태:', OPENAI_API_KEY ? '✅ 로드됨' : '❌ 없음');
    
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API 키를 찾을 수 없습니다.');
    }
    
    // 사용자 유형 코드 생성
    const typeCode = choices.map(choice => choice.choice).join('');
    console.log('📊 사용자 유형 코드:', typeCode);
    
    // 32가지 유형 카탈로그에서 해당 유형 정보 가져오기
    const pmTypeResult = getFixedFeedback(choices);
    
    const messages = [
        {
            role: "system",
            content: `역할: 너는 텍스트 생성기가 아니다. 주어진 유형별 고정값을 그대로 JSON에 매핑해 반환하는 매핑기다.
중요: 어떠한 문구도 새로 만들어내지 말고, 입력으로 주어진 고정값을 '문자 단위까지 동일하게' 그대로 사용하라.

입력(Inputs)
type_code: 사용자의 성향 코드(예: "AABAA").
type_catalog: 32가지 유형별 결과값 전체 객체. 각 항목은 아래 필드 키를 가진다:
- simple_intro (간단 소개)
- detailed_intro (자세한 소개)
- strength (강점)
- improvement (보완할 부분)
user_reasons: 사용자가 입력한 이유 배열. 본 프롬프트는 user_reasons.length === 0인 경우에만 실행된다.

규칙(Rules)
user_reasons.length === 0이 맞는지 먼저 확인한다. 아니면 즉시 에러 JSON을 반환한다(아래 참조).
문구 생성 금지. 모든 출력은 type_catalog[type_code]의 원문을 그대로 사용한다.

매핑 규칙
"aiAnalysis" ← type_catalog[type_code].detailed_intro (자세한 소개 원문 그대로)
"strengths" ← type_catalog[type_code].strength (강점 원문 그대로)
"improvements" ← type_catalog[type_code].improvement (보완할 부분 원문 그대로)

길이 제약 적용 금지. 80~100자 규칙, 줄바꿈 규칙, 중복 제거 등 일체 적용하지 않는다.
출력 형식은 JSON만. JSON 외 텍스트 금지. 키 이름은 정확히 아래 스키마를 따를 것.
입력된 type_code가 type_catalog에 없으면 에러 JSON을 반환.

출력 스키마(Output Schema)
다음 둘 중 하나의 JSON만 출력 가능:

정상 출력(JSON)
{
  "aiAnalysis": "<type_catalog[type_code].detailed_intro 그대로>",
  "strengths": "<type_catalog[type_code].strength 그대로>",
  "improvements": "<type_catalog[type_code].improvement 그대로>"
}

에러 출력(JSON)
{
  "error": "INVALID_INPUT",
  "message": "This prompt must be used only when user_reasons is empty and type_code exists in catalog."
}`
        },
        {
            role: "user",
            content: `type_code: "${typeCode}"
type_catalog: ${JSON.stringify(pmTypeResult)}
user_reasons: []

위 정보를 바탕으로 고정값을 그대로 매핑해주세요.`
        }
    ];
    
    const requestBody = {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.1
    };
    
    console.log('🚀 이유 0개 전용 프롬프트로 OpenAI API 요청 시작...');
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
    
    const responseText = data.choices[0].message.content;
    console.log('📝 LLM 응답 텍스트:', responseText);
    
    // JSON 파싱
    try {
        const parsedResult = JSON.parse(responseText);
        console.log('✅ JSON 파싱 성공:', parsedResult);
        
        // 에러 체크
        if (parsedResult.error) {
            console.error('❌ LLM 에러 응답:', parsedResult);
            throw new Error(parsedResult.message);
        }
        
        return parsedResult;
    } catch (parseError) {
        console.error('❌ JSON 파싱 실패:', parseError);
        console.log('📝 원본 응답:', responseText);
        
        // 파싱 실패 시 기본값 반환
        return {
            aiAnalysis: pmTypeResult.detailedIntro || pmTypeResult.typeDescription || '분석 결과를 불러올 수 없습니다.',
            strengths: pmTypeResult.strengths || '강점 정보를 불러올 수 없습니다.',
            improvements: pmTypeResult.improvements || '보완점 정보를 불러올 수 없습니다.'
        };
    }
}

// 고정값 피드백 생성
function getFixedFeedback(choices) {
    console.log('🔍 선택지 분석 중:', choices);
    
    // 선택지가 없는 경우 기본 유형 반환
    if (!choices || choices.length === 0) {
        console.warn('⚠️ 선택지가 없습니다. 기본 유형을 반환합니다.');
        return {
            pmType: '알파메일 PM',
            simpleIntro: '불필요한 감정소모는 NO!',
            detailedIntro: '모든 일엔 기준과 프로세스가 있어야 한다고 믿는 PM계의 냉철한 현실주의자.',
            strengths: '높은 추진력과 결단력을 기반으로 목표를 명확히 설정하고 신속하게 실행하는 성과 중심형 리더십을 보유.',
            improvements: '성과 중심 사고로 인해 공감과 피드백 수용이 다소 부족할 수 있음.',
            compatiblePM: '싹싹김치 형',
            compatiblePMReason: '정리력과 커뮤니케이션이 리더십을 보완해줘요!',
            compatiblePMImage: 'char5.png',
            incompatiblePM: '멈춰! 형',
            incompatiblePMReason: '서로의 주도권이 부딪할 수 있어요!',
            incompatiblePMImage: 'char6.png',
            image: 'char4.png'
        };
    }
    
    // 선택지 패턴에 따른 고정 피드백 매칭
    const choicePattern = analyzeChoicePattern(choices);
    console.log('📊 분석된 패턴:', choicePattern);
    
    const feedback = {
        pmType: choicePattern.pmType,
        simpleIntro: choicePattern.simpleIntro || choicePattern.typeDescription, // 간단 소개
        detailedIntro: choicePattern.detailedIntro || choicePattern.typeDescription, // 자세한 소개
        typeDescription: choicePattern.typeDescription,
        strengths: choicePattern.strengths,
        improvements: choicePattern.improvements,
        compatiblePM: choicePattern.compatiblePM,
        compatiblePMReason: choicePattern.compatiblePMReason,
        compatiblePMImage: choicePattern.compatiblePMImage,
        incompatiblePM: choicePattern.incompatiblePM,
        incompatiblePMReason: choicePattern.incompatiblePMReason,
        incompatiblePMImage: choicePattern.incompatiblePMImage,
        image: choicePattern.image
    };
    
    console.log('✅ 생성된 고정값 피드백:', feedback);
    return feedback;
}

// 선택지 패턴 분석
function analyzeChoicePattern(choices) {
    console.log('📝 선택지 분석 시작:', choices);
    
    // 선택지 패턴을 A/B 형태로 변환
    const pattern = choices.map((choice, index) => {
        const text = choice.text;
        console.log(`시나리오 ${index + 1} 선택지:`, text);
        
        // 각 시나리오별 A/B 패턴 매핑
        // 시나리오 1: 문제해결 방식
        if (text.includes('직접 써보면서') || text.includes('감을 잡아보자')) return 'A'; // 직관형
        if (text.includes('데이터를 먼저') || text.includes('분석해보자')) return 'B'; // 논리형
        
        // 실제 선택지 텍스트 매칭 (chatbot.html 기반)
        if (text.includes('최근 제품을 직접 써보면서 어디서 불편함이 느껴지는지 감을 잡아보자')) return 'A';
        if (text.includes('데이터를 먼저 확인해서 어떤 단계에서 이탈이 발생했는지 분석해보자')) return 'B';
        
        // 시나리오 2: 실행스타일
        if (text.includes('빠르게 점유') || text.includes('빠르게 출시')) return 'A'; // 빠른 실행
        if (text.includes('브랜드 이미지') || text.includes('충분한 테스트')) return 'B'; // 리스크 관리
        
        // 시나리오 3: 커뮤니케이션
        if (text.includes('우선순위화') || text.includes('정리해봅시다')) return 'A'; // 직설형
        if (text.includes('서로의 입장') || text.includes('의견차이를 좁혀')) return 'B'; // 조율형
        
        // 시나리오 4: 리더십
        if (text.includes('80% 달성') || text.includes('업무를 재배분')) return 'A'; // 드라이브형
        if (text.includes('완성도를 봅시다') || text.includes('일정 정리 도와드릴게요')) return 'B'; // 서포트형
        
        // 시나리오 5: 전략적사고
        if (text.includes('신규 유입유저') || text.includes('10%를 넘을')) return 'A'; // 성과중심형
        if (text.includes('사용자 만족도') || text.includes('80%를 넘을')) return 'B'; // 가치중심형
        
        // 매칭되지 않은 경우 더 정확한 패턴 매칭 시도
        console.warn(`⚠️ 매칭되지 않은 선택지: ${text}`);
        console.log(`📝 전체 텍스트: "${text}"`);
        
        // 키워드 기반 패턴 추정 (더 정확한 매칭)
        const aKeywords = ['직접', '빠르게', '우선순위', '80%', '신규', '점유', '출시', '드라이브', '성과'];
        const bKeywords = ['데이터', '브랜드', '서로', '완성도', '사용자', '만족도', '충분한', '테스트', '조율'];
        
        const aMatches = aKeywords.filter(keyword => text.includes(keyword)).length;
        const bMatches = bKeywords.filter(keyword => text.includes(keyword)).length;
        
        console.log(`🔍 A 키워드 매칭: ${aMatches}, B 키워드 매칭: ${bMatches}`);
        
        if (aMatches > bMatches) {
            console.log('🔍 A 패턴으로 추정');
            return 'A';
        } else if (bMatches > aMatches) {
            console.log('🔍 B 패턴으로 추정');
            return 'B';
        }
        
        // 동일한 매칭 수인 경우 시나리오별 기본값
        const scenarioDefault = index === 0 ? 'A' : (index % 2 === 0 ? 'A' : 'B');
        console.log(`🎯 시나리오 ${index + 1} 기본값: ${scenarioDefault}`);
        return scenarioDefault;
    }).join('');
    
    console.log('🔍 분석된 패턴:', pattern);
    console.log('📊 패턴 길이:', pattern.length);
    
    // 패턴에 따른 PM 유형 매핑
    const pmType = getPMTypeByPattern(pattern);
    console.log('✅ 매칭된 PM 유형:', pmType);
    
    return pmType;
}

// 패턴에 따른 PM 유형 반환 (5글자 패턴)
function getPMTypeByPattern(pattern) {
    console.log('🔍 패턴 매칭:', pattern);
    
    const pmTypes = {
        // AAAAA 패턴들
        'AAAAA': {
            pmType: '골반이 멈추지 않아~ 형',
            simpleIntro: '트렌드 타고 춤추는 인간 영감 뱅크',
            detailedIntro: '트렌드 감각으로 무드메이킹. 새로움 하나면 팀의 색감이 확 살아난다.',
            strengths: '예술적 감각과 독창적인 아이디어로 새로운 흐름을 제시하며, 팀에 영감을 주는 창의적 리더십을 발휘합니다.',
            improvements: '몰입이 짧아 일관성이 떨어질 수 있으므로, 루틴화된 일정 관리로 집중력을 유지해야 합니다.',
            compatiblePM: '침착맨 형',
            compatiblePMReason: '냉정함이 창의력을 안정시켜줘요!',
            compatiblePMImage: 'dm_23.png',
            incompatiblePM: '개미는 뚠뚠 형',
            incompatiblePMReason: '속도와 스타일의 차이가 크기 때문이에요!',
            incompatiblePMImage: 'dm_2.png',
            image: 'dm_32.png'
            },
        'AAAAB': {
            pmType: '관짝 소년단 형',
            simpleIntro: '웃음으로 위기 탈출하는 팀 무드 리셋터',
            detailedIntro: '힘든 국면에도 농담 한 스푼. 분위기 반전으로 팀 사기 리바운드.',
            strengths: '긍정적인 유머와 유연한 사고로 팀의 사기를 높이고, 위기 속에서도 즐거운 분위기를 만들어 협업을 촉진합니다.',
            improvements: '즉흥적인 태도가 장기 계획을 흔들 수 있으므로, 목표를 구체화하고 일정 관리에 신경 써야 합니다.',
            compatiblePM: '불속성 형',
            compatiblePMReason: '즉흥적 실행력으로 활력을 불어넣어요!',
            compatiblePMImage: 'dm_10.png',
            incompatiblePM: '침착맨 형',
            incompatiblePMReason: '진지한 접근이 답답하게 느껴질 수 있어요!',
            incompatiblePMImage: 'dm_23.png',
            image: 'dm_31.png'
            },
        'AAABA': {
            pmType: '센스만점 형',
            simpleIntro: '아이디어 스파크 장착한 인간 번뜩임',
            detailedIntro: '아이디어가 스파크처럼 튄다. 빈 화이트보드도 10분이면 스케치가 꽉 찬다.',
            strengths: '뛰어난 직감과 유연한 사고로 창의적인 아이디어를 제시하며, 새로운 관점을 통해 프로젝트에 활력을 불어넣습니다.',
            improvements: '단기적인 성과에 집중하면 지속성이 떨어질 수 있으므로, 장기적 계획을 세워 균형을 잡는 노력이 필요합니다.',
            compatiblePM: '침착맨 형',
            compatiblePMReason: '침착함이 센스를 현실로 연결해줘요!',
            compatiblePMImage: 'dm_23.png',
            incompatiblePM: '두뇌풀가동 형',
            incompatiblePMReason: '논리 중심형과 감각형이 충돌하기 때문이에요!',
            incompatiblePMImage: 'dm_7.png',
            image: 'dm_30.png'
            },
        'AAABB': {
            pmType: '알쓸신잡 형',
            simpleIntro: '지식으로 무장한 인간 위키백과',
            detailedIntro: '위키 인간화 버전. 정보 수집과 맥락화로 로드맵에 살 붙이는 박사님.',
            strengths: '폭넓은 지식과 구조적 사고로 문제의 본질을 꿰뚫으며, 장기적 전략을 세우는 데 탁월한 역량을 보입니다.',
            improvements: '지식 중심 접근이 실행력을 저하시킬 수 있어, 실천 중심의 행동 리더십을 보완해야 합니다.',
            compatiblePM: '나는 아직 배고프다 형',
            compatiblePMReason: '지식이 행동으로 연결돼요!',
            compatiblePMImage: 'dm_12.png',
            incompatiblePM: '괜차나 형',
            incompatiblePMReason: '느긋한 흐름이 답답하게 느껴질 수 있어요!',
            incompatiblePMImage: 'dm_18.png',
            image: 'dm_29.png'
            },
        'AABAA': {
            pmType: '넥 슬라이스 형',
            simpleIntro: '고민은 짧게, 판단은 빠르게',
            detailedIntro: '핵심만 슥 베어내듯 판단. 통찰 한 스푼으로 회의 시간을 절반으로 만든다.',
            strengths: '날카로운 통찰과 빠른 판단으로 복잡한 문제를 단시간에 해결하며, 효율적인 전략 수립에 강점을 보입니다.',
            improvements: '논리 중심의 사고가 감정 교류를 약화시킬 수 있어, 관계 중심의 소통을 의식적으로 강화해야 합니다.',
            compatiblePM: '무한도전 형',
            compatiblePMReason: '논리와 열정이 균형을 이룸!',
            compatiblePMImage: 'dm_27.png',
            incompatiblePM: '낋여오거라 형',
            incompatiblePMReason: '차가운 판단형과 정서 코드가 다르기 때문이에요!',
            incompatiblePMImage: 'dm_22.png',
            image: 'dm_28.png'
},
        'AABAB': {
            pmType: '무한도전 형',
            simpleIntro: '실패도 콘텐츠로 만드는 도전러',
            detailedIntro: '‘해보고 말하자’가 기본값. 빠른 실험으로 인사이트를 뽑아내는 테스트 드리븐.',
            strengths: '도전정신과 추진력을 기반으로 빠르게 실행하며, 새로운 아이디어를 실험해 혁신을 만들어냅니다.',
            improvements: '실행 속도에 비해 완성도가 낮을 수 있으므로, 세밀한 관리와 지속력 향상에 힘써야 합니다.',
            compatiblePM: '넥슬라이스 형',
            compatiblePMReason: '논리와 열정이 균형을 이룸!',
            compatiblePMImage: 'dm_28.png',
            incompatiblePM: '괜차나 형',
            incompatiblePMReason: '과도한 변화가 피로하게 느껴질 수 있어요!',
            incompatiblePMImage: 'dm_18.png',
            image: 'dm_27.png'
            },
        'AABBA': {
            pmType: '0친자 형',
            simpleIntro: '감정·이성 밸런스 미친 인간 저울',
            detailedIntro: '이성·감성 트윈코어 구동. 과열되면 식히고, 차가우면 덥히는 온도조절 장치.',
            strengths: '논리와 공감을 조화롭게 활용해 팀의 신뢰를 얻으며, 갈등 상황에서도 차분하게 균형을 유지합니다.',
            improvements: '신중함이 지나치면 결정이 늦어질 수 있으니, 때로는 과감한 실행력으로 속도를 내야 합니다.',
            compatiblePM: '이건 첫번째 레슨 형',
            compatiblePMReason: '체계와 통찰이 균형을 완성해요!',
            compatiblePMImage: 'dm_20.png',
            incompatiblePM: '불속성 형',
            incompatiblePMReason: '성급한 실행을 부담스러워하기 때문이에요!',
            incompatiblePMImage: 'dm_10.png',
            image: 'dm_26.png'
            },
        'AABBB': {
            pmType: '할래말래? 형',
            simpleIntro: '협상 테이블의 평화중재자',
            detailedIntro: '의견 충돌? 일단 중간자 모드로 브레이크. 합의점 찾는 손놀림이 빠르다.',
            strengths: '다양한 관점을 수용하며 조화로운 협업을 이끌고, 유연한 사고로 팀 내 갈등을 자연스럽게 완화시킵니다.',
            improvements: '과도한 신중함이 기회를 놓치게 할 수 있어, 빠른 결단과 추진력을 키우는 노력이 필요합니다.',
            compatiblePM: '낋여오거라 형',
            compatiblePMReason: '따뜻한 공감으로 결정을 이끌어줘요!',
            compatiblePMImage: 'dm_22.png',
            incompatiblePM: '불속성 형',
            incompatiblePMReason: '즉시 행동을 요구하는 스타일과 맞지 않아요!',
            incompatiblePMImage: 'dm_10.png',
            image: 'dm_25.png'
            },
        'ABAAA': {
            pmType: '넘어갈게요 형',
            simpleIntro: '싸움보다 평화를 택한 인간 버퍼링',
            detailedIntro: '각을 세우기보다 각을 둥글게. 상황 따라 유연하게 결을 맞춘다.',
            strengths: '유연한 사고와 부드러운 소통으로 팀의 긴장을 완화시키며, 협업 속에서 안정감을 형성하는 능력이 있습니다.',
            improvements: '과도한 배려로 결단력이 약해질 수 있어, 명확한 기준과 책임감 있는 의사결정이 필요합니다.',
            compatiblePM: '개미는 뚠뚠 형',
            compatiblePMReason: '안정적인 루틴과 조화가 잘 맞아요!',
            compatiblePMImage: 'dm_2.png',
            incompatiblePM: '무야호 형',
            incompatiblePMReason: '감정 강도가 달라 피로해질 수 있어요!',
            incompatiblePMImage: 'dm_4.png',
            image: 'dm_24.png'
            },
        'ABAAB': {
            pmType: '침착man~ 형',
            simpleIntro: '불나도 침착, 인간 아이스팩',
            detailedIntro: '알람 울려도 심박수 유지. 위기에도 표정 변화 없는 현실 모드 장착.',
            strengths: '혼란스러운 상황에서도 흔들리지 않는 냉정함으로 위기를 수습하고, 논리적인 판단으로 문제 해결을 주도합니다.',
            improvements: '감정 표현 부족이 팀의 몰입을 떨어뜨릴 수 있어, 따뜻한 피드백과 인정 표현을 의식적으로 늘려야 합니다.',
            compatiblePM: '골반이 멈추지 않아 형',
            compatiblePMReason: '감각적 감성이 침착함을 살려줘요!',
            compatiblePMImage: 'dm_32.png',
            incompatiblePM: '관짝소년단 형',
            incompatiblePMReason: '즉흥적 유머와 진지함이 맞지 않기 때문이에요!',
            incompatiblePMImage: 'dm_31.png',
            image: 'dm_23.png'
            },
        'ABABA': {
            pmType: '낋여오거라~ 형',
            simpleIntro: '눈치로 분위기 미세조정하는 감정 온도조절기',
            detailedIntro: '팀 컨디션 모니터링이 특기. 다독이고 다져서 분위기부터 안정화한다.',
            strengths: '팀원들의 감정을 섬세하게 읽고 배려하며, 따뜻한 공감으로 팀의 결속력과 안정감을 높이는 리더십을 보여줍니다.',
            improvements: '감정에 집중하다 보면 판단이 흐려질 수 있어, 논리와 데이터 기반 접근을 병행하는 훈련이 필요합니다.',
            compatiblePM: '럭키비키 형',
            compatiblePMReason: '낙관적 기운이 감정의 따뜻함을 돋워줘요!',
            compatiblePMImage: 'dm_11.png',
            incompatiblePM: '넥슬라이스 형',
            incompatiblePMReason: '차가운 판단형과 정서 코드가 다르기 때문이에요!',
            incompatiblePMImage: 'dm_28.png',
            image: 'dm_22.png'
            },
        'ABABB': {
            pmType: '너 T야? 형',
            simpleIntro: '감정보단 데이터, T본좌',
            detailedIntro: '감이 아니라 수치로 말하는 타입. 근거가 쌓여야 고개가 끄덕여진다.',
            strengths: '객관적 데이터와 논리에 기반해 명확한 판단을 내리며, 효율적인 의사결정으로 프로젝트의 완성도를 높입니다.',
            improvements: '수치 중심의 접근이 인간적인 교류를 약화시킬 수 있으므로, 감정적 피드백과 공감을 병행해야 합니다.',
            compatiblePM: '낋여오거라 형',
            compatiblePMReason: '감정 케어로 인간미를 채워줘요!',
            compatiblePMImage: 'dm_22.png',
            incompatiblePM: '무야호 형',
            incompatiblePMReason: '감정 과잉형 텐션을 부담스러워하기 때문이에요!',
            incompatiblePMImage: 'dm_4.png',
            image: 'dm_21.png'
            },
        'ABBAA': {
            pmType: '이건 첫번째 레슨~ 형',
            simpleIntro: '모든 문제에 프레임부터 세우는 구조 덕후',
            detailedIntro: '프레임 먼저 깔고 얘기 시작. 구조화로 혼선을 싹 걷어내는 룰메이커.',
            strengths: '논리적 사고와 명확한 기준으로 프로젝트를 안정적으로 관리하며, 체계적 프레임으로 혼란을 정리합니다.',
            improvements: '감정 공감 부족이 팀 분위기를 경직시킬 수 있으므로, 유연한 대화와 피드백 방식을 익혀야 합니다.',
            compatiblePM: '선배 마라탕사주세요 형',
            compatiblePMReason: '실무 감각이 이론을 현실로 연결해요!',
            compatiblePMImage: 'dm_16.png',
            incompatiblePM: '불속성 형',
            incompatiblePMReason: '즉흥적 실행력과 철저한 계획이 충돌하기 때문이에요!',
            incompatiblePMImage: 'dm_10.png',
            image: 'dm_20.png'
            },
        'ABBAB': {
            pmType: '이븐하게 익었어요 형',
            simpleIntro: '감성과 논리 반반 섞은 인간 미디엄레어',
            detailedIntro: '감성 50, 논리 50의 밸런스 요리사. 극단 대신 조율로 그림을 완성한다.',
            strengths: '감정과 논리를 고르게 조율해 갈등을 부드럽게 해결하며, 협업의 조화를 이끌어내는 안정적 리더십을 가집니다.',
            improvements: '지나치게 중립적인 태도가 결정력을 약화시킬 수 있어, 때로는 단호한 판단이 필요합니다.',
            compatiblePM: '간디작살 형',
            compatiblePMReason: '차분한 조율로 완벽한 밸런스를 이루어요!',
            compatiblePMImage: 'dm_17.png',
            incompatiblePM: '멈춰! 형',
            incompatiblePMReason: '감정적 에너지가 부담스러울 수 있어요!',
            incompatiblePMImage: 'dm_1.png',
            image: 'dm_19.png'
            },
        'ABBBA': {
            pmType: '괜차나...닝닝닝닝 형',
            simpleIntro: '감정 온도 조절 마스터, 팀 멘탈 지킴이',
            detailedIntro: '팀 감정선 안정화 담당자. 갈등도 말랑하게 만들어 숨 고르게 해준다.',
            strengths: '팀의 감정 변화를 세심히 살피며 긴장을 완화하고, 부드러운 소통으로 안정적인 협업 분위기를 만듭니다.',
            improvements: '갈등 상황에서 결정을 미루면 리더십이 약해질 수 있으므로, 명확한 기준과 결단력을 강화해야 합니다.',
            compatiblePM: '낋여오거라 형',
            compatiblePMReason: '따뜻한 배려로 팀 분위기를 안정시켜요!',
            compatiblePMImage: 'dm_22.png',
            incompatiblePM: '알쓸신잡 형',
            incompatiblePMReason: '논리 중심의 커뮤니케이션이 부담스러울 수 있어요!',
            incompatiblePMImage: 'dm_29.png',
            image: 'dm_18.png'
            },
        'ABBBB': {
            pmType: '간디작살 형',
            simpleIntro: '조용하지만 핵심만 치는 평정의 달인',
            detailedIntro: '말수는 적어도 한 마디는 핵심. 생각의 깊이로 팀 중심을 차분히 붙잡는다.',
            strengths: '깊은 통찰력과 평정심으로 팀의 균형을 잡으며, 차분한 리더십으로 신뢰와 안정감을 만들어냅니다.',
            improvements: '소극적인 표현으로 존재감이 약해질 수 있으니, 주도적으로 의견을 제시하는 연습이 필요합니다.',
            compatiblePM: '이븐하게 익었어요 형',
            compatiblePMReason: '차분한 조율로 완벽한 밸런스를 이루어요!',
            compatiblePMImage: 'dm_19.png',
            incompatiblePM: '핵인싸 형',
            incompatiblePMReason: '과한 에너지가 집중을 깨기 때문이에요!',
            incompatiblePMImage: 'dm_9.png',
            image: 'dm_17.png'
            },
        'BAAAA': {
            pmType: '선배 마라탕 사주세요 형',
            simpleIntro: '친화력으로 일도, 밥도 해결하는 인간 마라탕',
            detailedIntro: '현장감각+친화력으로 딜 무드 잡는 실무형. “제가 먼저 손대볼게요”가 입버릇.',
            strengths: '실무 중심의 판단과 행동력으로 문제를 빠르게 해결하며, 현실적인 접근으로 팀의 신뢰를 단단히 쌓습니다.',
            improvements: '단기 실행에 집중하다 보면 전략적 시야가 약해질 수 있으니, 장기 계획 수립 능력을 함께 길러야 합니다.',
            compatiblePM: '이건 첫번째 레슨 형',
            compatiblePMReason: '실무 감각이 이론을 현실로 연결해요!',
            compatiblePMImage: 'dm_20.png',
            incompatiblePM: '침착맨 형',
            incompatiblePMReason: '지나치게 냉정한 접근이 부담스러울 수 있어요!',
            incompatiblePMImage: 'dm_23.png',
            image: 'dm_16.png'
            },
        'BAAAB': {
            pmType: '형이 왜 거기서 나와...? 형',
            simpleIntro: '위기 때마다 순간이동하는 문제해결 요정',
            detailedIntro: '이슈 뜨면 어디선가 등장해 불 끄고 사라지는 해결사. 임기응변 스피드가 미친다.',
            strengths: '빠른 판단력과 순발력으로 예기치 못한 문제를 즉시 해결하며, 위기 속에서도 유연하게 대응하는 능력을 보입니다.',
            improvements: '즉흥적 해결에 익숙해 장기 전략이 부족할 수 있으니, 계획 수립과 지속적 방향 설정에 힘써야 합니다.',
            compatiblePM: '나는 아직 배고프다 형',
            compatiblePMReason: '실행 중심의 에너지가 닮았어요!',
            compatiblePMImage: 'dm_12.png',
            incompatiblePM: '두뇌풀가동 형',
            incompatiblePMReason: '즉흥성과 계획형이 충돌하기 때문이에요!',
            incompatiblePMImage: 'dm_7.png',
            image: 'dm_15.png'
            },
        'BAABA': {
            pmType: '칠가이 형',
            simpleIntro: '감정 OFF, 현실 모드 ON',
            detailedIntro: '감정필터 OFF, 현실필터 ON. 쿨하게 본질만 뽑아 결론까지 스르륵.',
            strengths: '차분하고 명확한 사고로 복잡한 문제를 효율적으로 정리하며, 감정에 흔들리지 않는 결단력으로 위기를 극복합니다.',
            improvements: '직설적인 피드백이 냉정하게 들릴 수 있으므로, 부드러운 언어와 공감적 소통을 병행하는 것이 좋습니다.',
            compatiblePM: '무한도전 형',
            compatiblePMReason: '열정형의 추진력이 밸런스를 맞춰줘요!',
            compatiblePMImage: 'dm_27.png',
            incompatiblePM: '알파메일 형',
            incompatiblePMReason: '서로 주도권이 부딪힐 수 있어요!',
            incompatiblePMImage: 'dm_8.png',
            image: 'dm_14.png'
            },
        'BAABB': {
            pmType: '어서오고~ 형',
            simpleIntro: '들어오자마자 다들 친구 되는 인간 온기버튼',
            detailedIntro: '새 팀원도 5분 만에 편해지는 온기 담당. 말투부터 케어까지 소프트 파워 만렙.',
            strengths: '팀원의 감정을 세심히 살피며 공감과 포용으로 신뢰를 쌓고, 긍정적인 협업 분위기를 조성하는 능력이 뛰어납니다.',
            improvements: '인간관계에 집중하다 보면 목표 의식이 약해질 수 있어, 명확한 성과 기준을 병행하는 태도가 필요합니다.',
            compatiblePM: '두뇌풀가동 형',
            compatiblePMReason: '체계적 판단으로 따뜻함이 실현돼요!',
            compatiblePMImage: 'dm_7.png',
            incompatiblePM: '무한도전 형',
            incompatiblePMReason: '과도한 변화가 피로하게 느껴질 수 있어요!',
            incompatiblePMImage: 'dm_27.png',
            image: 'dm_13.png'
            },
        'BABAA': {
            pmType: '나는 아직 배고프다 형',
            simpleIntro: '성장 안 하면 밥맛이 없어',
            detailedIntro: '오늘 성장, 내일 또 성장. 러닝·도전·피봇이 루틴인 업그레이드 중독자.',
            strengths: '강한 성장 욕구와 추진력으로 팀을 끌어올리며, 끊임없이 개선과 도전을 추구해 프로젝트의 변화를 이끌어냅니다.',
            improvements: '속도에 집중하다 보면 세부 완성도가 떨어질 수 있어, 실행 후 피드백과 디테일 검증이 중요합니다.',
            compatiblePM: '알쓸신잡 형',
            compatiblePMReason: '체계적 시야로 발전을 가속화해요!',
            compatiblePMImage: 'dm_29.png',
            incompatiblePM: '개미는 뚠뚠 형',
            incompatiblePMReason: '안정 지향성과 도전 욕구가 상반되기 때문이에요!',
            incompatiblePMImage: 'dm_2.png',
            image: 'dm_12.png'
            },
        'BABAB': {
            pmType: '럭키비키 형',
            simpleIntro: '운도 실력이라 믿는 인간 긍정봇',
            detailedIntro: '“될 놈은 된다” 마인드의 인간 비타민. 구름끼어도 햇살 각도 찾아내는 낙관왕.',
            strengths: '위기 속에서도 낙관적인 태도로 팀의 사기를 북돋우며, 긍정의 힘으로 협업 분위기를 유연하고 따뜻하게 만들어갑니다.',
            improvements: '낙관적 시선이 현실적 실행을 흐릴 수 있어, 세부 관리와 실질적인 계획 수립에 더 집중할 필요가 있습니다.',
            compatiblePM: '침착맨 형',
            compatiblePMReason: '현실적 안정감이 긍정을 균형 있게 해줘요!',
            compatiblePMImage: 'dm_23.png',
            incompatiblePM: '개미는 뚠뚠 형',
            incompatiblePMReason: '변화 속도에 온도차가 크기 때문이에요!',
            incompatiblePMImage: 'dm_2.png',
            image: 'dm_11.png'
            },
        'BABBA': {
            pmType: '불속성 형',
            simpleIntro: '실행력만 보면 프로젝트 파이터',
            detailedIntro: '스타트 신호 들리면 바로 풀스로틀. 일단 박고 보는 추진력으로 길을 만든다.',
            strengths: '압도적인 추진력과 결단력으로 프로젝트를 신속하게 완수하며, 위기 상황에서도 주저하지 않고 방향을 제시합니다.',
            improvements: '실행 중심 태도가 감정적 균형을 해칠 수 있어, 팀원의 의견을 경청하고 공감하는 노력이 필요합니다.',
            compatiblePM: '관짝소년단 형',
            compatiblePMReason: '유머와 도전정신이 서로를 자극해요!',
            compatiblePMImage: 'dm_31.png',
            incompatiblePM: '할래말래 형',
            incompatiblePMReason: '즉시 행동을 요구하는 스타일과 맞지 않아요!',
            incompatiblePMImage: 'dm_25.png',
            image: 'dm_10.png'
            },
        'BABBB': {
            pmType: '핵인싸 형',
            simpleIntro: '네트워크로 세상 다 아는 인간 링크드인',
            detailedIntro: '커피 챗부터 밥 약속까지 네트워크가 망처럼. 사람 연결로 기회도 같이 당겨온다.',
            strengths: '유쾌한 소통과 친화력으로 협업 분위기를 이끌고, 외부 네트워크를 활용해 팀의 기회를 확장시킬 수 있습니다.',
            improvements: '친화력에 치중하다 보면 일정 관리가 느슨해질 수 있어, 체계적인 시간 관리 습관을 유지해야 합니다.',
            compatiblePM: '두뇌풀가동 형',
            compatiblePMReason: '체계와 네트워크가 시너지를 만들어요!',
            compatiblePMImage: 'dm_7.png',
            incompatiblePM: '간디작살 형',
            incompatiblePMReason: '과한 에너지가 집중을 깨기 때문이에요!',
            incompatiblePMImage: 'dm_17.png',
            image: 'dm_9.png'
            },
        'BBAAA': {
            pmType: '알파메일 형',
            simpleIntro: '리더십도 스피드도 MAX, 카리스마 과다',
            detailedIntro: '“일단 가자” 한 마디에 보드가 돈다. 기준 선명, 결단 빠른 드라이브 리더.',
            strengths: '탁월한 판단력과 추진력으로 목표를 신속히 달성하고, 명확한 기준으로 프로젝트를 체계적으로 이끌어갑니다.',
            improvements: '리더십이 강할수록 팀 의견이 묵살될 수 있으니, 감정적 유연성과 경청 태도를 함께 기르는 것이 중요합니다.',
            compatiblePM: '싹싹김치 형',
            compatiblePMReason: '체계적 커뮤니케이션이 리더십을 보완해줘요!',
            compatiblePMImage: 'dm_5.png',
            incompatiblePM: '칠가이 형',
            incompatiblePMReason: '서로 주도권이 부딪힐 수 있어요!',
            incompatiblePMImage: 'dm_14.png',
            image: 'dm_8.png'
            },
        'BBAAB': {
            pmType: '두뇌풀가동 형',
            simpleIntro: '생각의 CPU 풀로드 중',
            detailedIntro: '가설-검증-정리의 3콤보로 판 깔고 가는 타입. 데이터로 방향판 흔들림 없이 직진.',
            strengths: '분석력과 데이터 기반 사고로 명확한 방향을 제시하고, 복잡한 문제도 체계적으로 해결하는 전략적 능력을 가집니다.',
            improvements: '감정적 교류가 부족하면 팀의 몰입이 떨어질 수 있으므로, 따뜻한 피드백과 공감 표현을 강화할 필요가 있습니다.',
            compatiblePM: '무야호 형',
            compatiblePMReason: '감정 에너지를 보완해줘요!',
            compatiblePMImage: 'dm_4.png',
            incompatiblePM: '멈춰! 형',
            incompatiblePMReason: '즉흥성과 논리가 충돌하기 때문이에요!',
            incompatiblePMImage: 'dm_1.png',
            image: 'dm_7.png'
            },
        'BBABA': {
            pmType: '알파메일 형',
            simpleIntro: '기준 없으면 못 살아, 룰러 인간',
            detailedIntro: '감정보다 규칙, 감성보다 프로세스. ‘근거 pls?’가 자동으로 나오는 실무 현실주의자.',
            typeDescription: '기준과 프로세스를 중시하는 현실주의형 PM',
            strengths: '명확한 기준과 프로세스로 일관성 있는 결과를 내며, 감정보다 성과를 중시해 프로젝트의 효율을 극대화합니다.',
            improvements: '공감 능력이 부족해 조직 내 유연성이 떨어질 수 있으니, 감정적 소통을 통해 리더십의 온도를 높여야 합니다.',
            compatiblePM: '싹싹김치 형',
            compatiblePMReason: '정리력과 커뮤니케이션이 리더십을 보완해줘요!',
            compatiblePMImage: 'dm_5.png',
            incompatiblePM: '멈춰! 형',
            incompatiblePMReason: '즉흥적 감정형과 기준 중심형이 충돌하기 때문이에요!',
            incompatiblePMImage: 'dm_1.png',
            image: 'dm_6.png'
            },
        'BBABB': {
            pmType: '싹싹김치 형',
            simpleIntro: 'PPT도, 말투도, 인생도 깔끔하게',
            detailedIntro: '말은 또렷, 문서는 또박. 정리 한 번이면 회의록이 데크가 되는 깔끔미 장인.',
            strengths: '뛰어난 정리력과 커뮤니케이션 능력으로 복잡한 프로젝트를 명확하게 정리하고, 팀의 방향성을 안정적으로 이끕니다.',
            improvements: '지나친 논리 중심 접근은 차가워 보일 수 있어, 공감과 따뜻한 피드백을 병행하는 노력이 필요합니다.',
            compatiblePM: '알파메일 형',
            compatiblePMReason: '명확한 피드백으로 리더십을 보완해줘요!',
            compatiblePMImage: 'dm_8.png',
            incompatiblePM: '무야호 형',
            incompatiblePMReason: '감정 과다형 에너지를 버거워하기 때문이에요!',
            incompatiblePMImage: 'dm_4.png',
            image: 'dm_5.png'
            },
        'BBBAA': {
            pmType: '무야호 형',
            simpleIntro: '팀 분위기 올릴 땐 역시 이 형이 무야~호!',
            detailedIntro: '회의실에 들어오는 순간 텐션상승 버튼 ON. 긍정 드립으로 팀 템포를 끌어올린다.',
            strengths: '유쾌한 태도와 긍정 에너지로 팀의 긴장을 풀어주며, 어려운 상황에서도 분위기를 전환해 협업 효율을 높입니다.',
            improvements: '낙관적인 태도에만 의존하면 실행력이 떨어질 수 있으므로, 구체적 목표와 계획 수립에 집중할 필요가 있습니다.',
            compatiblePM: '두뇌풀가동 형',
            compatiblePMReason: '논리와 열정이 균형을 이룸!',
            compatiblePMImage: 'dm_7.png',
            incompatiblePM: '싹싹김치 형',
            incompatiblePMReason: '감정 표현이 과도하게 느껴질 수 있어요!',
            incompatiblePMImage: 'dm_5.png',
            image: 'dm_4.png'
            },
        'BBBAB': {
            pmType: '나니가스키 형',
            simpleIntro: '감정선에 와이파이 꽂힌 인간 공감기기',
            detailedIntro: '사람 온도에 민감한 감성 스캐너. 팀 마음 먼저 읽고 공감으로 흐름을 부드럽게 만든다.',
            strengths: '높은 공감력과 몰입력을 바탕으로 팀원들의 신뢰를 얻고, 감정적인 유대감을 통해 협업 분위기를 부드럽게 이끍니다.',
            improvements: '감정 중심의 판단으로 논리적 근거가 약해질 수 있어, 문제를 구조적으로 분석하는 습관이 필요합니다.',
            compatiblePM: '이건 첫번째 레슨 형',
            compatiblePMReason: '논리적 프레임이 방향성을 잡아줘요!',
            compatiblePMImage: 'dm_20.png',
            incompatiblePM: '알파메일 형',
            incompatiblePMReason: '강한 리더십이 위압적으로 느껴질 수 있어요!',
            incompatiblePMImage: 'dm_8.png',
            image: 'dm_3.png'
            },
        'BBBBA': {
            pmType: '개미는 뚠뚠 형',
            simpleIntro: '오늘도 성실 근무 중... 인생은 루틴이다',
            detailedIntro: '오늘도 체크리스트에 체크-체크. 조용히 꾸준히, 믿고 맡기는 팀의 기본기 담당.',
            strengths: '꾸준한 실행력과 책임감으로 팀의 신뢰를 얻으며, 장기적인 프로젝트에서도 안정적인 결과를 만들어내는 힘이 있습니다.',
            improvements: '안정에 집중하다 보면 창의적 접근이 부족할 수 있어, 새로운 시도를 적극적으로 받아들이는 태도가 필요합니다.',
            compatiblePM: '멈춰! 형',
            compatiblePMReason: '감정적 에너지가 활력을 더해줘요!',
            compatiblePMImage: 'dm_1.png',
            incompatiblePM: '럭키비키 형',
            incompatiblePMReason: '변화 속도가 맞지 않아요!',
            incompatiblePMImage: 'dm_11.png',
            image: 'dm_2.png'
            },
        'BBBBB': {
            pmType: '멈춰! 형',
            simpleIntro: '감정 먼저 폭주, 논리는 나중 탑승',
            detailedIntro: '감정이 먼저 튀지만 그게 또 매력. 번뜩이는 직감으로 분위기 스위치 꽂는 하이텐션 리더.',
            strengths: '진심 어린 열정과 빠른 반응력으로 팀의 사기를 끌어올리며, 위기 상황에서도 강한 추진력으로 프로젝트를 이끌어갑니다.',
            improvements: '감정 기복이 판단력에 영향을 미칠 수 있어, 객관성을 유지하며 냉정한 시선을 훈련하는 것이 필요합니다.',
            compatiblePM: '개미는 뚠뚠 형',
            compatiblePMReason: '안정감 있는 파트너가 속도를 맞춰줘요!',
            compatiblePMImage: 'dm_2.png',
            incompatiblePM: '두뇌풀가동 형',
            incompatiblePMReason: '과한 열정이 논리형을 불편하게 할 수 있어요!',
            incompatiblePMImage: 'dm_7.png',
            image: 'dm_1.png'
            }

    };
    
    // 패턴 검증
    if (pattern.length !== 5) {
        console.error('❌ 패턴 길이가 올바르지 않습니다:', pattern, '길이:', pattern.length);
        return pmTypes['AAAAA'];
    }
    
    const result = pmTypes[pattern];
    if (!result) {
        console.error('❌ 패턴을 찾을 수 없습니다:', pattern);
        console.error('❌ 사용 가능한 패턴들:', Object.keys(pmTypes));
        // 패턴을 찾을 수 없는 경우 첫 번째 유형 반환
        return pmTypes['AAAAA'];
    }
    
    console.log('✅ 매칭된 PM 유형:', result.pmType);
    console.log('✅ 유형 설명:', result.typeDescription);
    console.log('✅ 이미지:', result.image);
    return result;
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
