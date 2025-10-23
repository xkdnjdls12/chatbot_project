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
            simpleIntro: '창의성과 트렌드 감각을 갖춘 예술형 PM',
            detailedIntro: '독창적 아이디어와 감각적 표현으로 프로젝트에 활기를 불어넣는 크리에이티브 리더. 하지만 집중력 유지에는 어려움이 있음.',
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
            simpleIntro: '유머와 회복탄력성을 가진 낙관형 PM',
            detailedIntro: '힘든 상황에서도 웃음을 잃지 않고 팀의 긴장을 완화하는 분위기 메이커형 리더. 다만 계획성은 다소 부족할 수 있음.',
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
            simpleIntro: '창의성과 순발력을 갖춘 감각형 PM',
            detailedIntro: '즉각적인 반응력과 재치로 팀의 아이디어를 이끌지만, 장기 계획엔 약함.',
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
            simpleIntro: '깊은 지식과 분석력을 갖춘 정보형 PM',
            detailedIntro: '다방면의 정보를 바탕으로 체계적인 계획을 세우지만, 실행 속도는 느림.',
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
            simpleIntro: '직관과 통찰을 기반으로 빠른 판단을 내리는 전략형 PM',
            detailedIntro: '분석력과 통찰력이 뛰어나 의사결정이 빠르지만, 감정적 유연성은 낮음.',
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
            simpleIntro: '도전정신과 속도를 중시하는 실험형 PM',
            detailedIntro: '새로운 시도에 적극적이며 피드백을 빠르게 반영하지만, 지속력은 약함.',
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
            simpleIntro: '감정과 이성의 균형을 유지하는 안정형 PM',
            detailedIntro: '논리와 공감을 적절히 조화시켜 균형 잡힌 리더십을 발휘하지만, 속도감은 떨어질 수 있음.',
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
            simpleIntro: '유연한 사고와 중재력을 갖춘 협상형 PM',
            detailedIntro: '갈등 상황을 조율하는 능력이 뛰어나지만, 결단이 늦을 때가 있음.',
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
            simpleIntro: '온화함과 유연한 대처를 갖춘 조화형 PM',
            detailedIntro: '부드러운 태도로 갈등을 완화하며 팀의 평화를 유지하지만, 주도성이 약함.',
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
            simpleIntro: '냉정한 판단력과 위기 대응력이 강한 현실형 PM',
            detailedIntro: '감정보다 사실을 우선하며 위기 상황에서 침착함을 유지함. 감정 교류는 약한 편임.',
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
            simpleIntro: '따뜻한 공감과 감정 케어 중심의 감성형 PM',
            detailedIntro: '팀원의 감정을 세심히 살피며, 부드럽고 포용력 있는 리더십을 보임. 다만 논리적 근거 제시는 부족할 수 있음.',
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
            simpleIntro: '데이터와 효율 중심의 논리형 PM',
            detailedIntro: '수치와 근거를 기반으로 합리적 결정을 내리지만, 감정 교류에는 서툼.',
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
            simpleIntro: '논리와 원칙 중심의 분석형 PM',
            detailedIntro: '체계적 사고로 문제를 정리하고 방향을 제시하지만, 감정적 유연성은 부족함.',
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
            simpleIntro: '균형 잡힌 사고로 갈등을 조율하는 중재형 PM',
            detailedIntro: '감정과 논리의 균형을 유지하며 상황을 조화롭게 이끌지만, 결단이 약할 수 있음.',
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
            simpleIntro: '감정 안정과 공감력을 가진 온화형 PM',
            detailedIntro: '공감 능력이 높고 부드러운 리더십을 통해 팀의 분위기를 안정시킴. 그러나 결단력이 부족할 수 있음.',
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
            simpleIntro: '내면의 평정심과 통찰력을 갖춘 사색형 PM',
            detailedIntro: '조용하지만 통찰력 있는 리더십으로 팀의 중심을 잡음. 다만 외향적 추진력은 약함.',
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
        // BAAAA 패턴들
        'BAAAA': {
            pmType: '선배 마라탕 사주세요 형',
            simpleIntro: '실무 감각과 친화력을 갖춘 실행형 PM',
            detailedIntro: '경험을 바탕으로 현실적 문제 해결에 강하지만, 전략적 사고는 약함.',
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
            simpleIntro: '즉흥 대응력과 위기 대처력이 뛰어난 상황형 PM',
            detailedIntro: '돌발 상황에서도 빠른 판단으로 문제를 해결하지만, 장기적 계획에는 약함.',
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
            simpleIntro: '냉정한 판단력과 센스를 갖춘 현실주의형 PM',
            detailedIntro: '상황을 객관적으로 분석하며, 감정에 휘둘리지 않고 결정을 내림. 다만 피드백이 차갑게 들릴 수 있음.',
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
            simpleIntro: '따뜻함과 친근함으로 팀을 이끄는 감성형 PM',
            detailedIntro: '부드럽고 다정한 리더십으로 구성원을 포용하지만, 목표 집중도가 떨어질 때가 있음.',
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
            simpleIntro: '끊임없는 성장과 발전을 추구하는 도전형 PM',
            detailedIntro: '자기계발에 열정적이며 새로운 기회를 끊임없이 찾는 추진형 리더. 그러나 완성도보다는 속도를 중시함.',
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
            simpleIntro: '긍정과 낙관으로 팀을 이끄는 희망형 PM',
            detailedIntro: '어려운 상황에서도 긍정적인 시각을 유지하며, 주변 사람들에게 밝은 에너지를 전함. 다만 현실적 디테일에는 약할 수 있음.',
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
            simpleIntro: '빠르고 강한 실행력을 갖춘 추진형 PM',
            detailedIntro: '목표를 세우면 끝까지 밀어붙이는 추진력의 상징. 다만 감정 배려는 부족함.',
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
            simpleIntro: '관계 중심의 네트워커형 PM',
            detailedIntro: '사람들과의 소통이 활발하고 분위기를 살리는 능력이 뛰어나지만, 일정 관리엔 약함.',
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
        // BBAAAA 패턴들
        'BBAAA': {
            pmType: '알파메일 형',
            simpleIntro: '카리스마와 추진력을 갖춘 리더형 PM',
            detailedIntro: '명확한 기준과 빠른 판단으로 팀을 이끄는 전략적 리더. 감정적 배려는 부족할 수 있음.',
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
            simpleIntro: '논리와 구조 중심의 전략형 PM',
            detailedIntro: '객관적 분석과 합리적 판단을 기반으로 체계적으로 일하지만, 감정적 유연성은 부족함.',
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
            simpleIntro: '기준과 프로세스를 중시하는 현실주의형 PM',
            detailedIntro: '감정보다는 효율과 성과를 우선하며, 실용적 사고로 팀을 운영함. 그러나 인간적 유연성은 부족함.',
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
            simpleIntro: '깔끔한 소통과 정리력을 갖춘 커뮤니케이터형 PM',
            detailedIntro: '명확한 언어와 체계적 정리로 협업 효율을 높이는 리더. 다만 감정 표현은 서툴 수 있음.',
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
            simpleIntro: '긍정 에너지로 팀을 이끄는 분위기메이커형 PM',
            detailedIntro: '밝고 유쾌하며 주변을 웃게 하지만 체계적 사고엔 약함.',
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
            simpleIntro: '감정선이 깊고 인간미 넘치는 감성형 PM',
            detailedIntro: '공감력이 높고 팀 분위기를 따뜻하게 만들지만, 구조적 사고는 다소 약함.',
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
            simpleIntro: '꾸준함과 성실함으로 신뢰를 쌓는 안정형 PM',
            detailedIntro: '목표를 향해 묵묵히 나아가며 팀 내 신뢰를 형성함. 새로운 시도엔 다소 보수적일 수 있음.',
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
            simpleIntro: '감정과 직감을 먼저 따르는 즉흥형 PM',
            detailedIntro: '열정이 넘치고 진심이 깊지만 감정의 진폭이 커서 조급해질 때가 있음. 빠르게 반응하고 팀을 이끄는 에너지형 리더.',
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
