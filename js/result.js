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
    // 천재교육 PM 부트캠프 페이지로 이동
    window.open('https://www.genia.academy/pm', '_blank');
}

// 결과 데이터 로드 (실제 AI 분석 결과)
function loadAnalysisResult() {
    try {
        console.log('🔍 분석 결과 로드 시작...');
        
        // 피드백 타입 확인
        const feedbackType = localStorage.getItem('feedbackType');
        console.log('📋 피드백 타입:', feedbackType);
        
        // 로컬 스토리지에서 분석 결과 가져오기
        const analysisResult = localStorage.getItem('analysisResult');
        console.log('📊 저장된 분석 결과:', analysisResult);
        
        if (!analysisResult) {
            console.log('⚠️ 분석 결과가 없습니다. 기본 결과를 표시합니다.');
            showDefaultResult();
            return;
        }
        
        let parsedResult;
        
        if (feedbackType === 'withReasons') {
            // 이유 작성된 경우 - AI 분석 결과 파싱
            console.log('🤖 AI 분석 결과 파싱 중...');
            parsedResult = parseAIResult(analysisResult);
        } else {
            // 이유 미작성된 경우 - 고정값 피드백 파싱
            console.log('📋 고정값 피드백 파싱 중...');
            parsedResult = JSON.parse(analysisResult);
        }
        
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
    console.log('🔧 AI 분석 결과 파싱 시작:', aiResult);
    
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
        console.log('📝 파싱 중인 라인:', trimmedLine);
        
        if (trimmedLine.startsWith('AI맞춤분석:')) {
            result.aiAnalysis = trimmedLine.replace('AI맞춤분석:', '').trim();
            console.log('✅ AI 맞춤 분석 추출:', result.aiAnalysis);
        } else if (trimmedLine.startsWith('나만의강점:')) {
            result.strengths = trimmedLine.replace('나만의강점:', '').trim();
            console.log('✅ 나만의 강점 추출:', result.strengths);
        } else if (trimmedLine.startsWith('내가보완할부분:')) {
            result.improvements = trimmedLine.replace('내가보완할부분:', '').trim();
            console.log('✅ 내가 보완할 부분 추출:', result.improvements);
        }
    });
    
    // 빈 값이면 기본값 사용
    if (!result.aiAnalysis) {
        result.aiAnalysis = '높은 추진력과 결단력을 기반으로 목표를 명확히 설정하고 신속하게 실행하는 성과 중심형 리더십을 보유.';
        console.log('⚠️ AI 맞춤 분석 기본값 사용');
    }
    if (!result.strengths) {
        result.strengths = '높은 추진력과 결단력을 기반으로 목표를 명확히 설정하고 신속하게 실행하는 성과 중심형 리더십을 보유.';
        console.log('⚠️ 나만의 강점 기본값 사용');
    }
    if (!result.improvements) {
        result.improvements = '성과 중심 사고로 인해 공감과 피드백 수용이 다소 부족할 수 있음. 팀원 의견 반영과 소통 강화를 통해 리더십 균형 향상이 필요함.';
        console.log('⚠️ 내가 보완할 부분 기본값 사용');
    }
    
    console.log('✅ 최종 파싱 결과:', result);
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
    console.log('📊 결과 표시 업데이트 시작:', result);
    
    // PM 유형 업데이트
    const pmTypeElement = document.querySelector('.pm-type');
    if (pmTypeElement) {
        pmTypeElement.textContent = result.pmType;
        console.log('✅ PM 유형 업데이트:', result.pmType);
    }
    
    // 간단 소개 업데이트 (summary 대신 간단 소개 사용)
    const summaryElement = document.querySelector('.type-summary h3');
    if (summaryElement && result.simpleIntro) {
        summaryElement.textContent = result.simpleIntro;
        console.log('✅ 간단 소개 업데이트:', result.simpleIntro);
    }
    
    // 자세한 소개 업데이트 (description 대신 자세한 소개 사용)
    const typeDescription = document.querySelector('.type-description');
    if (typeDescription) {
        typeDescription.textContent = result.detailedIntro || result.description || result.typeDescription;
        console.log('✅ 자세한 소개 업데이트:', result.detailedIntro || result.description);
    }
    
    // 유형별 이미지 업데이트
    if (result.image) {
        const characterImage = document.querySelector('.result-character');
        if (characterImage) {
            characterImage.src = `images/avatars/${result.image}`;
            console.log('🖼️ 유형별 이미지 업데이트:', result.image);
        }
    }
    
    // 호환성 정보 업데이트
    updateCompatibilityInfo(result);
    
    // 피드백 타입에 따른 섹션 표시
    const feedbackType = localStorage.getItem('feedbackType');
    
    if (feedbackType === 'withReasons') {
        // 이유 작성된 경우 - AI 맞춤 분석, 나만의 강점, 내가 보완할 부분
        showWithReasonsSections(result);
    } else {
        // 이유 미작성된 경우 - 강점, 보완할 부분
        showWithoutReasonsSections(result);
    }
    
    console.log('✅ 결과 표시 업데이트 완료:', result);
}

// 호환성 정보 업데이트
function updateCompatibilityInfo(result) {
    console.log('🔗 호환성 정보 업데이트 시작:', result);
    
    // 잘 어울리는 PM 업데이트
    if (result.compatiblePM) {
        const compatibleName = document.querySelector('.compatible-name');
        const compatibleReason = document.querySelector('.compatible-reason');
        const compatibleImage = document.querySelector('.compatible-image');
        
        if (compatibleName) {
            compatibleName.textContent = result.compatiblePM;
            console.log('✅ 잘 어울리는 PM 이름:', result.compatiblePM);
        }
        
        if (compatibleReason) {
            compatibleReason.textContent = result.compatiblePMReason || '잘 어울리는 PM입니다.';
            console.log('✅ 잘 어울리는 PM 이유:', result.compatiblePMReason);
        }
        
        if (compatibleImage && result.compatiblePMImage) {
            compatibleImage.src = `images/avatars/${result.compatiblePMImage}`;
            console.log('✅ 잘 어울리는 PM 이미지:', result.compatiblePMImage);
        }
    }
    
    // 성향이 다른 PM 업데이트
    if (result.incompatiblePM) {
        const incompatibleName = document.querySelector('.incompatible-name');
        const incompatibleReason = document.querySelector('.incompatible-reason');
        const incompatibleImage = document.querySelector('.incompatible-image');
        
        if (incompatibleName) {
            incompatibleName.textContent = result.incompatiblePM;
            console.log('✅ 성향이 다른 PM 이름:', result.incompatiblePM);
        }
        
        if (incompatibleReason) {
            incompatibleReason.textContent = result.incompatiblePMReason || '성향이 다른 PM입니다.';
            console.log('✅ 성향이 다른 PM 이유:', result.incompatiblePMReason);
        }
        
        if (incompatibleImage && result.incompatiblePMImage) {
            incompatibleImage.src = `images/avatars/${result.incompatiblePMImage}`;
            console.log('✅ 성향이 다른 PM 이미지:', result.incompatiblePMImage);
        }
    }
    
    console.log('✅ 호환성 정보 업데이트 완료');
}

// 이유 작성된 경우 섹션 표시
function showWithReasonsSections(result) {
    console.log('🤖 AI 맞춤 분석 표시 시작:', result);
    
    // 사용자 입력 이유들에서 AI 분석 결과 수집
    const userTestData = localStorage.getItem('userTestData');
    let aiAnalysisResults = [];
    
    if (userTestData) {
        try {
            const data = JSON.parse(userTestData);
            if (data.reasons) {
                aiAnalysisResults = data.reasons
                    .filter(reason => reason.analysis) // analysis가 있는 것만
                    .map(reason => reason.analysis);
            }
        } catch (error) {
            console.error('사용자 데이터 파싱 오류:', error);
        }
    }
    
    console.log('📊 수집된 AI 분석 결과:', aiAnalysisResults);
    
    // AI 분석 결과 종합
    let combinedAnalysis = {
        summary: '',
        strengths: [],
        areas_to_improve: []
    };
    
    if (aiAnalysisResults.length > 0) {
        // 모든 분석 결과를 종합
        aiAnalysisResults.forEach(analysis => {
            if (analysis.summary) {
                combinedAnalysis.summary += analysis.summary + ' ';
            }
            if (analysis.strengths) {
                combinedAnalysis.strengths.push(...analysis.strengths);
            }
            if (analysis.areas_to_improve) {
                combinedAnalysis.areas_to_improve.push(...analysis.areas_to_improve);
            }
        });
        
        // 중복 제거 및 길이 제한
        combinedAnalysis.strengths = [...new Set(combinedAnalysis.strengths)].slice(0, 3);
        combinedAnalysis.areas_to_improve = [...new Set(combinedAnalysis.areas_to_improve)].slice(0, 3);
    }
    
    // AI 분석 섹션 표시
    const aiAnalysisBox = document.querySelector('.analysis-box.ai-analysis');
    if (aiAnalysisBox) {
        aiAnalysisBox.style.display = 'block';
        const aiAnalysisText = aiAnalysisBox.querySelector('p');
        if (aiAnalysisText) {
            const aiAnalysisContent = combinedAnalysis.summary || result.aiAnalysis || 'AI 맞춤 분석 결과를 불러올 수 없습니다.';
            aiAnalysisText.textContent = aiAnalysisContent;
            console.log('✅ AI 맞춤 분석 표시:', aiAnalysisContent);
        }
    }
    
    // 강점 섹션 표시
    const strengthsBox = document.querySelector('.analysis-box.strengths');
    if (strengthsBox) {
        strengthsBox.style.display = 'block';
        const strengthsText = strengthsBox.querySelector('p');
        if (strengthsText) {
            const strengthsContent = combinedAnalysis.strengths.length > 0 
                ? combinedAnalysis.strengths.join(' ') 
                : result.strengths || '강점 정보를 불러올 수 없습니다.';
            strengthsText.textContent = strengthsContent;
            console.log('✅ 나만의 강점 표시:', strengthsContent);
        }
    }
    
    // 보완점 섹션 표시
    const improvementsBox = document.querySelector('.analysis-box.improvements');
    if (improvementsBox) {
        improvementsBox.style.display = 'block';
        const improvementsText = improvementsBox.querySelector('p');
        if (improvementsText) {
            const improvementsContent = combinedAnalysis.areas_to_improve.length > 0 
                ? combinedAnalysis.areas_to_improve.join(' ') 
                : result.improvements || '보완점 정보를 불러올 수 없습니다.';
            improvementsText.textContent = improvementsContent;
            console.log('✅ 내가 보완할 부분 표시:', improvementsContent);
        }
    }
}

// 이유 미작성된 경우 섹션 표시
function showWithoutReasonsSections(result) {
    console.log('📋 고정값 피드백 표시:', result);
    
    // AI 분석 섹션 숨기기
    const aiAnalysisBox = document.querySelector('.analysis-box.ai-analysis');
    if (aiAnalysisBox) {
        aiAnalysisBox.style.display = 'none';
    }
    
    // 강점 섹션 표시
    const strengthsBox = document.querySelector('.analysis-box.strengths');
    if (strengthsBox) {
        strengthsBox.style.display = 'block';
        const strengthsText = strengthsBox.querySelector('p');
        if (strengthsText) {
            console.log('💪 강점 텍스트 설정:', result.strengths);
            strengthsText.textContent = result.strengths || '강점 정보를 불러올 수 없습니다.';
        }
    }
    
    // 보완점 섹션 표시
    const improvementsBox = document.querySelector('.analysis-box.improvements');
    if (improvementsBox) {
        improvementsBox.style.display = 'block';
        const improvementsText = improvementsBox.querySelector('p');
        if (improvementsText) {
            console.log('🔧 보완점 텍스트 설정:', result.improvements);
            improvementsText.textContent = result.improvements || '보완점 정보를 불러올 수 없습니다.';
        }
    }
}
