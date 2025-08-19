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

// TopPanel 애니메이션 상태 
interface AnimationState {
  // 이미지 애니메이션
  animatedImages: string[];
  animatedImageIds: string[];
  imageAnimationComplete: boolean;

  // 스토리 애니메이션
  animatedStoryText: string; // 현재까지 타이핑된 텍스트
  storyAnimationComplete: boolean;
  
  // 키워드 애니메이션
  animatedKeywords: string[]; // 현재까지 애니메이션으로 표시된 키워드들
  keywordAnimationComplete: boolean;
  
  // 추천 이미지
  recommendationVisible: boolean;
}

// GenerationState
interface ExtendedGenerationState extends GenerationState {
  animation: AnimationState;
}

interface UseGenerationOptions {
  context?: GenerationContext; 
  onComplete?: (result: GeneratedRow) => void;
  onError?: (error: string) => void;
  onProgress?: (step: string, progress: number) => void;
  onImageAnimationUpdate?: (images: string[], imageIds: string[]) => void; // 이미지 애니메이션 콜백
  onStoryAnimationUpdate?: (text: string) => void; // 스토리 애니메이션 콜백
  onKeywordAnimationUpdate?: (keywords: string[]) => void; // 키워드 애니메이션 콜백
  onRecommendationShow?: () => void; // 추천 이미지 표시 콜백
}

export function useGeneration(options: UseGenerationOptions = {}) {
  const { user } = useAuth();
  const { 
    onComplete, 
    onError, 
    onProgress, 
    context,
    onImageAnimationUpdate,
    onStoryAnimationUpdate,
    onKeywordAnimationUpdate,
    onRecommendationShow 
  } = options;

  const [state, setState] = useState<ExtendedGenerationState>({
    status: 'idle',
    progress: 0,
    animation: {
      animatedImages: [],
      animatedImageIds: [],
      imageAnimationComplete: false,
      animatedStoryText: '',
      storyAnimationComplete: false,
      animatedKeywords: [],
      keywordAnimationComplete: false,
      recommendationVisible: false
    }
  });

  const sseRef = useRef<EventSource | null>(null);
  const currentGenerationRef = useRef<{
    sessionId: string;
    recordId: string;
    inputImages: string[];
    keyword?: string;
    context?: GenerationContext;
  } | null>(null);

  // 애니메이션 타이머들을 관리하는 ref
  const animationTimersRef = useRef<{
    imageTimers: NodeJS.Timeout[];
    storyTimer: NodeJS.Timeout | null;
    keywordTimers: NodeJS.Timeout[];
    recommendationTimer: NodeJS.Timeout | null;
  }>({
    imageTimers: [],
    storyTimer: null,
    keywordTimers: [],
    recommendationTimer: null
  });

  // 생성 결과를 실시간으로 저장하는 ref
  const generationResultRef = useRef<{
    images?: string[];
    imageIds?: string[];
    story?: string;
    keywords?: string[];
    recommendation?: string;
  }>({});

  // 애니메이션 타이머들 정리
  const clearAnimationTimers = useCallback(() => {
    const timers = animationTimersRef.current;
    
    // 이미지 타이머들 정리
    timers.imageTimers.forEach(timer => clearTimeout(timer));
    timers.imageTimers = [];
    
    // 스토리 타이머 정리
    if (timers.storyTimer) {
      clearTimeout(timers.storyTimer);
      timers.storyTimer = null;
    }
    
    // 키워드 타이머들 정리
    timers.keywordTimers.forEach(timer => clearTimeout(timer));
    timers.keywordTimers = [];
    
    // 추천 타이머 정리
    if (timers.recommendationTimer) {
      clearTimeout(timers.recommendationTimer);
      timers.recommendationTimer = null;
    }
  }, []);

  // SSE 연결 정리
  const cleanup = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    currentGenerationRef.current = null;
    generationResultRef.current = {}; // 결과도 초기화
    clearAnimationTimers();
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // 상태 업데이트 헬퍼
  const updateState = useCallback((updates: Partial<ExtendedGenerationState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // 진행상황 콜백 호출
      if (newState.currentStep && newState.progress !== prev.progress) {
        onProgress?.(newState.currentStep, newState.progress);
      }
      
      return newState;
    });
  }, [onProgress]);

  // 애니메이션 상태만 업데이트하는 헬퍼
  const updateAnimationState = useCallback((updates: Partial<AnimationState> | ((prev: AnimationState) => Partial<AnimationState>)) => {
    setState(prev => ({
      ...prev,
      animation: { 
        ...prev.animation, 
        ...(typeof updates === 'function' ? updates(prev.animation) : updates)
      }
    }));
  }, []);

  // 이미지 순차 애니메이션 시작
  const startImageAnimation = useCallback((images: string[], imageIds: string[]) => {
    console.log('🎬 Starting image animation with', images.length, 'images');
    
    // 애니메이션 상태 초기화
    updateAnimationState({
      animatedImages: [],
      animatedImageIds: [],
      imageAnimationComplete: false
    });

    // 각 이미지를 0.3초씩 딜레이하며 순차 표시
    images.forEach((imageUrl, index) => {
      const timer = setTimeout(() => {
        updateAnimationState(prev => {
          const newAnimatedImages = [...prev.animatedImages, imageUrl];
          const newAnimatedImageIds = [...prev.animatedImageIds, imageIds[index]];
          
          console.log(`🖼️ Image ${index + 1}/${images.length} animated`);
          
          // 콜백 호출
          onImageAnimationUpdate?.(newAnimatedImages, newAnimatedImageIds);
          
          return {
            ...prev,
            animatedImages: newAnimatedImages,
            animatedImageIds: newAnimatedImageIds,
            imageAnimationComplete: index === images.length - 1
          };
        });
      }, index * 300); // 0.3초씩 딜레이
      
      animationTimersRef.current.imageTimers.push(timer);
    });
  }, [updateAnimationState, onImageAnimationUpdate]);

  // 스토리 타이핑 애니메이션 시작
  const startStoryAnimation = useCallback((fullStory: string) => {
    console.log('✍️ Starting story typing animation');
    
    updateAnimationState({
      animatedStoryText: '',
      storyAnimationComplete: false
    });

    // 단어 단위로 타이핑 효과
    const words = fullStory.split(' ');
    let currentWordIndex = 0;
    
    const typeNextWord = () => {
      if (currentWordIndex < words.length) {
        const currentText = words.slice(0, currentWordIndex + 1).join(' ');
        
        updateAnimationState(prev => ({
          ...prev,
          animatedStoryText: currentText,
          storyAnimationComplete: currentWordIndex === words.length - 1
        }));
        
        onStoryAnimationUpdate?.(currentText);
        
        currentWordIndex++;
        animationTimersRef.current.storyTimer = setTimeout(typeNextWord, 50); // 50ms마다 단어 추가
      }
    };
    
    typeNextWord();
  }, [updateAnimationState, onStoryAnimationUpdate]);

  // 키워드 순차 애니메이션 시작
  const startKeywordAnimation = useCallback((keywords: string[]) => {
    console.log('🏷️ Starting keyword animation with', keywords.length, 'keywords');
    
    updateAnimationState({
      animatedKeywords: [],
      keywordAnimationComplete: false
    });

    // 각 키워드를 0.3초씩 딜레이하며 순차 표시
    keywords.forEach((keyword, index) => {
      const timer = setTimeout(() => {
        updateAnimationState(prev => {
          const newAnimatedKeywords = [...prev.animatedKeywords, keyword];
          
          console.log(`🔖 Keyword ${index + 1}/${keywords.length} animated: ${keyword}`);
          
          onKeywordAnimationUpdate?.(newAnimatedKeywords);
          
          return {
            ...prev,
            animatedKeywords: newAnimatedKeywords,
            keywordAnimationComplete: index === keywords.length - 1
          };
        });
      }, index * 300); // 0.3초씩 딜레이
      
      animationTimersRef.current.keywordTimers.push(timer);
    });
  }, [updateAnimationState, onKeywordAnimationUpdate]);

  // 추천 이미지 표시
  const showRecommendation = useCallback(() => {
    console.log('💡 Showing recommendation');
    
    updateAnimationState({
      recommendationVisible: true
    });
    
    onRecommendationShow?.();
  }, [updateAnimationState, onRecommendationShow]);

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

  // SSE 이벤트 처리 (기존 로직 + 애니메이션 트리거)
  const handleSSEEvent = useCallback((eventData: ProcessedSSEEvent) => {
    const current = currentGenerationRef.current;
    if (!current) return;

    switch (eventData.type) {
      case 'images_generated':
        console.log('📸 Images received, starting animation...');
        
        // ref에 실제 데이터 저장
        generationResultRef.current.images = eventData.data.image_urls || [];
        generationResultRef.current.imageIds = eventData.data.image_ids || [];

        updateState({
          generatedImages: eventData.data.image_urls || [],
          currentStep: 'Generating story...',
          progress: 50
        });

        // 이미지 애니메이션 시작
        startImageAnimation(
          eventData.data.image_urls || [], 
          eventData.data.image_ids || []
        );
        break;

      case 'story_generated':
        console.log('📝 Story received, starting typing animation...');
        
        generationResultRef.current.story = eventData.data.story;
        
        updateState({
          generatedStory: eventData.data.story,
          currentStep: 'Extracting keywords...',
          progress: 60
        });

        // 스토리 타이핑 애니메이션 시작
        if (eventData.data.story) {
          startStoryAnimation(eventData.data.story);
        }
        break;

      case 'keywords_generated':
        console.log('🏷️ Keywords received, starting keyword animation...');
        
        generationResultRef.current.keywords = eventData.data.keywords || [];
        
        updateState({
          generatedKeywords: eventData.data.keywords || [],
          currentStep: 'Generating recommendations...',
          progress: 80
        });

        // 키워드 애니메이션 시작
        startKeywordAnimation(eventData.data.keywords || []);
        break;

      case 'recommendation_ready':
        console.log('💡 Recommendation received');
        
        generationResultRef.current.recommendation = eventData.data.recommendationUrl;

        updateState({
          recommendationImage: eventData.data.recommendationUrl,
          // status: 'completed',
          currentStep: 'Completed!',
          progress: 100
        });
        
        // 추천 이미지 표시
        showRecommendation();
        
        // 최종 결과 생성 및 완료 처리
        const resultData = generationResultRef.current;
        const result: GeneratedRow = {
          id: current.recordId,
          sessionId: current.sessionId,
          images: [
            ...(resultData.images || []).map((url, index) => {
              const backendImageId = resultData.imageIds?.[index];
              return {
                id: Date.now() + index + 1,
                src: url,
                isPinned: false,
                type: 'output' as const,
                imageId: backendImageId || `fallback_${current.recordId}_${index}`,
              };
            }),
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

        // Room 모드 처리
        if (current.context?.mode === 'room' && current.context.targetId) {
          const roomId = current.context.targetId;
          const addPromises = (resultData.images || []).map(async (imageUrl, index) => {
            const imageId = resultData.imageIds?.[index];
            if (!imageId) return null;
            return addImageToRoom(roomId, {
              image_id: imageId,
              note: `Generated: ${current.keyword}`,
              seq: index
            });
          });
          
          Promise.all(addPromises)
            .then(() => console.log('✅ Images automatically added to room'))
            .catch(err => console.error('❌ Failed to add images to room:', err));
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
  }, [
    updateState, 
    startImageAnimation, 
    startStoryAnimation, 
    startKeywordAnimation, 
    showRecommendation, 
    onComplete, 
    user?.id, 
    handleError
  ]);

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
      // 🔧 Gallery 이미지와 일반 파일 분리 처리
  const uploadPromises = files.map(async (item) => {
    // Gallery 이미지인 경우 업로드 건너뛰고 URL 정보만 사용
    if (item.isGalleryImage && item.originalUrl) {
      console.log('📋 Gallery 이미지 감지 - 업로드 건너뛰기:', item.originalUrl);
      
      // URL에서 파일 키 추출
      try {
        const urlObj = new URL(item.originalUrl);
        // "https://uscwuogmxxaxwvfueasr.supabase.co/storage/v1/object/public/layerminder/generated/user_id/filename.jpeg?"
        // → "generated/user_id/filename.jpeg"
        const pathParts = urlObj.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === 'layerminder');
        
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const fileKey = pathParts.slice(bucketIndex + 1).join('/').replace(/\?$/, ''); // 끝의 ? 제거
          
          console.log('🔑 Gallery 이미지 파일 키 추출:', fileKey);
          
          return {
            fileKey: fileKey,
            publicUrl: item.originalUrl,
            uploadMethod: 'gallery_reuse'
          };
        } else {
          throw new Error('Invalid Supabase URL format');
        }
        
      } catch (error) {
        console.error('❌ Gallery 이미지 URL 파싱 실패:', error);
        throw new Error(`Gallery image processing failed: ${item.originalUrl}`);
      }
    } 
    
    // 일반 파일인 경우 기존 업로드 로직 사용
    else {
      console.log('📤 일반 파일 업로드:', item.file.name);
      const uploadResult = await uploadImageWithMetadata(item.file, 'input');
      
      if (!uploadResult) {
        throw new Error(`Upload failed: ${item.file.name}`);
      }
      
      return uploadResult;
    }
  });

  const uploadResults = await Promise.all(uploadPromises);
  console.log('✅ 모든 이미지 처리 완료:', uploadResults);

  // 파일 키 추출 (Gallery 이미지와 업로드된 파일 모두 포함)
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
      recommendationImage: undefined,
      animation: {
        animatedImages: [],
        animatedImageIds: [],
        imageAnimationComplete: false,
        animatedStoryText: '',
        storyAnimationComplete: false,
        animatedKeywords: [],
        keywordAnimationComplete: false,
        recommendationVisible: false
      }
    });
  }, [cleanup, updateState]);

  // 상태 초기화
  const reset = useCallback(() => {
    cleanup();
    setState({
      status: 'idle',
      progress: 0,
      animation: {
        animatedImages: [],
        animatedImageIds: [],
        imageAnimationComplete: false,
        animatedStoryText: '',
        storyAnimationComplete: false,
        animatedKeywords: [],
        keywordAnimationComplete: false,
        recommendationVisible: false
      }
    });
  }, [cleanup]);

  return {
    // 상태
    ...state,
    isGenerating: state.status !== 'idle' && state.status !== 'completed' && state.status !== 'error',

    animationState: state.animation,
    
    // 액션
    generate,
    cancelGeneration,
    reset,
    
    // SSE 연결 상태
    isSSEConnected: sseRef.current?.readyState === EventSource.OPEN
  };
}