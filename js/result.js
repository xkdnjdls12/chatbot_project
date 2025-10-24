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
        
        // 로컬 스토리지에서 분석 결과 가져오기
        const analysisResult = localStorage.getItem('analysisResult');
        console.log('📊 저장된 분석 결과:', analysisResult);
        
        if (!analysisResult) {
            console.log('⚠️ 분석 결과가 없습니다.');
            return;
        }
        
        // JSON 파싱
        const parsedResult = JSON.parse(analysisResult);
        console.log('✅ 파싱된 결과:', parsedResult);
        
        // 결과 데이터를 화면에 적용
        updateResultDisplay(parsedResult);
        
    } catch (error) {
        console.error('💥 결과 로드 중 오류:', error);
    }
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
    console.log('🤖 통합 분석 결과 표시 시작:', result);
    
    // 사용자 입력 이유들에서 통합 분석 결과 수집
    const userTestData = localStorage.getItem('userTestData');
    let feedbackResults = [];
    let mappingResults = [];
    
    if (userTestData) {
        try {
            const data = JSON.parse(userTestData);
            if (data.reasons) {
                data.reasons.forEach(reason => {
                    if (reason.feedback && reason.feedback.outputs) {
                        feedbackResults.push(reason.feedback.outputs);
                    }
                });
            }
        } catch (error) {
            console.error('사용자 데이터 파싱 오류:', error);
        }
    }
    
    console.log('📊 수집된 피드백 결과:', feedbackResults);
    console.log('📊 수집된 매핑 결과:', mappingResults);
    
    // 피드백 결과 종합
    let combinedFeedback = {
        summary: '',
        strengths: [],
        areas_to_improve: []
    };
    
    if (feedbackResults.length > 0) {
        // 모든 피드백 결과를 종합
        feedbackResults.forEach(feedback => {
            if (feedback.summary) {
                combinedFeedback.summary += feedback.summary + ' ';
            }
            if (feedback.strengths) {
                combinedFeedback.strengths.push(...feedback.strengths);
            }
            if (feedback.areas_to_improve) {
                combinedFeedback.areas_to_improve.push(...feedback.areas_to_improve);
            }
        });
        
        // 중복 제거 및 길이 제한
        combinedFeedback.strengths = [...new Set(combinedFeedback.strengths)].slice(0, 3);
        combinedFeedback.areas_to_improve = [...new Set(combinedFeedback.areas_to_improve)].slice(0, 3);
    }
    
    // AI 분석 섹션 표시
    const aiAnalysisBox = document.querySelector('.analysis-box.ai-analysis');
    if (aiAnalysisBox) {
        aiAnalysisBox.style.display = 'block';
        const aiAnalysisText = aiAnalysisBox.querySelector('p');
        if (aiAnalysisText) {
            const aiAnalysisContent = result.aiAnalysis || 'AI 맞춤 분석 결과를 불러올 수 없습니다.';
            aiAnalysisText.textContent = aiAnalysisContent;
            console.log('✅ AI 맞춤 분석 표시:', aiAnalysisContent);
        }
    }
    
    // 강점 섹션 표시
    const strengthsBox = document.querySelector('.analysis-box.strengths');
    if (strengthsBox) {
        strengthsBox.style.display = 'block';
        const strengthsText = strengthsBox.querySelector('p');
        const strengthsTitle = strengthsBox.querySelector('h3');
        
        if (strengthsText) {
            const strengthsContent = result.strengths || '강점 정보를 불러올 수 없습니다.';
            strengthsText.textContent = strengthsContent;
            console.log('✅ 나만의 강점 표시:', strengthsContent);
        }
        
        if (strengthsTitle && result.strengthsTitle) {
            strengthsTitle.textContent = result.strengthsTitle;
            console.log('✅ 강점 라벨 업데이트:', result.strengthsTitle);
        }
    }
    
    // 보완점 섹션 표시
    const improvementsBox = document.querySelector('.analysis-box.improvements');
    if (improvementsBox) {
        improvementsBox.style.display = 'block';
        const improvementsText = improvementsBox.querySelector('p');
        const improvementsTitle = improvementsBox.querySelector('h3');
        
        if (improvementsText) {
            const improvementsContent = result.improvements || '보완점 정보를 불러올 수 없습니다.';
            improvementsText.textContent = improvementsContent;
            console.log('✅ 내가 보완할 부분 표시:', improvementsContent);
        }
        
        if (improvementsTitle && result.improvementsTitle) {
            improvementsTitle.textContent = result.improvementsTitle;
            console.log('✅ 보완점 라벨 업데이트:', result.improvementsTitle);
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
        const strengthsTitle = strengthsBox.querySelector('h3');
        
        if (strengthsText) {
            console.log('💪 강점 텍스트 설정:', result.strengths);
            strengthsText.textContent = result.strengths || '강점 정보를 불러올 수 없습니다.';
        }
        
        if (strengthsTitle && result.strengthsTitle) {
            strengthsTitle.textContent = result.strengthsTitle;
            console.log('✅ 강점 라벨 업데이트:', result.strengthsTitle);
        }
    }
    
    // 보완점 섹션 표시
    const improvementsBox = document.querySelector('.analysis-box.improvements');
    if (improvementsBox) {
        improvementsBox.style.display = 'block';
        const improvementsText = improvementsBox.querySelector('p');
        const improvementsTitle = improvementsBox.querySelector('h3');
        
        if (improvementsText) {
            console.log('🔧 보완점 텍스트 설정:', result.improvements);
            improvementsText.textContent = result.improvements || '보완점 정보를 불러올 수 없습니다.';
        }
        
        if (improvementsTitle && result.improvementsTitle) {
            improvementsTitle.textContent = result.improvementsTitle;
            console.log('✅ 보완점 라벨 업데이트:', result.improvementsTitle);
        }
    }
}
