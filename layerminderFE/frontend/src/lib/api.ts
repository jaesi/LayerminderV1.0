import { ImageMetadataResponse, ImageMetadata, UserImagesResponse, GenerateResponse } from '@/types';

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

/**
 * 이미지 메타데이터 저장 
 * 프론트엔드 supabase 직접 업로드 후 메타데이터만 백엔드에 저장
 */
export async function saveImageMetadata(
  fileKey: string,  
  type: string = 'input',
  meta?: ImageMetadata
): Promise<ImageMetadataResponse | null> {
  try {
    // 사용자 ID 가져오기
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

    const token = await getAuthToken();
    if (!token) {
      console.warn('No auth token - attempting without authentication');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 백엔드 스키마에 맞는 요청 데이터 구성
    const requestData = {
      user_id: userId,      
      image_key: fileKey,   
      meta: meta || {},   
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
 * 통합 업로드 함수 (수정됨)
 */
export async function uploadImageWithMetadata(
  file: File,
  type: string = 'input',
  meta?: ImageMetadata
): Promise<{ imageId: string; publicUrl: string; fileKey: string } | null> {
  try {
    console.log('🚀 Starting direct upload process for:', file.name);

    // 사용자 ID 가져오기
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

    // 1단계: 프론트엔드에서 직접 Supabase Storage에 업로드
    const { uploadImageDirect : uploadDirect } = await import('@/lib/supabase');
    const uploadResult = await uploadDirect(file, userId);
    
    if (!uploadResult) {
      throw new Error('Direct upload failed');
    }

    console.log('✅ File uploaded directly to Supabase:', uploadResult);

    // 2단계: 백엔드에 메타데이터 저장 (수정된 함수 사용)
    const metadataResult = await saveImageMetadata(
      uploadResult.fileKey,   
      type,
      {
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        ...meta
      }
    );

    const imageId = metadataResult?.image_id || `direct_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log('✅ Upload with metadata process completed');

    return {
      imageId,
      publicUrl: uploadResult.publicUrl,
      fileKey: uploadResult.fileKey
    };

  } catch (error) {
    console.error('❌ Upload with metadata process failed:', error);
    return null;
  }
}

/**
 * 통합 업로드 함수 (직접 업로드 + 메타데이터 저장)
 * 백엔드 개발자 제안: SDK 직접 업로드 방식
 */
export async function uploadImageDirect(
  file: File,
  type: string = 'input',
  meta?: ImageMetadata
): Promise<{ imageId: string; publicUrl: string; fileKey: string } | null> {
  try {
    console.log('🚀 Starting direct upload process for:', file.name);

    // 사용자 ID 가져오기
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

    // 1단계: 프론트엔드에서 직접 Supabase Storage에 업로드
    const { uploadImageDirect: uploadDirect } = await import('@/lib/supabase');
    const uploadResult = await uploadDirect(file, userId);
    
    if (!uploadResult) {
      throw new Error('Direct upload failed');
    }

    console.log('✅ File uploaded directly to Supabase');

    // 2단계: 백엔드에 메타데이터 저장
    const metadataResult = await saveImageMetadata(
      uploadResult.publicUrl,
      type,
      {
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        ...meta
      }
    );

    const imageId = metadataResult?.image_id || `direct_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log('✅ Direct upload process completed');

    return {
      imageId,
      publicUrl: uploadResult.publicUrl,
      fileKey: uploadResult.fileKey
    };

  } catch (error) {
    console.error('❌ Direct upload process failed:', error);
    return null;
  }
}

// // 이미지 생성 API 호출
// export async function generateImages(
//   userId: string,
//   imageKeys: string[],
//   keyword?: string
// ): Promise<GenerateResponse | null> {
//   try {
//     const token = await getAuthToken();
    
//     const headers: Record<string, string> = {
//       'Content-Type': 'application/json',
//     };

//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`;
//     }
    
//     const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify({
//         user_id: userId,
//         input_image_keys: imageKeys,
//         keyword: keyword,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json() as GenerateResponse;
//     return data;
//   } catch (error) {
//     console.error('Generate images error:', error);
//     return null;
//   }
// }

// generateImages 함수는 백엔드 구현 대기 중이므로 mock 처리
export async function generateImages(
  userId: string,
  imageKeys: string[],
  keyword?: string
): Promise<GenerateResponse> {
  console.log('🎨 Generate API called (using mock data):', { userId, imageKeys, keyword });
  
  // Mock 데이터 반환
  const { dummyGeneratedImages } = await import('@/data/dummyData');
  const mockGeneratedImages = dummyGeneratedImages.slice(0, 4).map((src, index) => ({
    image_id: `mock_${Date.now()}_${index}`,
    url: src
  }));
  
  return {
    success: true,
    generated_images: mockGeneratedImages,
    metadata: {
      keyword: keyword,
      input_images: imageKeys
    }
  };
}

// 사용자 이미지 조회 (기존 유지)
export async function getUserImages(userId: string): Promise<UserImagesResponse | null> {
  try {
    const token = await getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/images/user/${userId}`, {
      method: 'GET',
      headers,
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