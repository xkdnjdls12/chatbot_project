// 결과 화면 JavaScript

// 페이지 로드 시 애니메이션 및 결과 로드
document.addEventListener('DOMContentLoaded', function() {
    // 카드 등장 애니메이션
    const resultCard = document.querySelector('.result-card');
    resultCard.style.opacity = '0';
    resultCard.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        resultCard.style.transition = 'all 0.6s ease';
        resultCard.style.opacity = '1';
        resultCard.style.transform = 'translateY(0)';
    }, 100);
    
    // 분석 결과 로드
    loadAnalysisResult();
    
    // 캐릭터 이미지 애니메이션
    const character = document.querySelector('.result-character');
    character.style.transform = 'scale(0.8)';
    character.style.transition = 'transform 0.5s ease';
    
    setTimeout(() => {
        character.style.transform = 'scale(1)';
    }, 300);
    
    // 분석 박스들 순차 등장
    const analysisBoxes = document.querySelectorAll('.analysis-box');
    analysisBoxes.forEach((box, index) => {
        box.style.opacity = '0';
        box.style.transform = 'translateY(20px)';
        box.style.transition = 'all 0.4s ease';
        
        setTimeout(() => {
            box.style.opacity = '1';
            box.style.transform = 'translateY(0)';
        }, 500 + (index * 200));
    });
    
    // 호환성 카드들 애니메이션
    const compatCards = document.querySelectorAll('.compatibility-card');
    compatCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        card.style.transition = 'all 0.4s ease';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        }, 1000 + (index * 150));
    });
});

// 저장하고 공유하기 버튼
function saveAndShare() {
    // 결과를 로컬 스토리지에 저장
    const resultData = {
        pmType: '알파메일 PM',
        timestamp: new Date().toISOString(),
        analysis: '높은 추진력과 결단력을 기반으로 목표를 명확히 설정하고 신속하게 실행하는 성과 중심형 리더십을 보유.'
    };
    
    localStorage.setItem('pmTestResult', JSON.stringify(resultData));
    
    // 공유 기능 (Web Share API 사용)
    if (navigator.share) {
        navigator.share({
            title: 'PM 듬이의 하루 - 테스트 결과',
            text: '나의 PM 유형은 "알파메일 PM"이에요!',
            url: window.location.href
        });
    } else {
        // 클립보드에 복사
        const shareText = `나의 PM 유형은 "알파메일 PM"이에요! PM 듬이의 하루 테스트 결과를 확인해보세요.`;
        navigator.clipboard.writeText(shareText).then(() => {
            alert('결과가 클립보드에 복사되었습니다!');
        });
    }
}

// 홈페이지 구경가기 버튼
function goHomepage() {
    // 메인 페이지로 이동
    window.location.href = 'index.html';
}

// 결과 데이터 로드 (실제 AI 분석 결과)
function loadAnalysisResult() {
    try {
        console.log('🔍 분석 결과 로드 시작...');
        
        // 로컬 스토리지에서 분석 결과 가져오기
        const analysisResult = localStorage.getItem('analysisResult');
        console.log('📊 저장된 분석 결과:', analysisResult);
        
        if (!analysisResult) {
            console.log('⚠️ 분석 결과가 없습니다. 기본 결과를 표시합니다.');
            showDefaultResult();
            return;
        }
        
        // AI 분석 결과 파싱
        console.log('🔧 분석 결과 파싱 중...');
        const parsedResult = parseAIResult(analysisResult);
        console.log('✅ 파싱된 결과:', parsedResult);
        
        // 결과 데이터를 화면에 적용
        updateResultDisplay(parsedResult);
        
    } catch (error) {
        console.error('💥 결과 로드 중 오류:', error);
        showDefaultResult();
    }
}

// AI 분석 결과 파싱
function parseAIResult(aiResult) {
    const lines = aiResult.split('\n');
    const result = {
        pmType: '알파메일 PM', // 기본값
        summary: '불필요한 감정소모는 NO!', // 기본값
        description: '모든 일엔 기준과 프로세스가 있어야 한다고 믿는 PM계의 냉철한 현실주의자.', // 기본값
        aiAnalysis: '',
        strengths: '',
        improvements: ''
    };
    
    lines.forEach(line => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('PM유형:')) {
            result.pmType = trimmedLine.replace('PM유형:', '').trim();
        } else if (trimmedLine.startsWith('AI맞춤분석:')) {
            result.aiAnalysis = trimmedLine.replace('AI맞춤분석:', '').trim();
        } else if (trimmedLine.startsWith('나만의강점:')) {
            result.strengths = trimmedLine.replace('나만의강점:', '').trim();
        } else if (trimmedLine.startsWith('내가보완할부분:')) {
            result.improvements = trimmedLine.replace('내가보완할부분:', '').trim();
        }
    });
    
    // 빈 값이면 기본값 사용
    if (!result.aiAnalysis) {
        result.aiAnalysis = '높은 추진력과 결단력을 기반으로 목표를 명확히 설정하고 신속하게 실행하는 성과 중심형 리더십을 보유.';
    }
    if (!result.strengths) {
        result.strengths = '높은 추진력과 결단력을 기반으로 목표를 명확히 설정하고 신속하게 실행하는 성과 중심형 리더십을 보유.';
    }
    if (!result.improvements) {
        result.improvements = '성과 중심 사고로 인해 공감과 피드백 수용이 다소 부족할 수 있음. 팀원 의견 반영과 소통 강화를 통해 리더십 균형 향상이 필요함.';
    }
    
    return result;
}

// 기본 결과 표시
function showDefaultResult() {
    const defaultResult = {
        pmType: '알파메일 PM',
        summary: '불필요한 감정소모는 NO!',
        description: '모든 일엔 기준과 프로세스가 있어야 한다고 믿는 PM계의 냉철한 현실주의자.',
        aiAnalysis: '높은 추진력과 결단력을 기반으로 목표를 명확히 설정하고 신속하게 실행하는 성과 중심형 리더십을 보유.',
        strengths: '높은 추진력과 결단력을 기반으로 목표를 명확히 설정하고 신속하게 실행하는 성과 중심형 리더십을 보유.',
        improvements: '성과 중심 사고로 인해 공감과 피드백 수용이 다소 부족할 수 있음. 팀원 의견 반영과 소통 강화를 통해 리더십 균형 향상이 필요함.'
    };
    
    updateResultDisplay(defaultResult);
}

// 결과 표시 업데이트
function updateResultDisplay(result) {
    // PM 유형 업데이트
    const pmTypeElement = document.querySelector('.pm-type');
    if (pmTypeElement) {
        pmTypeElement.textContent = result.pmType;
    }
    
    // 타입 설명 업데이트
    const typeDescription = document.querySelector('.type-description');
    if (typeDescription) {
        typeDescription.textContent = result.description;
    }
    
    // AI 분석 업데이트
    const aiAnalysisBox = document.querySelector('.analysis-box.ai-analysis p');
    if (aiAnalysisBox) {
        aiAnalysisBox.textContent = result.aiAnalysis;
    }
    
    // 강점 업데이트
    const strengthsBox = document.querySelector('.analysis-box.strengths p');
    if (strengthsBox) {
        strengthsBox.textContent = result.strengths;
    }
    
    // 보완점 업데이트
    const improvementsBox = document.querySelector('.analysis-box.improvements p');
    if (improvementsBox) {
        improvementsBox.textContent = result.improvements;
    }
    
    console.log('결과 표시 업데이트 완료:', result);
}
