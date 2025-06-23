// API 응답 타입들
export interface ImageMetadataResponse {
  success: boolean;
  image_id: string;
  created_at: string;
}

export interface GenerateResponse {
  success: boolean;
  generated_images: Array<{
    image_id: string;
    file_key: string;
    public_url: string;
  }>;
  metadata: {
    keyword?: string;
    input_images: string[];
  };
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

// 생성된 행 타입 (확장)
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