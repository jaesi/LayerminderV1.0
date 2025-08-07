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
export interface SSEImageEvent {
  image_urls: string[];
}

export interface SSEStoryEvent {
  story: string;
}

export interface SSEKeywordsEvent {
  keywords: string[];
}

export interface SSERecommendationEvent {
  url: string;
}

export type SSEEventData = 
  | { type: 'images_generated'; data: SSEImageEvent }
  | { type: 'story_generated'; data: SSEStoryEvent }
  | { type: 'keywords_generated'; data: SSEKeywordsEvent }
  | { type: 'recommendation_ready'; data: SSERecommendationEvent };

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

// 새로운 GeneratedRow 타입 (세션/레코드 기반)
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
  }>;
  keyword: string;
}