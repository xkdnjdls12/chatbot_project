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
        
        if (hasReasons) {
            // 이유가 1개 이상 작성된 경우 - LLM 분석
            console.log('🤖 OpenAI API 호출 시작...');
            const analysisResult = await callOpenAIAnalysis(userData.reasons);
            console.log('✅ AI 분석 결과:', analysisResult);
            
            // 결과를 로컬 스토리지에 저장
            localStorage.setItem('analysisResult', analysisResult);
            localStorage.setItem('feedbackType', 'withReasons'); // 이유 작성됨 표시
            console.log('💾 분석 결과 저장 완료');
        } else {
            // 이유가 모두 미작성된 경우 - 고정값 피드백
            console.log('📋 고정값 피드백 사용');
            const fixedFeedback = getFixedFeedback(userData.choices);
            localStorage.setItem('analysisResult', JSON.stringify(fixedFeedback));
            localStorage.setItem('feedbackType', 'withoutReasons'); // 이유 미작성 표시
            console.log('💾 고정 피드백 저장 완료');
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
            content: `당신은 PM 전문가입니다. 사용자가 5개 시나리오에서 입력한 주관식 답변을 분석하여 개인화된 피드백을 생성해주세요.

**피드백 생성 원칙:**
1. AI맞춤분석: 사용자의 전반적 성향을 2~3문장으로 요약 (40자 이상 60자 이내)
2. 나만의강점: 주관식 이유에서 도출된 긍정적 특징을 3개 이하, 문장 형식으로 표현 (40자 이상 60자 이내)
3. 내가보완할부분: 선택 간의 불균형 또는 단점 가능성을 3개 이하 요약, 문장 형식으로 표현 (40자 이상 60자 이내)

**응답 형식:**
AI맞춤분석: [2~3문장 요약, 40-60자]
나만의강점: [긍정적 특징 3개 이하, 40-60자]
내가보완할부분: [개선점 3개 이하, 40-60자]

한국어로 응답하고, 각 섹션은 명확하게 구분해주세요.`
        },
        {
            role: "user",
            content: `사용자가 5개 시나리오에서 입력한 주관식 답변들:\n${allReasons}\n\n이 답변들을 종합하여 개인화된 PM 분석을 제공해주세요.`
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

// 고정값 피드백 생성
function getFixedFeedback(choices) {
    console.log('🔍 선택지 분석 중:', choices);
    
    // 선택지 패턴에 따른 고정 피드백 매칭
    const choicePattern = analyzeChoicePattern(choices);
    console.log('📊 분석된 패턴:', choicePattern);
    
    const feedback = {
        pmType: choicePattern.pmType,
        typeDescription: choicePattern.typeDescription,
        strengths: choicePattern.strengths,
        improvements: choicePattern.improvements,
        compatiblePM: choicePattern.compatiblePM,
        incompatiblePM: choicePattern.incompatiblePM
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
        
        console.warn(`⚠️ 매칭되지 않은 선택지: ${text}`);
        return 'A'; // 기본값
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
            typeDescription: '창의성과 트렌드 감각을 갖춘 예술형 PM',
            strengths: '예술적 감각과 독창적인 아이디어로 새로운 흐름을 제시하며, 팀에 영감을 주는 창의적 리더십을 발휘합니다.',
            improvements: '몰입이 짧아 일관성이 떨어질 수 있으므로, 루틴화된 일정 관리로 집중력을 유지해야 합니다.',
            compatiblePM: '침착맨 형',
            incompatiblePM: '개미는 뚠뚠 형',
            image: 'dm_32.png'
        },
        'AAAAB': {
            pmType: '관짝 소년단 형',
            typeDescription: '유머와 회복탄력성을 가진 낙관형 PM',
            strengths: '긍정적인 유머와 유연한 사고로 팀의 사기를 높이고, 위기 속에서도 즐거운 분위기를 만들어 협업을 촉진합니다.',
            improvements: '즉흥적인 태도가 장기 계획을 흔들 수 있으므로, 목표를 구체화하고 일정 관리에 신경 써야 합니다.',
            compatiblePM: '불속성 형',
            incompatiblePM: '침착맨 형',
            image: 'dm_31.png'
        },
        'AAABA': {
            pmType: '센스만점 형',
            typeDescription: '창의성과 순발력을 갖춘 감각형 PM',
            strengths: '뛰어난 직감과 유연한 사고로 창의적인 아이디어를 제시하며, 새로운 관점을 통해 프로젝트에 활력을 불어넣습니다.',
            improvements: '단기적인 성과에 집중하면 지속성이 떨어질 수 있으므로, 장기적 계획을 세워 균형을 잡는 노력이 필요합니다.',
            compatiblePM: '침착맨 형',
            incompatiblePM: '두뇌풀가동 형',
            image: 'dm_30.png'
        },
        'AAABB': {
            pmType: '알쓸신잡 형',
            typeDescription: '깊은 지식과 분석력을 갖춘 정보형 PM',
            strengths: '폭넓은 지식과 구조적 사고로 문제의 본질을 꿰뚫으며, 장기적 전략을 세우는 데 탁월한 역량을 보입니다.',
            improvements: '지식 중심 접근이 실행력을 저하시킬 수 있어, 실천 중심의 행동 리더십을 보완해야 합니다.',
            compatiblePM: '나는 아직 배고프다 형',
            incompatiblePM: '괜차나 형',
            image: 'dm_29.png'
        },
        'AABAA': {
            pmType: '넥 슬라이스 형',
            typeDescription: '직관과 통찰을 기반으로 빠른 판단을 내리는 전략형 PM',
            strengths: '날카로운 통찰과 빠른 판단으로 복잡한 문제를 단시간에 해결하며, 효율적인 전략 수립에 강점을 보입니다.',
            improvements: '논리 중심의 사고가 감정 교류를 약화시킬 수 있어, 관계 중심의 소통을 의식적으로 강화해야 합니다.',
            compatiblePM: '무한도전 형',
            incompatiblePM: '낋여오거라 형',
            image: 'dm_28.png'
        },
        'AABAB': {
            pmType: '무한도전 형',
            typeDescription: '도전정신과 속도를 중시하는 실험형 PM',
            strengths: '도전정신과 추진력을 기반으로 빠르게 실행하며, 새로운 아이디어를 실험해 혁신을 만들어냅니다.',
            improvements: '실행 속도에 비해 완성도가 낮을 수 있으므로, 세밀한 관리와 지속력 향상에 힘써야 합니다.',
            compatiblePM: '넥슬라이스 형',
            incompatiblePM: '괜차나 형',
            image: 'dm_27.png'
        },
        'AABBA': {
            pmType: '0친자 형',
            typeDescription: '감정과 이성의 균형을 유지하는 안정형 PM',
            strengths: '논리와 공감을 조화롭게 활용해 팀의 신뢰를 얻으며, 갈등 상황에서도 차분하게 균형을 유지합니다.',
            improvements: '신중함이 지나치면 결정이 늦어질 수 있으니, 때로는 과감한 실행력으로 속도를 내야 합니다.',
            compatiblePM: '이건 첫번째 레슨 형',
            incompatiblePM: '불속성 형',
            image: 'dm_26.png'
        },
        'AABBB': {
            pmType: '할래말래? 형',
            typeDescription: '유연한 사고와 중재력을 갖춘 협상형 PM',
            strengths: '다양한 관점을 수용하며 조화로운 협업을 이끌고, 유연한 사고로 팀 내 갈등을 자연스럽게 완화시킵니다.',
            improvements: '과도한 신중함이 기회를 놓치게 할 수 있어, 빠른 결단과 추진력을 키우는 노력이 필요합니다.',
            compatiblePM: '낋여오거라 형',
            incompatiblePM: '불속성 형',
            image: 'dm_25.png'
        },
        'ABAAA': {
            pmType: '넘어갈게요 형',
            typeDescription: '온화함과 유연한 대처를 갖춘 조화형 PM',
            strengths: '유연한 사고와 부드러운 소통으로 팀의 긴장을 완화시키며, 협업 속에서 안정감을 형성하는 능력이 있습니다.',
            improvements: '과도한 배려로 결단력이 약해질 수 있어, 명확한 기준과 책임감 있는 의사결정이 필요합니다.',
            compatiblePM: '개미는 뚠뚠 형',
            incompatiblePM: '무야호 형',
            image: 'dm_24.png'
        },
        'ABAAB': {
            pmType: '침착man~ 형',
            typeDescription: '냉정한 판단력과 위기 대응력이 강한 현실형 PM',
            strengths: '혼란스러운 상황에서도 흔들리지 않는 냉정함으로 위기를 수습하고, 논리적인 판단으로 문제 해결을 주도합니다.',
            improvements: '감정 표현 부족이 팀의 몰입을 떨어뜨릴 수 있어, 따뜻한 피드백과 인정 표현을 의식적으로 늘려야 합니다.',
            compatiblePM: '골반이 멈추지 않아 형',
            incompatiblePM: '관짝소년단 형',
            image: 'dm_23.png'
        },
        'ABABA': {
            pmType: '낋여오거라~ 형',
            typeDescription: '따뜻한 공감과 감정 케어 중심의 감성형 PM',
            strengths: '팀원들의 감정을 섬세하게 읽고 배려하며, 따뜻한 공감으로 팀의 결속력과 안정감을 높이는 리더십을 보여줍니다.',
            improvements: '감정에 집중하다 보면 판단이 흐려질 수 있어, 논리와 데이터 기반 접근을 병행하는 훈련이 필요합니다.',
            compatiblePM: '럭키비키 형',
            incompatiblePM: '넥슬라이스 형',
            image: 'dm_22.png'
        },
        'ABABB': {
            pmType: '너 T야? 형',
            typeDescription: '데이터와 효율 중심의 논리형 PM',
            strengths: '객관적 데이터와 논리에 기반해 명확한 판단을 내리며, 효율적인 의사결정으로 프로젝트의 완성도를 높입니다.',
            improvements: '수치 중심의 접근이 인간적인 교류를 약화시킬 수 있으므로, 감정적 피드백과 공감을 병행해야 합니다.',
            compatiblePM: '낋여오거라 형',
            incompatiblePM: '무야호 형',
            image: 'dm_21.png'
        },
        'ABBAA': {
            pmType: '이건 첫번째 레슨~ 형',
            typeDescription: '논리와 원칙 중심의 분석형 PM',
            strengths: '논리적 사고와 명확한 기준으로 프로젝트를 안정적으로 관리하며, 체계적 프레임으로 혼란을 정리합니다.',
            improvements: '감정 공감 부족이 팀 분위기를 경직시킬 수 있으므로, 유연한 대화와 피드백 방식을 익혀야 합니다.',
            compatiblePM: '선배 마라탕사주세요 형',
            incompatiblePM: '불속성 형',
            image: 'dm_20.png'
        },
        'ABBAB': {
            pmType: '이븐하게 익었어요 형',
            typeDescription: '균형 잡힌 사고로 갈등을 조율하는 중재형 PM',
            strengths: '감정과 논리를 고르게 조율해 갈등을 부드럽게 해결하며, 협업의 조화를 이끌어내는 안정적 리더십을 가집니다.',
            improvements: '지나치게 중립적인 태도가 결정력을 약화시킬 수 있어, 때로는 단호한 판단이 필요합니다.',
            compatiblePM: '간디작살 형',
            incompatiblePM: '멈춰! 형',
            image: 'dm_19.png'
        },
        'ABBBA': {
            pmType: '괜차나...닝닝닝닝 형',
            typeDescription: '감정 안정과 공감력을 가진 온화형 PM',
            strengths: '팀의 감정 변화를 세심히 살피며 긴장을 완화하고, 부드러운 소통으로 안정적인 협업 분위기를 만듭니다.',
            improvements: '갈등 상황에서 결정을 미루면 리더십이 약해질 수 있으므로, 명확한 기준과 결단력을 강화해야 합니다.',
            compatiblePM: '낋여오거라 형',
            incompatiblePM: '알쓸신잡 형',
            image: 'dm_18.png'
        },
        'ABBBB': {
            pmType: '간디작살 형',
            typeDescription: '내면의 평정심과 통찰력을 갖춘 사색형 PM',
            strengths: '깊은 통찰력과 평정심으로 팀의 균형을 잡으며, 차분한 리더십으로 신뢰와 안정감을 만들어냅니다.',
            improvements: '소극적인 표현으로 존재감이 약해질 수 있으니, 주도적으로 의견을 제시하는 연습이 필요합니다.',
            compatiblePM: '이븐하게 익었어요 형',
            incompatiblePM: '핵인싸 형',
            image: 'dm_17.png'
        },
        // BAAAA 패턴들
        'BAAAA': {
            pmType: '선배 마라탕 사주세요 형',
            typeDescription: '실무 감각과 친화력을 갖춘 실행형 PM',
            strengths: '실무 중심의 판단과 행동력으로 문제를 빠르게 해결하며, 현실적인 접근으로 팀의 신뢰를 단단히 쌓습니다.',
            improvements: '단기 실행에 집중하다 보면 전략적 시야가 약해질 수 있으니, 장기 계획 수립 능력을 함께 길러야 합니다.',
            compatiblePM: '이건 첫번째 레슨 형',
            incompatiblePM: '침착맨 형',
            image: 'dm_16.png'
        },
        'BAAAB': {
            pmType: '형이 왜 거기서 나와...? 형',
            typeDescription: '즉흥 대응력과 위기 대처력이 뛰어난 상황형 PM',
            strengths: '빠른 판단력과 순발력으로 예기치 못한 문제를 즉시 해결하며, 위기 속에서도 유연하게 대응하는 능력을 보입니다.',
            improvements: '즉흥적 해결에 익숙해 장기 전략이 부족할 수 있으니, 계획 수립과 지속적 방향 설정에 힘써야 합니다.',
            compatiblePM: '나는 아직 배고프다 형',
            incompatiblePM: '두뇌풀가동 형',
            image: 'dm_15.png'
        },
        'BAAAB': {
            pmType: '칠가이 형',
            typeDescription: '냉정한 판단력과 센스를 갖춘 현실주의형 PM',
            strengths: '차분하고 명확한 사고로 복잡한 문제를 효율적으로 정리하며, 감정에 흔들리지 않는 결단력으로 위기를 극복합니다.',
            improvements: '직설적인 피드백이 냉정하게 들릴 수 있으므로, 부드러운 언어와 공감적 소통을 병행하는 것이 좋습니다.',
            compatiblePM: '무한도전 형',
            incompatiblePM: '알파메일 형',
            image: 'dm_14.png'
        },
        'BAABB': {
            pmType: '어서오고~ 형',
            typeDescription: '따뜻함과 친근함으로 팀을 이끄는 감성형 PM',
            strengths: '팀원의 감정을 세심히 살피며 공감과 포용으로 신뢰를 쌓고, 긍정적인 협업 분위기를 조성하는 능력이 뛰어납니다.',
            improvements: '인간관계에 집중하다 보면 목표 의식이 약해질 수 있어, 명확한 성과 기준을 병행하는 태도가 필요합니다.',
            compatiblePM: '두뇌풀가동 형',
            incompatiblePM: '무한도전 형',
            image: 'dm_13.png'
        },
        'BABAA': {
            pmType: '나는 아직 배고프다 형',
            typeDescription: '끊임없는 성장과 발전을 추구하는 도전형 PM',
            strengths: '강한 성장 욕구와 추진력으로 팀을 끌어올리며, 끊임없이 개선과 도전을 추구해 프로젝트의 변화를 이끌어냅니다.',
            improvements: '속도에 집중하다 보면 세부 완성도가 떨어질 수 있어, 실행 후 피드백과 디테일 검증이 중요합니다.',
            compatiblePM: '알쓸신잡 형',
            incompatiblePM: '개미는 뚠뚠 형',
            image: 'dm_12.png'
        },
        'BABAB': {
            pmType: '럭키비키 형',
            typeDescription: '긍정과 낙관으로 팀을 이끄는 희망형 PM',
            strengths: '위기 속에서도 낙관적인 태도로 팀의 사기를 북돋우며, 긍정의 힘으로 협업 분위기를 유연하고 따뜻하게 만들어갑니다.',
            improvements: '낙관적 시선이 현실적 실행을 흐릴 수 있어, 세부 관리와 실질적인 계획 수립에 더 집중할 필요가 있습니다.',
            compatiblePM: '침착맨 형',
            incompatiblePM: '개미는 뚠뚠 형',
            image: 'dm_11.png'
        },
        'BABBA': {
            pmType: '불속성 형',
            typeDescription: '빠르고 강한 실행력을 갖춘 추진형 PM',
            strengths: '압도적인 추진력과 결단력으로 프로젝트를 신속하게 완수하며, 위기 상황에서도 주저하지 않고 방향을 제시합니다.',
            improvements: '실행 중심 태도가 감정적 균형을 해칠 수 있어, 팀원의 의견을 경청하고 공감하는 노력이 필요합니다.',
            compatiblePM: '관짝소년단 형',
            incompatiblePM: '할래말래 형',
            image: 'dm_10.png'
        },
        'BABBB': {
            pmType: '핵인싸 형',
            typeDescription: '관계 중심의 네트워커형 PM',
            strengths: '유쾌한 소통과 친화력으로 협업 분위기를 이끌고, 외부 네트워크를 활용해 팀의 기회를 확장시킬 수 있습니다.',
            improvements: '친화력에 치중하다 보면 일정 관리가 느슨해질 수 있어, 체계적인 시간 관리 습관을 유지해야 합니다.',
            compatiblePM: '두뇌풀가동 형',
            incompatiblePM: '간디작살 형',
            image: 'dm_9.png'
        },
        // BBAAAA 패턴들
        'BBAAAA': {
            pmType: '알파메일 형',
            typeDescription: '카리스마와 추진력을 갖춘 리더형 PM',
            strengths: '탁월한 판단력과 추진력으로 목표를 신속히 달성하고, 명확한 기준으로 프로젝트를 체계적으로 이끌어갑니다.',
            improvements: '리더십이 강할수록 팀 의견이 묵살될 수 있으니, 감정적 유연성과 경청 태도를 함께 기르는 것이 중요합니다.',
            compatiblePM: '싹싹김치 형',
            incompatiblePM: '칠가이 형',
            image: 'dm_8.png'
        },
        'BBAABB': {
            pmType: '두뇌풀가동 형',
            typeDescription: '논리와 구조 중심의 전략형 PM',
            strengths: '분석력과 데이터 기반 사고로 명확한 방향을 제시하고, 복잡한 문제도 체계적으로 해결하는 전략적 능력을 가집니다.',
            improvements: '감정적 교류가 부족하면 팀의 몰입이 떨어질 수 있으므로, 따뜻한 피드백과 공감 표현을 강화할 필요가 있습니다.',
            compatiblePM: '무야호 형',
            incompatiblePM: '멈춰! 형',
            image: 'dm_7.png'
        },
        'BBABAA': {
            pmType: '알파메일 형',
            typeDescription: '기준과 프로세스를 중시하는 현실주의형 PM',
            strengths: '명확한 기준과 프로세스로 일관성 있는 결과를 내며, 감정보다 성과를 중시해 프로젝트의 효율을 극대화합니다.',
            improvements: '공감 능력이 부족해 조직 내 유연성이 떨어질 수 있으니, 감정적 소통을 통해 리더십의 온도를 높여야 합니다.',
            compatiblePM: '싹싹김치 형',
            incompatiblePM: '멈춰! 형',
            image: 'dm_6.png'
        },
        'BBABBB': {
            pmType: '싹싹김치 형',
            typeDescription: '깔끔한 소통과 정리력을 갖춘 커뮤니케이터형 PM',
            strengths: '뛰어난 정리력과 커뮤니케이션 능력으로 복잡한 프로젝트를 명확하게 정리하고, 팀의 방향성을 안정적으로 이끕니다.',
            improvements: '지나친 논리 중심 접근은 차가워 보일 수 있어, 공감과 따뜻한 피드백을 병행하는 노력이 필요합니다.',
            compatiblePM: '알파메일 형',
            incompatiblePM: '무야호 형',
            image: 'dm_5.png'
        },
        'BBBAAA': {
            pmType: '무야호 형',
            typeDescription: '긍정 에너지로 팀을 이끄는 분위기메이커형 PM',
            strengths: '유쾌한 태도와 긍정 에너지로 팀의 긴장을 풀어주며, 어려운 상황에서도 분위기를 전환해 협업 효율을 높입니다.',
            improvements: '낙관적인 태도에만 의존하면 실행력이 떨어질 수 있으므로, 구체적 목표와 계획 수립에 집중할 필요가 있습니다.',
            compatiblePM: '두뇌풀가동 형',
            incompatiblePM: '싹싹김치 형',
            image: 'dm_4.png'
        },
        'BBBABB': {
            pmType: '나니가스키 형',
            typeDescription: '감정선이 깊고 인간미 넘치는 감성형 PM',
            strengths: '높은 공감력과 몰입력을 바탕으로 팀원들의 신뢰를 얻고, 감정적인 유대감을 통해 협업 분위기를 부드럽게 이끕니다.',
            improvements: '감정 중심의 판단으로 논리적 근거가 약해질 수 있어, 문제를 구조적으로 분석하는 습관이 필요합니다.',
            compatiblePM: '이건 첫번째 레슨 형',
            incompatiblePM: '알파메일 형',
            image: 'dm_3.png'
        },
        'BBBBBA': {
            pmType: '개미는 뚠뚠 형',
            typeDescription: '꾸준함과 성실함으로 신뢰를 쌓는 안정형 PM',
            strengths: '꾸준한 실행력과 책임감으로 팀의 신뢰를 얻으며, 장기적인 프로젝트에서도 안정적인 결과를 만들어내는 힘이 있습니다.',
            improvements: '안정에 집중하다 보면 창의적 접근이 부족할 수 있어, 새로운 시도를 적극적으로 받아들이는 태도가 필요합니다.',
            compatiblePM: '멈춰! 형',
            incompatiblePM: '럭키비키 형',
            image: 'dm_2.png'
        },
        'BBBBBB': {
            pmType: '멈춰! 형',
            typeDescription: '감정과 직감을 먼저 따르는 즉흥형 PM',
            strengths: '진심 어린 열정과 빠른 반응력으로 팀의 사기를 끌어올리며, 위기 상황에서도 강한 추진력으로 프로젝트를 이끌어갑니다.',
            improvements: '감정 기복이 판단력에 영향을 미칠 수 있어, 객관성을 유지하며 냉정한 시선을 훈련하는 것이 필요합니다.',
            compatiblePM: '개미는 뚠뚠 형',
            incompatiblePM: '두뇌풀가동 형',
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
