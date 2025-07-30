import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 프론트엔드에서 Supabase Storage에 직접 업로드
 * 백엔드 개발자 제안: presigned URL 없이 SDK로 직접 업로드
 */
export async function uploadImageDirect(file: File, userId: string) {
  try {
    console.log('🚀 Direct upload to Supabase Storage');
    console.log('File:', file.name, `(${(file.size / 1024).toFixed(1)}KB)`);
    console.log('User ID:', userId);

    // 고유한 파일명 생성
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${userId}/${fileName}`;

    console.log('Upload path:', filePath);

    // ✅ SDK를 통한 직접 업로드 (백엔드 개발자 제안 방식)
    const { data, error } = await supabase.storage
      .from('layerminder') // 버킷 이름
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('✅ Upload successful:', data);

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('layerminder')
      .getPublicUrl(filePath);

    const result = {
      fileKey: filePath,
      publicUrl: urlData.publicUrl,
      uploadMethod: 'direct_supabase_sdk'
    };

    console.log('✅ Upload result:', result);
    return result;

  } catch (error) {
    console.error('❌ Direct upload failed:', error);
    return null;
  }
}

// 파일 삭제 (기존 유지)
export async function deleteImage(fileKey: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('layerminder')
      .remove([fileKey]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

// 유틸리티 함수들 (기존 유지)
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Storage URL 헬퍼 함수
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from('layerminder')
    .getPublicUrl(path);
  
  return data.publicUrl;
}