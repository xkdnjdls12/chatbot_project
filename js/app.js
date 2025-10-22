/**
 * 천재교육센터 - 신입 PM 듬이의 하루
 * 인터랙티브 기능 구현
 */

class GeniaAcademy {
  constructor() {
    this.currentStep = 'Intro';
    this.init();
  }

  /**
   * 애플리케이션 초기화
   */
  init() {
    this.setupEventListeners();
    this.setupAnimations();
    this.loadProgress();
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 시작하기 버튼
    const startBtn = document.querySelector('.start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startAdventure());
    }

    // 건너뛰기 버튼
    const skipBtn = document.querySelector('.skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipToNext());
    }

    // 네비게이션 아이템들
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item, index) => {
      item.addEventListener('click', () => this.navigateToStep(index));
    });

    // 곰 캐릭터 클릭 이벤트
    const bear = document.querySelector('.pixel-bear');
    if (bear) {
      bear.addEventListener('click', () => this.bearInteraction());
    }
  }

  /**
   * 애니메이션 설정
   */
  setupAnimations() {
    // 페이지 로드 애니메이션
    setTimeout(() => {
      document.body.classList.add('loaded');
    }, 100);

    // 구름 애니메이션
    this.animateClouds();
    
    // 곰 캐릭터 애니메이션
    this.animateBear();
  }

  /**
   * 구름 애니메이션
   */
  animateClouds() {
    const clouds = document.querySelector('.clouds');
    if (clouds) {
      setInterval(() => {
        clouds.style.transform = `translateX(${Math.sin(Date.now() / 2000) * 10}px)`;
      }, 50);
    }
  }

  /**
   * 곰 캐릭터 애니메이션
   */
  animateBear() {
    const bear = document.querySelector('.pixel-bear');
    if (bear) {
      // 호흡 애니메이션
      setInterval(() => {
        bear.style.transform = `scale(${1 + Math.sin(Date.now() / 3000) * 0.05})`;
      }, 50);

      // 클릭 시 반응
      bear.addEventListener('click', () => {
        bear.style.animation = 'bearBounce 0.6s ease-in-out';
        setTimeout(() => {
          bear.style.animation = '';
        }, 600);
      });
    }
  }

  /**
   * 모험 시작
   */
  startAdventure() {
    this.showMessage('신입 PM 듬이의 하루가 시작됩니다! 🎉');
    this.updateProgress('Q1');
    this.animateButton('.start-btn');
  }

  /**
   * 다음 단계로 건너뛰기
   */
  skipToNext() {
    this.showMessage('다음 단계로 넘어갑니다...');
    this.updateProgress('Q1');
    this.animateButton('.skip-btn');
  }

  /**
   * 단계 네비게이션
   */
  navigateToStep(stepIndex) {
    const steps = ['Intro', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Result'];
    const targetStep = steps[stepIndex];
    
    if (targetStep !== this.currentStep) {
      this.currentStep = targetStep;
      this.updateNavigation(stepIndex);
      this.showMessage(`${targetStep} 단계로 이동했습니다.`);
    }
  }

  /**
   * 네비게이션 업데이트
   */
  updateNavigation(activeIndex) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item, index) => {
      item.classList.toggle('active', index === activeIndex);
    });
  }

  /**
   * 진행 상황 업데이트
   */
  updateProgress(step) {
    this.currentStep = step;
    this.saveProgress();
    
    // 상태 박스 업데이트
    const statusBox = document.querySelector('.status-box p');
    if (statusBox) {
      const messages = {
        'Intro': 'Today...is... 파이팅!',
        'Q1': '첫 번째 질문을 준비 중...',
        'Q2': '두 번째 질문을 준비 중...',
        'Q3': '세 번째 질문을 준비 중...',
        'Q4': '네 번째 질문을 준비 중...',
        'Q5': '마지막 질문을 준비 중...',
        'Result': '결과를 확인하는 중...'
      };
      
      statusBox.textContent = messages[step] || '진행 중...';
    }
  }

  /**
   * 곰 캐릭터 상호작용
   */
  bearInteraction() {
    const messages = [
      '안녕하세요! 저는 듬이입니다! 🐻',
      '오늘도 열심히 일해보아요! 💪',
      'PM이 되기 위해 노력하고 있어요! 📚',
      '함께 성장해요! 🌱'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    this.showMessage(randomMessage);
  }

  /**
   * 메시지 표시
   */
  showMessage(message) {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.floating-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = 'floating-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--primary-blue);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      font-weight: 600;
      animation: messageFadeIn 0.3s ease-out;
    `;

    document.body.appendChild(messageDiv);

    // 3초 후 자동 제거
    setTimeout(() => {
      messageDiv.style.animation = 'messageFadeOut 0.3s ease-in';
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 300);
    }, 3000);
  }

  /**
   * 버튼 애니메이션
   */
  animateButton(selector) {
    const button = document.querySelector(selector);
    if (button) {
      button.style.animation = 'buttonPulse 0.6s ease-in-out';
      setTimeout(() => {
        button.style.animation = '';
      }, 600);
    }
  }

  /**
   * 진행 상황 저장
   */
  saveProgress() {
    localStorage.setItem('genia_academy_progress', this.currentStep);
  }

  /**
   * 진행 상황 불러오기
   */
  loadProgress() {
    const savedProgress = localStorage.getItem('genia_academy_progress');
    if (savedProgress) {
      this.currentStep = savedProgress;
      this.updateProgress(savedProgress);
    }
  }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes messageFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes messageFadeOut {
    from {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
  }

  @keyframes buttonPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  @keyframes bearBounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .loaded {
    animation: pageLoad 0.8s ease-out;
  }

  @keyframes pageLoad {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

// DOM이 로드된 후 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
  new GeniaAcademy();
});
