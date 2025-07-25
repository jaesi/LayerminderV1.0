import { ImageMetadataResponse, GenerateResponse, ImageMetadata, UserImagesResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

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

// 1단계: Presigned URL 요청
export async function getUploadUrl(
  fileName: string,
  fileType: string
): Promise<UploadUrlResponse | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: fileName,
        file_type: fileType,
      } as UploadUrlRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as UploadUrlResponse;
    return data;
  } catch (error) {
    console.error('Get upload URL error:', error);
    return null;
  }
}

// 2단계: Presigned URL로 파일 업로드
export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File
): Promise<boolean> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    return response.ok;
  } catch (error) {
    console.error('Upload to presigned URL error:', error);
    return false;
  }
}

// 3단계: 이미지 메타데이터 저장 (수정된 버전)
export async function saveImageMetadata(
  publicUrl: string,
  type: string = 'input',
  meta?: ImageMetadata
): Promise<ImageMetadataResponse | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/images/metadata`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: publicUrl,
        type: type,
        meta: meta,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as ImageMetadataResponse;
    return data;
  } catch (error) {
    console.error('Save metadata error:', error);
    return null;
  }
}

// 통합 업로드 함수 (전체 프로세스)
export async function uploadImageWithMetadata(
  file: File,
  type: string = 'input',
  meta?: ImageMetadata
): Promise<{ imageId: string; publicUrl: string; fileKey: string } | null> {
  try {
    console.log('🚀 Starting upload process for:', file.name);

    // 1단계: Presigned URL 요청
    const uploadUrlData = await getUploadUrl(file.name, file.type);
    if (!uploadUrlData || !uploadUrlData.success) {
      throw new Error('Failed to get upload URL');
    }

    console.log('✅ Got presigned URL');

    // 2단계: 파일 업로드
    const uploadSuccess = await uploadFileToPresignedUrl(uploadUrlData.upload_url, file);
    if (!uploadSuccess) {
      throw new Error('Failed to upload file');
    }

    console.log('✅ File uploaded successfully');

    // 3단계: 메타데이터 저장
    const metadataResult = await saveImageMetadata(
      uploadUrlData.public_url,
      type,
      {
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        ...meta
      }
    );

    if (!metadataResult || !metadataResult.success) {
      throw new Error('Failed to save metadata');
    }

    console.log('✅ Metadata saved successfully');

    return {
      imageId: metadataResult.image_id,
      publicUrl: uploadUrlData.public_url,
      fileKey: uploadUrlData.file_key
    };

  } catch (error) {
    console.error('❌ Upload process failed:', error);
    return null;
  }
}

// 이미지 생성 API 호출 (기존과 동일)
export async function generateImages(
  userId: string,
  imageKeys: string[],
  keyword?: string
): Promise<GenerateResponse | null> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        input_image_keys: imageKeys,
        keyword: keyword,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as GenerateResponse;
    return data;
  } catch (error) {
    console.error('Generate images error:', error);
    return null;
  }
}

// 사용자의 모든 이미지 조회 (기존과 동일)
export async function getUserImages(userId: string): Promise<UserImagesResponse | null> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/v1/images/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : 'Content-Type',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as UserImagesResponse;
    return data;
  } catch (error) {
    console.error('Get user images error:', error);
    return null;
  }
}