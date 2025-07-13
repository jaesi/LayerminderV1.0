'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  const handleKakaoLogin = () => {
    // TODO: 카카오 로그인 로직 구현
    console.log('카카오 로그인');
    // 임시로 대시보드로 이동
    router.push('/dashboard');
  };

  const handleGoogleLogin = () => {
    // TODO: 구글 로그인 로직 구현
    console.log('구글 로그인');
    // 임시로 대시보드로 이동
    router.push('/dashboard');
  };

  const handleExplore = () => {
    // TODO: 둘러보기 기능 구현 (게스트 모드)
    console.log('둘러보기');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#edeae3' }}>
      {/* 좌측 이미지 영역 */}
      <div className="w-1/2 flex items-center justify-center">
        <div className="max-w-2xl">
          <img 
            src="/images/layminder2.png" 
            alt="Layer Minder Concept" 
            className="w-112 h-auto"
          />
        </div>
      </div>

      {/* 우측 콘텐츠 영역 */}
      <div className="w-1/2 flex flex-col items-center justify-center">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <img 
              src="/images/logo2.png" 
              alt="Layer Minder Logo" 
              className="h-12 mx-auto mb-4"
            />
          </div>
          <img 
            src="/images/logo.png" 
            alt="Layer Minder" 
            className="h-8 mx-auto mb-4"
          />
        </div>

        {/* 설명 텍스트 */}
        <div className="max-w-md text-center mb-12">
          <p className="text-xs text-gray-700 leading-relaxed mb-4">
            Layer Minder is an AI-powered design generation platform that automatically 
            creates and visualizes furniture and spatial designs based on the user&apos;s 
            input—whether it&apos;s an idea, material, style, or context.
          </p>
          <p className="text-xs text-gray-700 leading-relaxed mb-4">
            By entering text or uploading an image, users can instantly generate high-fidelity, 
            photorealistic renderings without the need for separate 3D tools or rendering 
            software.
          </p>
          <p className="text-xs text-gray-700 leading-relaxed">
            The platform allows for repeated variations by changing materials, colors, and 
            moods while preserving the original form. Users can also upload sketches or 
            product photos to generate high-resolution visuals based on those references.
          </p>
        </div>

        {/* 구분선 */}
        <div className="w-16 h-px bg-gray-400 mb-8"></div>

        {/* 로그인 버튼들 */}
        <div className="space-y-4 w-full max-w-xs">
          {/* 카카오 로그인 */}
          <button
            onClick={handleKakaoLogin}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M9 0C4.032 0 0 3.192 0 7.128c0 2.604 1.764 4.896 4.428 6.192l-1.128 4.14c-.072.264.192.48.432.348L8.4 15.372c.192.012.396.012.6.012 4.968 0 9-3.192 9-7.128S13.968 0 9 0z" 
                fill="currentColor"
              />
            </svg>
            카카오로 시작하기
          </button>

          {/* 구글 로그인 */}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-6 rounded-lg border border-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" 
                fill="#4285F4"
              />
              <path 
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" 
                fill="#34A853"
              />
              <path 
                d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" 
                fill="#FBBC05"
              />
              <path 
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" 
                fill="#EA4335"
              />
            </svg>
            Google로 시작하기
          </button>

          {/* 둘러보기 버튼 */}
          <button
            onClick={handleExplore}
            className="w-full bg-transparent hover:bg-gray-100 text-gray-600 font-medium py-3 px-6 rounded-lg border border-gray-300 transition-colors"
          >
            둘러보기
          </button>
        </div>

        {/* 하단 링크 */}
        <div className="mt-8 text-center">
          <a 
            href="#" 
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            @IG
          </a>
        </div>
      </div>
    </div>
  );
}