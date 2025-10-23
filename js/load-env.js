// .env 파일 로드 함수
async function loadEnvFile() {
    console.log('📁 .env 파일 요청 중...');
    
    try {
        const response = await fetch('.env');
        console.log('📡 서버 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('📄 .env 파일 내용 (첫 100자):', text.substring(0, 100) + '...');
        
        // .env 파일 파싱
        const envVars = {};
        const lines = text.split('\n');
        console.log('📝 총 라인 수:', lines.length);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    const keyName = key.trim();
                    const keyValue = valueParts.join('=').trim();
                    envVars[keyName] = keyValue;
                    console.log(`🔑 변수 발견: ${keyName} = ${keyValue.substring(0, 10)}...`);
                }
            }
        }
        
        console.log('✅ .env 파일 파싱 완료. 총 변수 수:', Object.keys(envVars).length);
        return envVars;
        
    } catch (error) {
        console.error('💥 .env 파일 로드 실패:', error);
        console.log('🔧 해결 방법:');
        console.log('   1. .env 파일이 프로젝트 루트에 있는지 확인');
        console.log('   2. .env 파일 형식이 올바른지 확인 (OPENAI_API=sk-...)');
        console.log('   3. 로컬 서버를 실행했는지 확인 (file:// 프로토콜로는 .env 파일 접근 불가)');
        return {};
    }
}

// 전역으로 사용할 수 있도록 설정
window.loadEnvFile = loadEnvFile;
