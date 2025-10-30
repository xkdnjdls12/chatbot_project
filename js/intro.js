// 도입부 페이지 JavaScript

// 출근하기 버튼 클릭 시 첫 번째 시나리오로 이동
function startWork() {
    // 첫 번째 시나리오로 이동
    window.location.href = 'chatbot.html';
}

// 페이지 로드 시 애니메이션 효과
document.addEventListener('DOMContentLoaded', function() {
    // 카드 등장 애니메이션
    const introCard = document.querySelector('.intro-card');
    introCard.style.opacity = '0';
    introCard.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        introCard.style.transition = 'all 0.6s ease';
        introCard.style.opacity = '1';
        introCard.style.transform = 'translateY(0)';
    }, 100);
    
    // 캐릭터 이미지 애니메이션 적용할 dom 고르는 부분이야.
    // .intro-character라는 클래스를 찾고, scale로 크기를 줄였다가 천천히 원상태로 키울 때 transition이 적용됨.
    // 이 부분은 JS에서 인라인 스타일로 직접 적용하는 방식이라, 해당 요소가 존재해야 제대로 동작해.
    // 혹시 .intro-character 라는 클래스가 HTML에 없는 경우 해당 요소가 null이니까 오류날 수 있어!

    // 스타일 직접 부여한 부분: scale(0.8)로 크기 작게, transition으로 부드러운 전환 미리 지정
    const character = document.querySelector('.character-image');
    if(character) {
        character.style.transform = 'scale(0.8)';
        character.style.transition = 'transform 0.5s ease';
    }
    else {
        console.error('캐릭터 이미지 요소를 찾을 수 없습니다.');
    }
    
    setTimeout(() => {
        character.style.transform = 'scale(1)';
    }, 300);
    
    // 안내 박스들 순차 등장
    const infoBoxes = document.querySelectorAll('.info-box');
    infoBoxes.forEach((box, index) => {
        box.style.opacity = '0';
        box.style.transform = 'translateX(-20px)';
        box.style.transition = 'all 0.4s ease';
        
        setTimeout(() => {
            box.style.opacity = '1';
            box.style.transform = 'translateX(0)';
        }, 500 + (index * 150));
    });
    
    // 출근하기 버튼 애니메이션
    const startBtn = document.querySelector('.start-work-btn');
    startBtn.style.opacity = '0';
    startBtn.style.transform = 'translateY(20px)';
    startBtn.style.transition = 'all 0.5s ease';
    
    setTimeout(() => {
        startBtn.style.opacity = '1';
        startBtn.style.transform = 'translateY(0)';
    }, 1200);
});


