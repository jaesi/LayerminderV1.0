// ===== 히스토리 세션 관련 타입들 =====
export interface HistorySession {
  session_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionResponse {
  session_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface HistorySessionsResponse {
  sessions: HistorySession[];
}

// ===== 생성 관련 타입들 =====
export interface GenerateRequest {
  session_id: string;
  input_image_keys: string[];
  keyword?: string;
}

export interface GenerateResponse {
  record_id: string;
  image_status: 'pending' | 'processing' | 'ready';
}

// ===== SSE 이벤트 타입들 =====
export interface BackendSSEImageEvent {
  // image_id와 seq 배열
  data: Array<{ image_id: string; seq: number }>;
}

export interface BackendSSEStoryEvent {
  // story 필드를 포함한 객체
  data: { story?: string };
}

export interface BackendSSEKeywordsEvent {
  // keywords 필드 (string 또는 array)
  data: { keywords?: string | string[] };
}

export interface BackendSSERecommendationEvent {
  // reference_image_id
  data: { reference_image_id?: string };
}

export interface BackendSSEErrorEvent {
  data: { step: string; error: string };
}

export interface BackendSSEFailedEvent {
  data: { reason: string; stage?: string };
}

export interface BackendSSEPingEvent {
  data: { t: number };
}

export interface BackendSSEDoneEvent {
  data: { ok: boolean };
}

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

// 프론트엔드에서 사용할 통합 이벤트 타입 (기존 유지하되 optional로 변경)
export interface SSEImageEvent {
  image_urls?: string[];
}

export interface SSEStoryEvent {
  story?: string;
}

export interface SSEKeywordsEvent {
  keywords?: string[];
}

export interface SSERecommendationEvent {
  url?: string;
}

export interface SSEErrorEvent {
  error?: string;
}

export type SSEEventData = 
  | { type: 'images_generated'; data: SSEImageEvent }
  | { type: 'story_generated'; data: SSEStoryEvent }
  | { type: 'keywords_generated'; data: SSEKeywordsEvent }
  | { type: 'recommendation_ready'; data: SSERecommendationEvent }
  | { type: 'error'; data: SSEErrorEvent };

// ===== Room 관련 타입들 =====
export interface LayerRoom {
  room_id: string;
  name: string;
  created_at: string;
}

export interface LayerRoomsResponse {
  rooms: LayerRoom[];
}

export interface PinToRoomRequest {
  history_id: string;
}

export interface RoomHistoryImage {
  image_id: string;
  url: string;
}

export interface RoomHistory {
  history_id: string;
  story: string;
  images: RoomHistoryImage[];
}

export interface RoomDetailResponse {
  room_id: string;
  name: string;
  histories: RoomHistory[];
}

// ===== 기존 타입들 (호환성 유지) =====
export interface ImageMetadataResponse {
  image_id: string;
  url: string;
  type: string;
  created_at: string;
}

export interface ImageMetadataRequest {
  file_key: string;
  type: "input" | "generated";
}

export interface UploadResult {
  imageId: string;
  publicUrl: string;
  fileKey: string;
}

// ===== 프론트엔드 상태 관리 타입들 =====
export interface GenerationState {
  status: 'idle' | 'creating_session' | 'uploading' | 'generating' | 'completed' | 'error';
  sessionId?: string;
  recordId?: string;
  progress: number;
  currentStep?: string;
  error?: string;
  
  // 생성 결과
  generatedImages?: string[];
  generatedStory?: string;
  generatedKeywords?: string[];
  recommendationImage?: string;
}

export interface DroppedFile {
  id: string;
  file: File;
  previewUrl: string;
}

// GeneratedRow 타입 
export interface GeneratedRow {
  id: string; // record_id
  sessionId: string;
  images: Array<{ 
    id: number; 
    src: string; 
    isPinned: boolean; 
    type: 'output' | 'reference';
    imageId?: string;
    fileKey?: string;
    roomImageId?: string;
  }>;
  keyword?: string;
  story?: string;
  generatedKeywords?: string[];
  recommendationImage?: string;
  boardId?: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'ready';
  metadata?: {
    inputImages: string[];
    generationTime?: number;
    generatedBy?: string;
  };
}

// ===== SSE 연결 관리 타입들 =====
export interface SSEConnection {
  eventSource: EventSource | null;
  recordId: string | null;
  isConnected: boolean;
  reconnectAttempts: number;
}

export interface SSEConfig {
  maxReconnectAttempts: number;
  reconnectInterval: number;
  timeout: number;
}

// ===== 에러 처리 타입들 =====
export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ===== Room 관련 타입들 =====
export interface LayerRoom {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  owner_id: string;
  slug: string;
  pin_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomRequest {
  name: string;
  description: string;
  is_public: boolean;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
}

export interface RoomImage {
  room_image_id: string;
  image_id: string;
  url: string;
  note: string;
  seq: number;
}

export interface AddImageToRoomRequest {
  image_id: string;
  note: string;
  seq: number;
}

export interface RoomListParams {
  page?: number;
  size?: number;
  mine?: boolean;
  q?: string;
}

// ===== 기존 BoardData 인터페이스 (호환성 유지) =====
export interface BoardData {
  id: number;
  name: string;
  images: Array<{ 
    id: number; 
    src: string; 
    isPinned: boolean; 
    type: 'output' | 'reference';
    imageId?: string;
    fileKey?: string;
    roomImageId?: string;
  }>;
  keyword: string;
}