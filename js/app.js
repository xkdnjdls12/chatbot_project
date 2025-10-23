// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 테스트 시작하기 버튼 요소 가져오기
    const startTestBtn = document.getElementById('startTestBtn');
    
    // 버튼 클릭 이벤트 리스너 추가
    startTestBtn.addEventListener('click', function() {
        // 버튼 클릭 시 실행될 함수
        startChatbotTest();
    });
    
    // 버튼에 호버 효과 추가
    startTestBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    startTestBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// 챗봇 테스트 시작 함수
function startChatbotTest() {
    // 챗봇 페이지로 이동
    window.location.href = 'chatbot.html';
}

// 챗봇 인터페이스 표시 함수 (향후 구현)
function showChatbotInterface() {
    // 메인 카드 숨기기
    const appCard = document.querySelector('.app-card');
    appCard.style.display = 'none';
    
    // 챗봇 UI 표시 (향후 구현)
    console.log('챗봇 인터페이스 표시 예정');
}

// 페이지 로드 시 애니메이션 효과
window.addEventListener('load', function() {
    const appCard = document.querySelector('.app-card');
    appCard.style.opacity = '0';
    appCard.style.transform = 'translateY(30px)';
    
    // 페이드인 애니메이션
    setTimeout(() => {
        appCard.style.transition = 'all 0.6s ease';
        appCard.style.opacity = '1';
        appCard.style.transform = 'translateY(0)';
    }, 100);
});
