'use client'

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GenerationState,
  DroppedFile,
  GeneratedRow,
  ProcessedSSEEvent,
  GenerationContext
} from '@/types';
import {
  getUserHistorySession,
  startImageGeneration,
  createSSEConnectionWithAuth,
  uploadImageWithMetadata,
  addImageToRoom
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface UseGenerationOptions {
  context?: GenerationContext; 
  onComplete?: (result: GeneratedRow) => void;
  onError?: (error: string) => void;
  onProgress?: (step: string, progress: number) => void;
}

export function useGeneration(options: UseGenerationOptions = {}) {
  const { user } = useAuth();
  const { onComplete, onError, onProgress, context } = options;

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
    context?: GenerationContext;
  } | null>(null);

  // 생성 결과를 실시간으로 저장하는 ref
  const generationResultRef = useRef<{
    images?: string[];
    story?: string;
    keywords?: string[];
    recommendation?: string;
  }>({});

  // SSE 연결 정리
  const cleanup = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    currentGenerationRef.current = null;
    generationResultRef.current = {}; // 결과도 초기화
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
  const handleSSEEvent = useCallback((eventData: ProcessedSSEEvent) => {
    const current = currentGenerationRef.current;
    if (!current) return;

    switch (eventData.type) {
      case 'images_generated':
        console.log('📸 Images received:', eventData.data.image_urls?.length || 0);
        // ref에 이미지 저장
        generationResultRef.current.images = eventData.data.image_urls || [];
        updateState({
          generatedImages: eventData.data.image_urls || [],
          currentStep: 'Generating story...',
          progress: 30
        });
        break;

      case 'story_generated':
        console.log('📝 Story received');
        // 🔥 ref에 스토리 저장
        generationResultRef.current.story = eventData.data.story;
        updateState({
          generatedStory: eventData.data.story,
          currentStep: 'Extracting keywords...',
          progress: 60
        });
        break;

      case 'keywords_generated':
        console.log('🏷️ Keywords received:', eventData.data.keywords?.length || 0);
        // ref에 키워드 저장
        generationResultRef.current.keywords = eventData.data.keywords || [];
        updateState({
          generatedKeywords: eventData.data.keywords || [],
          currentStep: 'Generating recommendations...',
          progress: 80
        });
        break;

      case 'recommendation_ready':
        console.log('💡 Recommendation received');
        // ref에 추천 이미지 저장
        generationResultRef.current.recommendation = eventData.data.recommendationUrl;
        updateState({
          recommendationImage: eventData.data.recommendationUrl,
          status: 'completed',
          currentStep: 'Completed!',
          progress: 100
        });

        // ref의 데이터를 사용해서 최종 결과 생성
        const resultData = generationResultRef.current;
        const result: GeneratedRow = {
          id: current.recordId,
          sessionId: current.sessionId,
          images: [
            // ref에서 생성된 이미지들 가져오기
            ...(resultData.images || []).map((url, index) => ({
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
          story: resultData.story,
          generatedKeywords: resultData.keywords,
          recommendationImage: resultData.recommendation,
          createdAt: new Date(),
          status: 'ready',
          metadata: {
            inputImages: current.inputImages,
            generationTime: Date.now(),
            generatedBy: user?.id || 'guest'
          }
        };

        console.log('🎉 Final result created with images:', result.images.length);
        console.log('🖼️ Generated images count:', resultData.images?.length || 0);

        // Room 모드인 경우 자동으로 Room에 이미지 추가
        if (current.context?.mode === 'room' && current.context.targetId) {
          const roomId = current.context.targetId;
          console.log('🏠 Auto-adding images to room...');
          
          // 생성된 이미지들을 Room에 추가
          const addPromises = (resultData.images || []).map(async (imageUrl, index) => {
            const imageId = `generated_${current.recordId}_${index}`;
            return addImageToRoom(roomId, {
              image_id: imageId,
              note: `Generated: ${current.keyword}`,
              seq: index
            });
          });
          
          Promise.all(addPromises)
            .then(() => {
              console.log('✅ Images automatically added to room');
            })
            .catch(err => {
              console.error('❌ Failed to add images to room:', err);
            });
        }

        onComplete?.(result);
        break;

      case 'complete':
        console.log('✅ All generation processes completed');
        break;

      case 'ping':
        console.log('💓 SSE heartbeat received');
        break;

      case 'error':
        console.error('❌ SSE error received:', eventData.data.error);
        handleError(eventData.data.error || 'Unknown error occurred');
        break;
    }
  }, [updateState, onComplete, user?.id, handleError]);

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

      let sessionId: string;

      // 컨텍스트에 따른 세션 ID 결정
      if (context?.mode === 'room' && context.targetId) {
        // Room 모드: 사용자의 단일 히스토리 세션 사용 (Room ID는 추가 용도로만)
        console.log('🏠 Room mode: Getting user history session...');
        const sessionResult = await getUserHistorySession();
        
        if (!sessionResult) {
          throw new Error('Failed to get user history session for room generation');
        }
        
        sessionId = sessionResult.session_id;
        console.log('🔄 Using user history session for room:', sessionId);
      } else {
        // 일반 모드: 사용자의 단일 히스토리 세션 사용
        updateState({
          status: 'creating_session',
          progress: 10,
          currentStep: 'Getting session...',
          error: undefined
        });

        console.log('🚀 Getting user history session...');
        const sessionResult = await getUserHistorySession();
      
        if (!sessionResult) {
          throw new Error('Failed to get user history session');
        }

        sessionId = sessionResult.session_id;
        console.log('✅ User history session ready:', sessionId);
      }

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
      const keyword = keywords.length > 0 ? keywords[0] : 'Undefined';

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
        keyword,
        context
      };

      updateState({
        recordId,
        progress: 40,
        currentStep: 'Generating images...'
      });

      // 4단계: SSE 연결 시작
      console.log('🔗 Starting SSE connection...');
      const eventSource = await createSSEConnectionWithAuth(
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

      if (eventSource) {
        sseRef.current = eventSource;
      } else {
        throw new Error('Failed to establish SSE connection');
      }

    } catch (error) {
      console.error('❌ Generation failed:', error);
      handleError(error instanceof Error ? error.message : 'Generation failed');
    }
  }, [user, cleanup, updateState, handleError, handleSSEEvent, context]);

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