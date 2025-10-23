// OpenAI API 설정
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE'; // 여기에 OpenAI API 키를 입력하세요
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// DOM 요소들
let currentScenario = 1;
let userChoices = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeChatbot();
    setupEventListeners();
});

// 챗봇 초기화
function initializeChatbot() {
    console.log('챗봇이 시작되었습니다.');
    // 초기 시나리오 설정
    updateScenario();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    const choiceButtons = document.querySelectorAll('.choice-button');
    
    choiceButtons.forEach(button => {
        button.addEventListener('click', function() {
            handleChoice(this);
        });
    });
}

// 선택 처리 함수
async function handleChoice(button) {
    const choice = button.dataset.choice;
    const choiceText = button.textContent.trim();
    
    // 선택된 버튼 스타일 적용
    button.classList.add('selected');
    
    // 사용자 선택 저장
    userChoices.push({
        scenario: currentScenario,
        choice: choice,
        text: choiceText
    });
    
    console.log('사용자 선택:', choiceText);
    
    // 로딩 표시
    showLoading();
    
    try {
        // OpenAI API 호출
        const response = await callOpenAI(choiceText);
        
        // 응답 처리
        handleAIResponse(response);
        
    } catch (error) {
        console.error('API 호출 오류:', error);
        showError('죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        hideLoading();
    }
}

// OpenAI API 호출 함수
async function callOpenAI(userChoice) {
    const messages = [
        {
            role: "system",
            content: "당신은 PM 듬이의 조언자입니다. 사용자의 선택에 따라 다음 상황을 제시하고, PM으로서의 성장을 도와주세요. 한국어로 응답하세요."
        },
        {
            role: "user",
            content: `현재 상황: 회사 상품 매출 급감 문제 해결 중. 사용자 선택: ${userChoice}`
        }
    ];
    
    const requestBody = {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
    };
    
    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// AI 응답 처리
function handleAIResponse(response) {
    console.log('AI 응답:', response);
    
    // 다음 시나리오로 업데이트
    currentScenario++;
    updateScenario();
    
    // 새로운 선택지 생성 (실제로는 AI 응답에 따라 동적으로 생성)
    updateChoices();
}

// 시나리오 업데이트
function updateScenario() {
    const scenarios = [
        {
            title: "오마이갓! 아침부터..",
            description: "아침에 출근을 하니 우리 회사 상품의 매출이 급감했다는 보고를 받았다. 빠르게 해결하지 않으면 큰 손해를 입을 수도 있는 상황....! 문제의 이유를 어떻게 찾아볼까?"
        },
        {
            title: "좋은 접근이야!",
            description: "제품을 직접 사용해보니 몇 가지 문제점을 발견했다. 이제 이 문제들을 어떻게 해결할지 결정해야 한다. 어떤 방향으로 나아갈까?"
        },
        {
            title: "팀과의 협업",
            description: "개발팀과 디자인팀에게 문제점을 공유했다. 이제 함께 해결책을 찾아야 한다. 어떤 방식으로 팀을 이끌어갈까?"
        }
    ];
    
    if (currentScenario <= scenarios.length) {
        const scenario = scenarios[currentScenario - 1];
        document.querySelector('.scenario-title').textContent = scenario.title;
        document.querySelector('.scenario-description').textContent = scenario.description;
        
        // 진행 상황 업데이트
        updateProgress();
    } else {
        // 게임 종료
        showGameEnd();
    }
}

// 선택지 업데이트
function updateChoices() {
    const choiceSets = [
        [
            "최근 제품을 직접 써보면서 어디서 불편함이 느껴지는지 감을 잡아보자!",
            "고객 피드백 데이터를 분석해서 문제점을 찾아보자!"
        ],
        [
            "개발팀과 함께 기술적 해결책을 찾아보자!",
            "마케팅팀과 함께 고객 커뮤니케이션을 개선해보자!"
        ],
        [
            "사용자 테스트를 통해 개선점을 찾아보자!",
            "경쟁사 분석을 통해 차별화 포인트를 찾아보자!"
        ]
    ];
    
    if (currentScenario <= choiceSets.length) {
        const choices = choiceSets[currentScenario - 1];
        const choiceButtons = document.querySelectorAll('.choice-button');
        
        choiceButtons.forEach((button, index) => {
            button.textContent = choices[index] || "다음 단계로 진행";
            button.classList.remove('selected');
        });
    }
}

// 진행 상황 업데이트
function updateProgress() {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < currentScenario) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });
}

// 로딩 표시
function showLoading() {
    document.getElementById('loadingSection').style.display = 'block';
    document.querySelector('.choices-section').style.display = 'none';
}

// 로딩 숨김
function hideLoading() {
    document.getElementById('loadingSection').style.display = 'none';
    document.querySelector('.choices-section').style.display = 'flex';
}

// 에러 표시
function showError(message) {
    alert(message);
}

// 게임 종료
function showGameEnd() {
    const scenarioSection = document.querySelector('.scenario-section');
    scenarioSection.innerHTML = `
        <div class="game-end">
            <h2>🎉 축하합니다!</h2>
            <p>PM 듬이의 하루를 성공적으로 완료했습니다!</p>
            <p>당신의 선택들:</p>
            <ul>
                ${userChoices.map(choice => `<li>${choice.text}</li>`).join('')}
            </ul>
            <button onclick="location.href='index.html'" class="start-button">다시 시작하기</button>
        </div>
    `;
    
    document.querySelector('.choices-section').style.display = 'none';
}

// API 키 검증
function validateAPIKey() {
    if (OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
        console.warn('OpenAI API 키를 설정해주세요!');
        return false;
    }
    return true;
}

// 페이지 로드 시 API 키 검증
if (!validateAPIKey()) {
    console.error('OpenAI API 키가 설정되지 않았습니다. js/chatbot.js 파일에서 API 키를 설정해주세요.');
}
