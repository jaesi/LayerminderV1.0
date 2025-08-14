import { 
  CreateSessionResponse,
  HistorySession,
  GenerateRequest,
  GenerateResponse,
  ImageMetadataResponse,
  ImageMetadataRequest,
  CreateRoomRequest,
  LayerRoom,
  RoomListParams,
  UpdateRoomRequest,
  AddImageToRoomRequest,
  RoomImage,
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

// ===== SSE 이벤트 타입들 =====
export interface BackendImageData {
  image_id: string;
  seq: number;
  url: string;
}

export interface BackendStoryData {
  story: string;
}

export interface BackendKeywordsData {
  keywords: string[];
}

export interface BackendRecommendationData {
  reference_image_id: string;
  reference_image_url: string;
}

export interface BackendErrorData {
  step: string;
  error: string;
}

export interface BackendFailedData {
  reason: string;
  stage?: string;
}

export interface BackendPingData {
  t: number;
}

export interface BackendDoneData {
  ok: boolean;
}

// 통합 이벤트 타입
export interface ProcessedSSEEvent {
  type: 'images_generated' | 'story_generated' | 'keywords_generated' | 'recommendation_ready' | 'error' | 'complete' | 'ping';
  data: {
    image_urls?: string[];
    story?: string;
    keywords?: string[];
    recommendationUrl?: string;
    recommendationId?: string;
    error?: string;
    timestamp?: number;
  };
}

/**
 * SSE 연결
 */
export async function createSSEConnectionWithAuth(
  recordId: string,
  onEvent: (event: ProcessedSSEEvent) => void,
  onError?: (error: Event) => void,
  onComplete?: () => void
): Promise<EventSource | null> {
  try {
    const token = await getAuthToken();
    
    // 인증이 필요한 경우 토큰을 쿼리 파라미터로 전달
    let url = `${API_BASE_URL}/api/v1/stream/${recordId}`;
    // if (token) {
    //   url += `?token=${encodeURIComponent(token)}`;
    // }
    
    console.log('🔗 Creating SSE connection to:', url);
    
    const eventSource = new EventSource(url);
    
    // 연결 성공
    eventSource.onopen = () => {
      console.log('✅ SSE connection established');
    };

    // 1. 이미지 생성 완료 이벤트
    eventSource.addEventListener('images_generated', (event) => {
      try {
        const data: BackendImageData[] = JSON.parse(event.data);
        console.log('📸 Images generated (backend spec):', data.length, 'images');
        
        // URL들만 추출하여 순서대로 정렬
        const imageUrls = data
          .sort((a, b) => a.seq - b.seq)  // seq로 정렬
          .map(item => item.url)
          .filter(url => url);  // null/undefined 제거
        
        onEvent({
          type: 'images_generated',
          data: { image_urls: imageUrls }
        });
      } catch (error) {
        console.error('Error parsing images_generated event:', error);
        onEvent({
          type: 'error',
          data: { error: 'Failed to parse images data' }
        });
      }
    });

    // 2. 스토리 생성 완료 이벤트
    eventSource.addEventListener('story_generated', (event) => {
      try {
        const data: BackendStoryData = JSON.parse(event.data);
        console.log('📝 Story generated (backend spec)');
        
        onEvent({
          type: 'story_generated',
          data: { story: data.story || '' }
        });
      } catch (error) {
        console.error('Error parsing story_generated event:', error);
        onEvent({
          type: 'error',
          data: { error: 'Failed to parse story data' }
        });
      }
    });

    // 3. 키워드 생성 완료 이벤트
    eventSource.addEventListener('keywords_generated', (event) => {
      try {
        const data: BackendKeywordsData = JSON.parse(event.data);
        console.log('🏷️ Keywords generated (backend spec):', data.keywords?.length || 0);
        
        onEvent({
          type: 'keywords_generated',
          data: { keywords: data.keywords || [] }
        });
      } catch (error) {
        console.error('Error parsing keywords_generated event:', error);
        onEvent({
          type: 'error',
          data: { error: 'Failed to parse keywords data' }
        });
      }
    });

    // 4. 추천 생성 완료 이벤트 (백엔드 이벤트명: recommendation_generated)
    eventSource.addEventListener('recommendation_generated', (event) => {
      try {
        const data: BackendRecommendationData = JSON.parse(event.data);
        console.log('💡 Recommendation generated (backend spec):', data.reference_image_id);
        
        onEvent({
          type: 'recommendation_ready',
          data: { 
            recommendationUrl: data.reference_image_url || '',
            recommendationId: data.reference_image_id || ''
          }
        });
        
        // 추천 이미지가 생성되면 모든 과정 완료
        onComplete?.();
      } catch (error) {
        console.error('Error parsing recommendation_generated event:', error);
        onEvent({
          type: 'error',
          data: { error: 'Failed to parse recommendation data' }
        });
      }
    });

    // 5. 완료 이벤트
    eventSource.addEventListener('done', (event) => {
      try {
        const data: BackendDoneData = JSON.parse(event.data);
        console.log('✅ Generation process completed (backend spec):', data.ok);
        
        if (data.ok) {
          onEvent({
            type: 'complete',
            data: {}
          });
        }
        
        eventSource.close();
        onComplete?.();
      } catch (error) {
        console.error('Error parsing done event:', error);
      }
    });

    // 6. 에러 이벤트 처리 수정
    eventSource.addEventListener('error', (event: MessageEvent) => {
      try {
        // event.data가 비어있거나 undefined인 경우 처리
        if (!event.data || event.data === 'undefined') {
          onEvent({
            type: 'error',
            data: { error: 'Connection error occurred' }
          });
          return;
        }
        
        const data: BackendErrorData = JSON.parse(event.data);
        console.error('❌ SSE error event (backend spec):', data);
        
        onEvent({
          type: 'error',
          data: { error: `${data.step}: ${data.error}` }
        });
      } catch (error) {
        console.error('Error parsing error event:', error);
        onEvent({
          type: 'error',
          data: { error: 'Connection error occurred' }
        });
      }
    });

    // 7. 생성 실패 이벤트
    eventSource.addEventListener('generation_failed', (event) => {
      try {
        const data: BackendFailedData = JSON.parse(event.data);
        console.error('❌ Generation failed (backend spec):', data);
        
        const errorMessage = data.reason === 'timeout' 
          ? 'Generation timed out (90 seconds)' 
          : `Generation failed: ${data.reason}${data.stage ? ` (${data.stage})` : ''}`;
        
        onEvent({
          type: 'error',
          data: { error: errorMessage }
        });
        
        eventSource.close();
        onError?.(new Event('generation_failed'));
      } catch (error) {
        console.error('Error parsing generation_failed event:', error);
      }
    });

    // 8. Heartbeat/Ping (20초마다)
    eventSource.addEventListener('ping', (event) => {
      try {
        const data: BackendPingData = JSON.parse(event.data);
        console.log('💓 SSE heartbeat (backend spec):', new Date(data.t * 1000).toLocaleTimeString());
        
        onEvent({
          type: 'ping',
          data: { timestamp: data.t }
        });
      } catch {
        // ping 파싱 실패는 무시
      }
    });

    // 일반 에러 처리 (연결 실패, 네트워크 오류 등)
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      console.error('SSE readyState:', eventSource.readyState);
      console.error('SSE url:', eventSource.url);
      
      // 연결 상태별 처리
      switch (eventSource.readyState) {
        case EventSource.CONNECTING:
          console.log('SSE: Attempting to reconnect...');
          break;
        case EventSource.CLOSED:
          console.log('SSE: Connection closed');
          onEvent({
            type: 'error',
            data: { error: 'Connection lost during generation' }
          });
          break;
        case EventSource.OPEN:
          console.log('SSE: Connection is open but error occurred');
          break;
      }
      
      onError?.(error);
    };

    return eventSource;

  } catch (error) {
    console.error('Failed to create SSE connection:', error);
    onError?.(new Event('connection_failed'));
    return null;
  }
}

// ===== API 함수들 =====

/**
 * 사용자의 단일 히스토리 세션 가져오기 (없으면 생성)
 */
export async function getUserHistorySession(): Promise<CreateSessionResponse | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    console.log('🔍 Getting user history session...');

    // 1. 먼저 기존 세션 조회
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
    
    // 2. 기존 세션이 있으면 첫 번째 것 반환 (가장 최근 것)
    if (sessions && sessions.length > 0) {
      const existingSession = sessions[0];
      console.log('✅ Found existing history session:', existingSession.session_id);
      return {
        session_id: existingSession.session_id,
        user_id: existingSession.user_id,
        created_at: existingSession.created_at,
        updated_at: existingSession.updated_at
      };
    }

    // 3. 기존 세션이 없으면 새로 생성
    console.log('🚀 Creating new history session...');
    return await createHistorySession();

  } catch (error) {
    console.error('Get user history session error:', error);
    return null;
  }
}

/**
 * 새로운 히스토리 세션 생성
 */
async function createHistorySession(): Promise<CreateSessionResponse | null> {
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

/**
 * 비동기 이미지 생성 시작 (record_id 반환)
 */
export async function startImageGeneration(
  sessionId: string,
  imageKeys: string[],
  keyword?: string,
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

// ===== Room 관련 API 함수들 =====

/**
 * Room 생성
 */
export async function createRoom(roomData: CreateRoomRequest): Promise<LayerRoom | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/layer-rooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roomData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const data = await response.json() as LayerRoom;
    console.log('✅ Room created:', data.id);
    return data;
  } catch (error) {
    console.error('Create room error:', error);
    return null;
  }
}

/**
 * Room 목록 조회
 */
export async function getRooms(params?: RoomListParams): Promise<LayerRoom[] | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.size) searchParams.append('size', params.size.toString());
    if (params?.mine !== undefined) searchParams.append('mine', params.mine.toString());
    if (params?.q) searchParams.append('q', params.q);

    const url = `${API_BASE_URL}/api/v1/layer-rooms${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    const response = await fetch(url, {
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
    console.log('✅ Rooms loaded:', rooms.length);
    return rooms;
  } catch (error) {
    console.error('Get rooms error:', error);
    return null;
  }
}

/**
 * Room 정보 조회
 */
export async function getRoom(roomId: string): Promise<LayerRoom | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/layer-rooms/${roomId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const room = await response.json() as LayerRoom;
    console.log('✅ Room loaded:', room.id);
    return room;
  } catch (error) {
    console.error('Get room error:', error);
    return null;
  }
}

/**
 * Room 업데이트
 */
export async function updateRoom(roomId: string, updateData: UpdateRoomRequest): Promise<LayerRoom | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/layer-rooms/${roomId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const room = await response.json() as LayerRoom;
    console.log('✅ Room updated:', room.id);
    return room;
  } catch (error) {
    console.error('Update room error:', error);
    return null;
  }
}

/**
 * Room 삭제
 */
export async function deleteRoom(roomId: string): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/layer-rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 204) {
      console.log('✅ Room deleted:', roomId);
      return true;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete room failed:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete room error:', error);
    return false;
  }
}

/**
 * Room에 이미지 추가
 */
export async function addImageToRoom(roomId: string, imageData: AddImageToRoomRequest): Promise<RoomImage | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/layer-rooms-image/${roomId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const roomImage = await response.json() as RoomImage;
    console.log('✅ Image added to room:', roomImage.room_image_id);
    return roomImage;
  } catch (error) {
    console.error('Add image to room error:', error);
    return null;
  }
}

/**
 * Room 이미지 목록 조회
 */
export async function getRoomImages(roomId: string): Promise<RoomImage[] | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/layer-rooms-image/${roomId}/images`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const images = await response.json() as RoomImage[];
    console.log('✅ Room images loaded:', images.length);
    return images;
  } catch (error) {
    console.error('Get room images error:', error);
    return null;
  }
}

/**
 * Room에서 이미지 제거
 */
export async function removeImageFromRoom(roomId: string, imageId: string): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication token required');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/layer-rooms-image/${roomId}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 204) {
      console.log('✅ Image removed from room:', imageId);
      return true;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remove image from room failed:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Remove image from room error:', error);
    return false;
  }
}

// 기존 업로드 및 메타데이터 함수들 유지
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