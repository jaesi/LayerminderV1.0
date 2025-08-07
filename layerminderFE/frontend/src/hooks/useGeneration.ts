'use client'

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GenerationState,
  DroppedFile,
  SSEEventData,
  GeneratedRow
} from '@/types';
import {
  createHistorySession,
  startImageGeneration,
  createSSEConnection,
  uploadImageWithMetadata
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface UseGenerationOptions {
  onComplete?: (result: GeneratedRow) => void;
  onError?: (error: string) => void;
  onProgress?: (step: string, progress: number) => void;
}

export function useGeneration(options: UseGenerationOptions = {}) {
  const { user } = useAuth();
  const { onComplete, onError, onProgress } = options;

  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    progress: 0
  });

  const sseRef = useRef<EventSource | null>(null);
  const currentGenerationRef = useRef<{
    sessionId: string;
    recordId: string;
    inputImages: string[];
    keyword?: string;
  } | null>(null);

  // SSE 연결 정리
  const cleanup = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    currentGenerationRef.current = null;
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // 상태 업데이트 헬퍼
  const updateState = useCallback((updates: Partial<GenerationState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // 진행상황 콜백 호출
      if (newState.currentStep && newState.progress !== prev.progress) {
        onProgress?.(newState.currentStep, newState.progress);
      }
      
      return newState;
    });
  }, [onProgress]);

  // 에러 처리
  const handleError = useCallback((error: string) => {
    console.error('Generation error:', error);
    cleanup();
    updateState({
      status: 'error',
      error,
      progress: 0
    });
    onError?.(error);
  }, [cleanup, updateState, onError]);

  // SSE 이벤트 처리
  const handleSSEEvent = useCallback((eventData: SSEEventData) => {
    const current = currentGenerationRef.current;
    if (!current) return;

    switch (eventData.type) {
      case 'images_generated':
        console.log('📸 Images received:', eventData.data.image_urls.length);
        updateState({
          generatedImages: eventData.data.image_urls,
          currentStep: 'Generating story...',
          progress: 50
        });
        break;

      case 'story_generated':
        console.log('📝 Story received');
        updateState({
          generatedStory: eventData.data.story,
          currentStep: 'Extracting keywords...',
          progress: 75
        });
        break;

      case 'keywords_generated':
        console.log('🏷️ Keywords received:', eventData.data.keywords.length);
        updateState({
          generatedKeywords: eventData.data.keywords,
          currentStep: 'Generating recommendations...',
          progress: 90
        });
        break;

      case 'recommendation_ready':
        console.log('💡 Recommendation received');
        updateState({
          recommendationImage: eventData.data.url,
          status: 'completed',
          currentStep: 'Completed!',
          progress: 100
        });

        // 최종 결과 생성
        const result: GeneratedRow = {
          id: current.recordId,
          sessionId: current.sessionId,
          images: [
            // 생성된 이미지들
            ...(state.generatedImages || []).map((url, index) => ({
              id: Date.now() + index + 1,
              src: url,
              isPinned: false,
              type: 'output' as const,
              imageId: `generated_${current.recordId}_${index}`,
            })),
            // 첫 번째 입력 이미지를 참조로 사용
            {
              id: Date.now() + 1000,
              src: current.inputImages[0] || '',
              isPinned: false,
              type: 'reference' as const,
            }
          ],
          keyword: current.keyword,
          story: eventData.data.url ? state.generatedStory : undefined,
          generatedKeywords: state.generatedKeywords,
          recommendationImage: eventData.data.url,
          createdAt: new Date(),
          status: 'ready',
          metadata: {
            inputImages: current.inputImages,
            generationTime: Date.now(),
            generatedBy: user?.id || 'guest',
          }
        };

        onComplete?.(result);
        break;
    }
  }, [state.generatedImages, state.generatedStory, state.generatedKeywords, updateState, onComplete, user?.id]);

  // 메인 생성 함수
  const generate = useCallback(async (files: DroppedFile[], keywords: string[]) => {
    if (!user && typeof window !== 'undefined' && !window.location.search.includes('guest=true')) {
      handleError('Authentication required');
      return;
    }

    if (files.length === 0) {
      handleError('No files provided');
      return;
    }

    try {
      cleanup();
      
      updateState({
        status: 'creating_session',
        progress: 10,
        currentStep: 'Creating session...',
        error: undefined
      });

      // 1단계: 세션 생성
      console.log('🚀 Starting generation process...');
      const sessionResult = await createHistorySession();
      
      if (!sessionResult) {
        throw new Error('Failed to create history session');
      }

      const sessionId = sessionResult.session_id;
      console.log('✅ Session created:', sessionId);

      updateState({
        sessionId,
        status: 'uploading',
        progress: 20,
        currentStep: 'Uploading images...'
      });

      // 2단계: 이미지 업로드
      const uploadPromises = files.map(async (item) => {
        const uploadResult = await uploadImageWithMetadata(item.file, 'input');
        
        if (!uploadResult) {
          throw new Error(`Upload failed: ${item.file.name}`);
        }
        
        return uploadResult;
      });

      const uploadResults = await Promise.all(uploadPromises);
      console.log('✅ All files uploaded:', uploadResults.length);

      const imageKeys = uploadResults.map(result => result.fileKey);
      const keyword = keywords.length > 0 ? keywords[0] : undefined;

      updateState({
        status: 'generating',
        progress: 30,
        currentStep: 'Starting AI generation...'
      });

      // 3단계: 생성 시작
      const generateResult = await startImageGeneration(sessionId, imageKeys, keyword);
      
      if (!generateResult) {
        throw new Error('Failed to start image generation');
      }

      const recordId = generateResult.record_id;
      console.log('✅ Generation started, record_id:', recordId);

      // 현재 생성 정보 저장
      currentGenerationRef.current = {
        sessionId,
        recordId,
        inputImages: uploadResults.map(r => r.publicUrl),
        keyword
      };

      updateState({
        recordId,
        progress: 40,
        currentStep: 'Generating images...'
      });

      // 4단계: SSE 연결 시작
      console.log('🔗 Starting SSE connection...');
      sseRef.current = createSSEConnection(
        recordId,
        handleSSEEvent,
        (error) => {
          console.error('SSE connection error:', error);
          handleError('Connection lost during generation');
        },
        () => {
          console.log('✅ Generation completed');
          cleanup();
        }
      );

    } catch (error) {
      console.error('❌ Generation failed:', error);
      handleError(error instanceof Error ? error.message : 'Generation failed');
    }
  }, [user, cleanup, updateState, handleError, handleSSEEvent]);

  // 생성 취소
  const cancelGeneration = useCallback(() => {
    console.log('🛑 Cancelling generation...');
    cleanup();
    updateState({
      status: 'idle',
      progress: 0,
      currentStep: undefined,
      error: undefined,
      sessionId: undefined,
      recordId: undefined,
      generatedImages: undefined,
      generatedStory: undefined,
      generatedKeywords: undefined,
      recommendationImage: undefined
    });
  }, [cleanup, updateState]);

  // 상태 초기화
  const reset = useCallback(() => {
    cleanup();
    setState({
      status: 'idle',
      progress: 0
    });
  }, [cleanup]);

  return {
    // 상태
    ...state,
    isGenerating: state.status !== 'idle' && state.status !== 'completed' && state.status !== 'error',
    
    // 액션
    generate,
    cancelGeneration,
    reset,
    
    // SSE 연결 상태
    isSSEConnected: sseRef.current?.readyState === EventSource.OPEN
  };
}