// lib/api.ts - 새로운 백엔드 구조에 맞는 API 함수들

import { 
  CreateSessionResponse,
  HistorySession,
  GenerateRequest,
  GenerateResponse,
  LayerRoom,
  LayerRoomsResponse,
  PinToRoomRequest,
  RoomDetailResponse,
  ImageMetadataResponse,
  ImageMetadataRequest,
  SSEEventData
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

// JWT 토큰 가져오기 헬퍼 함수
async function getAuthToken(): Promise<string | null> {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

// ===== 히스토리 세션 관리 API =====

/**
 * 새로운 히스토리 세션 생성
 */
export async function createHistorySession(): Promise<CreateSessionResponse | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    console.log('🚀 Creating new history session...');

    const response = await fetch(`${API_BASE_URL}/api/v1/history_sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create session failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const data = await response.json() as CreateSessionResponse;
    console.log('✅ History session created:', data.session_id);
    return data;
  } catch (error) {
    console.error('Create history session error:', error);
    return null;
  }
}

/**
 * 사용자의 히스토리 세션 목록 조회
 */
export async function getHistorySessions(): Promise<HistorySession[] | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/history_sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const sessions = await response.json() as HistorySession[];
    console.log('✅ History sessions loaded:', sessions.length);
    return sessions;
  } catch (error) {
    console.error('Get history sessions error:', error);
    return null;
  }
}

/**
 * 히스토리 세션 삭제
 */
export async function deleteHistorySession(sessionId: string): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/history_sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 204) {
      console.log('✅ History session deleted:', sessionId);
      return true;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete session failed:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete history session error:', error);
    return false;
  }
}

// ===== 이미지 생성 API =====

/**
 * 비동기 이미지 생성 시작 (record_id 반환)
 */
export async function startImageGeneration(
  sessionId: string,
  imageKeys: string[],
  keyword?: string
): Promise<GenerateResponse | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.warn('No auth token available for generate API');
      return null;
    }

    const requestData: GenerateRequest = {
      session_id: sessionId,
      input_image_keys: imageKeys,
      keyword: keyword,
    };

    console.log('🎨 Starting image generation:', requestData);

    const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Generate API failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const data = await response.json() as GenerateResponse;
    console.log('✅ Generation started, record_id:', data.record_id);
    return data;
  } catch (error) {
    console.error('Start image generation error:', error);
    return null;
  }
}

/**
 * SSE 연결을 통한 생성 과정 모니터링
 */
export function createSSEConnection(
  recordId: string,
  onEvent: (eventData: SSEEventData) => void,
  onError?: (error: Event) => void,
  onComplete?: () => void
): EventSource {
  const url = `${API_BASE_URL}/api/v1/stream/${recordId}`;
  console.log('🔗 Creating SSE connection to:', url);
  
  const eventSource = new EventSource(url);

  // 이미지 생성 완료 이벤트
  eventSource.addEventListener('images_generated', (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📸 Images generated:', data.image_urls?.length);
      onEvent({ type: 'images_generated', data });
    } catch (error) {
      console.error('Error parsing images_generated event:', error);
    }
  });

  // 스토리 생성 완료 이벤트
  eventSource.addEventListener('story_generated', (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📝 Story generated');
      onEvent({ type: 'story_generated', data });
    } catch (error) {
      console.error('Error parsing story_generated event:', error);
    }
  });

  // 키워드 생성 완료 이벤트
  eventSource.addEventListener('keywords_generated', (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('🏷️ Keywords generated:', data.keywords?.length);
      onEvent({ type: 'keywords_generated', data });
    } catch (error) {
      console.error('Error parsing keywords_generated event:', error);
    }
  });

  // 추천 이미지 생성 완료 이벤트
  eventSource.addEventListener('recommendation_ready', (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('💡 Recommendation ready');
      onEvent({ type: 'recommendation_ready', data });
      
      // 모든 과정이 완료되었으므로 연결 종료
      eventSource.close();
      onComplete?.();
    } catch (error) {
      console.error('Error parsing recommendation_ready event:', error);
    }
  });

  // 에러 처리
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    onError?.(error);
  };

  // 연결 성공
  eventSource.onopen = () => {
    console.log('✅ SSE connection established');
  };

  return eventSource;
}

// ===== Layer Room 관리 API =====

/**
 * 사용자의 Layer Room 목록 조회
 */
export async function getLayerRooms(): Promise<LayerRoom[] | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${API_BASE_URL}/v1/layer_rooms`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rooms = await response.json() as LayerRoom[];
    console.log('✅ Layer rooms loaded:', rooms.length);
    return rooms;
  } catch (error) {
    console.error('Get layer rooms error:', error);
    return null;
  }
}

/**
 * 특정 Room의 상세 정보 조회
 */
export async function getRoomDetail(roomId: string): Promise<RoomDetailResponse | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${API_BASE_URL}/v1/layer_rooms/${roomId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const roomDetail = await response.json() as RoomDetailResponse;
    console.log('✅ Room detail loaded:', roomDetail.room_id);
    return roomDetail;
  } catch (error) {
    console.error('Get room detail error:', error);
    return null;
  }
}

/**
 * 이미지를 Room에 핀하기
 */
export async function pinToRoom(roomId: string, historyId: string): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const requestData: PinToRoomRequest = {
      history_id: historyId
    };

    const response = await fetch(`${API_BASE_URL}/v1/layer_rooms/${roomId}/pin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (response.status === 204) {
      console.log('✅ Image pinned to room:', roomId);
      return true;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pin to room failed:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Pin to room error:', error);
    return false;
  }
}

// ===== 기존 API 함수들 (호환성 유지) =====

/**
 * 이미지 메타데이터 저장
 */
export async function saveImageMetadata(
  fileKey: string,
  type: "input" | "generated" = "input"
): Promise<ImageMetadataResponse | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.warn('No auth token available');
      return null;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const requestData: ImageMetadataRequest = {
      file_key: fileKey,
      type: type,
    };

    console.log('🚀 Sending metadata request:', requestData);

    const response = await fetch(`${API_BASE_URL}/api/v1/images/metadata`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Metadata save failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const data = await response.json() as ImageMetadataResponse;
    console.log('✅ Metadata saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Save metadata error:', error);
    return null;
  }
}

/**
 * 통합 업로드 함수
 */
export async function uploadImageWithMetadata(
  file: File,
  type: "input" | "generated" = "input",
): Promise<{ imageId: string; publicUrl: string; fileKey: string } | null> {
  try {
    console.log('🚀 Starting direct upload process for:', file.name);

    let userId = 'guest-user';
    try {
      const { getCurrentUser } = await import('@/lib/supabase');
      const user = await getCurrentUser();
      if (user?.id) {
        userId = user.id;
      }
    } catch (authError) {
      console.warn('Could not get current user, using guest:', authError);
    }

    const { uploadImageDirect } = await import('@/lib/supabase');
    const uploadResult = await uploadImageDirect(file, userId);
    
    if (!uploadResult) {
      throw new Error('Direct upload failed');
    }

    console.log('✅ File uploaded directly to Supabase:', uploadResult);

    const metadataResult = await saveImageMetadata(
      uploadResult.fileKey,
      type
    );

    const imageId = metadataResult?.image_id || `direct_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const publicUrl = metadataResult?.url || uploadResult.publicUrl;

    console.log('✅ Upload with metadata process completed');

    return {
      imageId,
      publicUrl,
      fileKey: uploadResult.fileKey
    };

  } catch (error) {
    console.error('❌ Upload with metadata process failed:', error);
    return null;
  }
}