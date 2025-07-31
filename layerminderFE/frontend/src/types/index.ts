// API 응답 타입들

// 메타데이터 등록 응답
export interface ImageMetadataResponse {
  image_id: string
  url: string;
  type: string;
  created_at: string;
}

// ai 생성 응답
export interface GenerateResponse {
  image_keys: string[];   
  urls: string[]; 
}

// 새로운 업로드 관련 타입들
export interface UploadUrlResponse {
  success: boolean;
  upload_url: string;
  public_url: string;
  file_key: string;
  expires: number;
}

export interface UploadUrlRequest {
  file_name: string;
  file_type: string;
}

// API 요청 타입들 
// 메타데이터 등록 요청
export interface ImageMetadataRequest {
  file_key: string;
  type: "input" | "generated";
}
// ai 생성 요청
export interface GenerateRequest {
  input_image_keys: string[];
  keyword?: string;
}

// 메타데이터 타입들 
export interface ImageMetadata {
  originalName?: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  boardId?: string;
  keywords?: string[];
  [key: string]: unknown; // 추가 메타데이터를 위한 인덱스 시그니처
}

// 사용자 이미지 조회 응답
export interface UserImagesResponse {
  success: boolean;
  images: UserImage[];
}

export interface UserImage {
  id: string;
  user_id: string;
  type: string;
  file_key: string;
  meta: ImageMetadata | null;
  created_at: string;
  url: string;
}

// 드롭된 파일 타입
export interface DroppedFile {
  id: string;
  file: File;
  previewUrl: string;
}

// 업로드된 이미지 정보
export interface UploadedImage {
  imageId: string;
  fileKey: string;
  publicUrl: string;
  file: File;
}

// 새로운 통합 업로드 결과 타입
export interface UploadResult {
  imageId: string;
  publicUrl: string;
  fileKey: string;
}

// 생성된 행 타입
export interface GeneratedRow {
  id: string;
  images: Array<{ 
    id: number; 
    src: string; 
    isPinned: boolean; 
    type: 'output' | 'reference';
    imageId?: string;  // API에서 받은 image_id
    fileKey?: string;  // Storage의 file_key
  }>;
  keyword: string;
  boardId?: number;
  createdAt: Date;
  metadata?: {
    inputImages: string[];
    generationTime?: number;
    generatedBy?: string; // 생성자 정보
  };
}

// 기존 BoardData 인터페이스 확장
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

// 에러 처리를 위한 타입들
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