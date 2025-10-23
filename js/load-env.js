// .env 파일 로드 함수
async function loadEnvFile() {
    try {
        const response = await fetch('.env');
        const text = await response.text();
        
        // .env 파일 파싱
        const envVars = {};
        const lines = text.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            }
        }
        
        return envVars;
    } catch (error) {
        console.error('.env 파일 로드 실패:', error);
        return {};
    }
}

// 전역으로 사용할 수 있도록 설정
window.loadEnvFile = loadEnvFile;
