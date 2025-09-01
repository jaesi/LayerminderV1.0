'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signInWithGoogle, signInWithKakao } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // 이미 로그인된 경우 대시보드로 리다이렉트
  if (!loading && user) {
    router.push('/dashboard')
    return null
  }

  const handleKakaoLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await signInWithKakao()
      if (error) {
        console.error('카카오 로그인 실패:', error)
        alert('카카오 로그인에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error)
      alert('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        console.error('구글 로그인 실패:', error)
        alert('구글 로그인에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('구글 로그인 오류:', error)
      alert('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExplore = () => {
    // 게스트 모드로 대시보드 이동
    router.push('/dashboard?guest=true')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#edeae3' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#edeae3' }}>
      {/* 좌측 이미지 영역 */}
      <div className="w-1/2 flex items-center justify-center">
        <div className="max-w-2xl">
          <Image 
            src="/images/layminder2.png" 
            alt="Layer Minder Concept" 
            width={448}
            height={300}
            className="w-112 h-auto"
            priority
          />
        </div>
      </div>

      {/* 우측 콘텐츠 영역 */}
      <div className="w-1/2 flex flex-col items-center justify-center">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <Image 
              src="/images/logo2.png" 
              alt="Layer Minder Logo" 
              width={48}
              height={48}
              className="h-12 mx-auto mb-4"
            />
          </div>
          <Image 
            src="/images/logo.png" 
            alt="Layer Minder" 
            width={120}
            height={32}
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
          disabled={isLoading}
          className={`w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-medium py-3 px-6 transition-colors flex items-center justify-center gap-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
          ) : (
            <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M9 0C4.032 0 0 3.192 0 7.128c0 2.604 1.764 4.896 4.428 6.192l-1.128 4.14c-.072.264.192.48.432.348L8.4 15.372c.192.012.396.012.6.012 4.968 0 9-3.192 9-7.128S13.968 0 9 0z" 
                fill="currentColor"
              />
            </svg>
          )}
          카카오로 시작하기
        </button>

        {/* 구글 로그인 */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className={`w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-6 border border-gray-300 transition-colors flex items-center justify-center gap-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
          ) : (
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
          )}
          Google로 시작하기
        </button>

        {/* 둘러보기 버튼 */}
        <button
          onClick={handleExplore}
          disabled={isLoading}
          className={`w-full bg-transparent hover:bg-gray-100 text-gray-600 font-medium py-3 px-6 border border-gray-300 transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          둘러보기
        </button>
      </div>
    </div>
    </div>
  )
}