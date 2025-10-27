// 결과 화면 JavaScript

// 화면 캡처 기능
async function captureAndSaveResult() {
    try {
        console.log('📸 화면 캡처 시작...');
        
        // html2canvas 라이브러리 로드
        if (typeof html2canvas === 'undefined') {
            await loadHtml2Canvas();
        }
        
        // 타입요약 이후의 요소들을 임시로 숨기기
        const elementsToHide = [
            '.save-button-section',
            '.analysis-section', 
            '.compatibility-section',
            '.action-buttons'
        ];
        
        const hiddenElements = [];
        elementsToHide.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.display = 'none';
                hiddenElements.push(element);
            });
        });
        
        // 캡처할 영역 선택 (타입요약까지만)
        const captureArea = document.querySelector('.result-card');
        
        // html2canvas 옵션 설정
        const options = {
            backgroundColor: '#ffffff',
            scale: 2, // 고해상도
            useCORS: true,
            allowTaint: true,
            scrollX: 0,
            scrollY: 0,
            width: captureArea.scrollWidth,
            height: captureArea.scrollHeight
        };
        
        console.log('📊 캡처 옵션:', options);
        
        // 화면 캡처 실행
        const canvas = await html2canvas(captureArea, options);
        console.log('✅ 캡처 완료, 캔버스 크기:', canvas.width, 'x', canvas.height);
        
        // 숨긴 요소들을 다시 보이게 하기
        hiddenElements.forEach(element => {
            element.style.display = '';
        });
        
        // PNG로 변환
        const dataURL = canvas.toDataURL('image/png', 1.0);
        
        // 파일명 생성 (PM 유형 + 타임스탬프)
        const pmType = document.querySelector('.pm-type')?.textContent || 'PM유형';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const filename = `${pmType}_${timestamp}.png`;
        
        console.log('💾 파일명:', filename);
        
        // 파일 다운로드
        downloadImage(dataURL, filename);
        
        // 성공 메시지
        showSuccessMessage('이미지가 성공적으로 저장되었습니다!');
        
    } catch (error) {
        console.error('❌ 화면 캡처 실패:', error);
        showErrorMessage('화면 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 현재 페이지 링크 복사
async function copyPageLink() {
    try {
        const currentUrl = window.location.href;
        
        // 클립보드 API 사용
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(currentUrl);
            console.log('✅ 링크가 클립보드에 복사되었습니다:', currentUrl);
        } else {
            // 폴백: 텍스트 영역 사용
            const textArea = document.createElement('textarea');
            textArea.value = currentUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                console.log('✅ 링크가 클립보드에 복사되었습니다 (폴백):', currentUrl);
            } catch (err) {
                console.error('❌ 링크 복사 실패:', err);
            }
            
            document.body.removeChild(textArea);
        }
    } catch (error) {
        console.error('❌ 링크 복사 중 오류:', error);
    }
}

// html2canvas 라이브러리 동적 로드
function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
        if (typeof html2canvas !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => {
            console.log('✅ html2canvas 라이브러리 로드 완료');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ html2canvas 라이브러리 로드 실패');
            reject(new Error('html2canvas 라이브러리 로드 실패'));
        };
        document.head.appendChild(script);
    });
}

// 이미지 다운로드 함수
function downloadImage(dataURL, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    
    // 임시로 DOM에 추가하고 클릭
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('💾 다운로드 완료:', filename);
}

// 성공 메시지 표시
function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 에러 메시지 표시
function showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

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
    // 먼저 이미지 저장
    captureAndSaveResult();
    
    // 그 다음 공유 팝업 표시
    setTimeout(() => {
        showSharePopup();
    }, 1000); // 이미지 저장 완료 후 팝업 표시
}

// 테스트 다시하기
function retakeTest() {
    // 로컬 스토리지 초기화
    localStorage.removeItem('userChoices');
    localStorage.removeItem('userReasons');
    localStorage.removeItem('userTestData');
    localStorage.removeItem('analysisResult');
    localStorage.removeItem('feedbackType');
    
    // 인트로 페이지로 이동
    window.location.href = 'intro.html';
}

// 공유 팝업 표시
function showSharePopup() {
    const popup = document.getElementById('sharePopup');
    const characterImage = document.getElementById('shareCharacterImage');
    const shareTitle = document.getElementById('shareTitle');
    const shareUrl = document.getElementById('shareUrl');
    
    // 현재 캐릭터 이미지와 PM 유형 정보 업데이트
    const currentCharacter = document.querySelector('.result-character');
    const currentPMType = document.querySelector('.pm-type');
    
    if (currentCharacter) {
        characterImage.src = currentCharacter.src;
    }
    
    if (currentPMType) {
        shareTitle.textContent = `나만의 PM 유형은 ${currentPMType.textContent}!`;
    }
    
    // 현재 URL 설정
    shareUrl.textContent = window.location.href;
    
    // 팝업 표시
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // 스크롤 방지
    
    // 팝업 외부 클릭 시 닫기
    popup.onclick = function(e) {
        if (e.target === popup) {
            closeSharePopup();
        }
    };
}

// 공유 팝업 닫기
function closeSharePopup() {
    const popup = document.getElementById('sharePopup');
    popup.style.display = 'none';
    document.body.style.overflow = ''; // 스크롤 복원
}

// 링크 복사
async function copyShareUrl() {
    try {
        const url = window.location.href;
        
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
            showSuccessMessage('링크가 복사되었습니다!');
        } else {
            // 폴백: 텍스트 영역 사용
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                showSuccessMessage('링크가 복사되었습니다!');
            } catch (err) {
                showErrorMessage('링크 복사에 실패했습니다.');
            }
            
            document.body.removeChild(textArea);
        }
    } catch (error) {
        console.error('링크 복사 중 오류:', error);
        showErrorMessage('링크 복사에 실패했습니다.');
    }
}

// 카카오톡 공유
function shareToKakao() {
    const url = window.location.href;
    const title = document.getElementById('shareTitle').textContent;
    
    // 카카오톡 공유 URL 생성
    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(kakaoUrl, '_blank');
    closeSharePopup();
}

// Facebook 공유
function shareToFacebook() {
    const url = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
    closeSharePopup();
}

// Twitter 공유
function shareToTwitter() {
    const url = window.location.href;
    const title = document.getElementById('shareTitle').textContent;
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(twitterUrl, '_blank');
    closeSharePopup();
}

// Instagram 공유 (링크 복사)
function shareToInstagram() {
    copyShareUrl();
    showSuccessMessage('링크가 복사되었습니다! Instagram 스토리에 붙여넣기 하세요.');
    closeSharePopup();
}

// 네이버 공유
function shareToNaver() {
    const url = window.location.href;
    const title = document.getElementById('shareTitle').textContent;
    const naverUrl = `https://share.naver.com/web/shareView?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(naverUrl, '_blank');
    closeSharePopup();
}

// 이메일 공유
function shareToEmail() {
    const url = window.location.href;
    const title = document.getElementById('shareTitle').textContent;
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${title}\n\n${url}`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = emailUrl;
    closeSharePopup();
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
