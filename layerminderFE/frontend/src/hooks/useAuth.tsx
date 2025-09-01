'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getProfileFromBackend, ProfileResponse } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  profile: ProfileResponse | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {}
})

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 백엔드에서 프로필 정보 가져오기
  const fetchProfile = useCallback(async (forceRefresh = false) => {
    try {
      if (!user && !forceRefresh) return
      
      const profileData = await getProfileFromBackend()
      if (profileData) {
        setProfile(profileData)
        console.log('✅ Profile loaded from backend:', profileData.email)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }, [user])

  const refreshProfile = async () => {
    await fetchProfile(true)
  }

  useEffect(() => {
    // 초기 세션 확인
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        // 사용자가 있으면 백엔드에서 프로필 정보 가져오기
        if (session?.user) {
          await fetchProfile(true)
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_IN' && session) {
          // 로그인 성공 시 백엔드에서 프로필 정보 가져오기
          await fetchProfile(true)
          router.push('/dashboard')
        }
        
        if (event === 'SIGNED_OUT') {
          // 로그아웃 시 프로필 정보 초기화
          setProfile(null)
          router.push('/')
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          // 토큰 갱신 시 프로필 정보 새로고침
          console.log('Token refreshed, updating profile...')
          await fetchProfile(true)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, fetchProfile])

  // 사용자 변경 시 프로필 정보 가져오기
  useEffect(() => {
    if (user && !profile) {
      fetchProfile()
    }
  }, [user, profile, fetchProfile])

  const handleSignOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signOut: handleSignOut,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}