import React from 'react';

interface ApiKeyPromptProps {
  error: string | null;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ error }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="text-center p-8 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">API 키 설정 필요</h2>
        <p className="text-slate-400 mb-6">
          애플리케이션을 사용하려면 <strong>API_KEY 환경 변수</strong>를 설정해야 합니다.<br />
          Vercel과 같은 배포 서비스의 프로젝트 설정에서 Gemini API 키를 추가해주세요.
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md mb-6 text-left">
            <h3 className="font-bold">오류가 발생했습니다</h3>
            <p className="text-sm mt-1">{error}</p>
            {error.includes("결제 계정") && (
                 <p className="text-sm mt-3">
                    음성 통독과 같은 고급 기능은 <strong>유효한 결제 계정이 연결된 API 키</strong>가 필요합니다.
                    <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="font-bold underline text-blue-400 hover:text-blue-300 ml-1">
                        결제 계정 확인하기
                    </a>
                </p>
            )}
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-600 text-slate-300 px-4 py-3 rounded-md mb-6 text-left">
           <h3 className="font-bold">설정 방법</h3>
           <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
               <li>사용하시는 배포 플랫폼(예: Vercel)의 대시보드로 이동합니다.</li>
               <li>프로젝트 설정에서 'Environment Variables' 메뉴를 찾습니다.</li>
               <li>이름(Name/Key)에 <code className="bg-slate-700 px-1 py-0.5 rounded text-rose-400 font-mono">API_KEY</code>를 입력합니다.</li>
               <li>값(Value)에 발급받은 Gemini API 키를 붙여넣습니다.</li>
               <li>설정을 저장하고 프로젝트를 다시 배포(Redeploy)합니다.</li>
           </ol>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">
            가격 정책에 대해 더 알아보기
          </a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;
