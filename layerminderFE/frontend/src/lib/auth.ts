import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  provider?: string
}

export interface ProfileResponse {
  id: string
  email: string
  user_metadata: {
    name?: string
    avatar_url?: string
    [key: string]: unknown
  }
}

// 구글 로그인
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Google login error:', error)
    return { data: null, error }
  }
}

// 카카오 로그인
export const signInWithKakao = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Kakao login error:', error)
    return { data: null, error }
  }
}

// 로그아웃
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error }
  }
}

// 백엔드에서 사용자 프로필 가져오기 (JWT 토큰 사용)
export const getProfileFromBackend = async (): Promise<ProfileResponse | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      console.warn('No access token available')
      return null
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'}/api/v1/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        // 토큰 만료 시 자동 로그아웃
        console.warn('Token expired, signing out...')
        await supabase.auth.signOut()
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const profileData = await response.json() as ProfileResponse
    return profileData
  } catch (error) {
    console.error('Get profile from backend error:', error)
    return null
  }
}

// 현재 사용자 정보 가져오기 (Supabase 클라이언트 사용)
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null
    
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
      provider: user.app_metadata?.provider
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}
