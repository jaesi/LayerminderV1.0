import { 
  ImageMetadataResponse, 
  GenerateResponse, 
  GenerateRequest,
  ImageMetadataRequest 
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

    // 메타데이터 요청 데이터 생성
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

    // 2단계: 백엔드에 메타데이터 저장 (새 API 스펙 사용)
    const metadataResult = await saveImageMetadata(
      uploadResult.fileKey,
      type
    );

    // 백엔드에서 받은 image_id 사용, 실패시 fallback
    const imageId = metadataResult?.image_id || `direct_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    // 백엔드에서 받은 public URL 사용, 실패시 기존 URL 사용
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

/**
 * AI 이미지 생성
 */
export async function generateImages(
  imageKeys: string[],  
  keyword?: string
): Promise<GenerateResponse | null> {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.warn('No auth token available for generate API');
      return null;
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // 새로운 백엔드 스펙에 맞는 요청 데이터
    const requestData: GenerateRequest = {
      input_image_keys: imageKeys,
      keyword: keyword,
    };

    console.log('🎨 Calling generate API with new spec:', requestData);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers,
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
    console.log('✅ Generate API successful:', data);
    return data;
  } catch (error) {
    console.error('Generate images error:', error);
    return null;
  }
}

/**
 * 생성된 이미지들의 메타데이터를 백엔드에 자동 등록
 */
export async function registerGeneratedImageMetadata(
  imageKeys: string[]
): Promise<ImageMetadataResponse[]> {
  const results: ImageMetadataResponse[] = [];
  
  for (const imageKey of imageKeys) {
    try {
      const result = await saveImageMetadata(imageKey, "generated");
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(`Failed to register metadata for ${imageKey}:`, error);
    }
  }
  
  return results;
}

// // 사용자 이미지 조회 (기존 유지)
// export async function getUserImages(userId: string): Promise<UserImagesResponse | null> {
//   try {
//     const token = await getAuthToken();
    
//     const headers: Record<string, string> = {
//       'Content-Type': 'application/json',
//     };

//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`;
//     }
    
//     const response = await fetch(`${API_BASE_URL}/api/v1/images/user/${userId}`, {
//       method: 'GET',
//       headers,
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json() as UserImagesResponse;
//     return data;
//   } catch (error) {
//     console.error('Get user images error:', error);
//     return null;
//   }
// }