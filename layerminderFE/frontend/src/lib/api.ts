import { ImageMetadataResponse, GenerateResponse, ImageMetadata, UserImagesResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

// 이미지 메타데이터 저장
export async function saveImageMetadata(
  userId: string,
  fileKey: string,
  type: string = 'user_upload',
  meta?: ImageMetadata
): Promise<ImageMetadataResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/images/metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        file_key: fileKey,
        image_key: fileKey,
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

// 이미지 생성 API 호출
export async function generateImages(
  userId: string,
  imageKeys: string[],
  keyword?: string
): Promise<GenerateResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
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

// 사용자의 모든 이미지 조회 (Gallery용)
export async function getUserImages(userId: string): Promise<UserImagesResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/images/user/${userId}`, {
      method: 'GET',
      headers: {
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