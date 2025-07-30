import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ 이 방식이 작동합니다 (백엔드 개발자 제안)
export async function uploadImageDirect(file: File, userId: string) {
  try {
    console.log('=== Direct Upload to Supabase ===');
    console.log('File:', file.name, file.size, file.type);
    console.log('User ID:', userId);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${userId}/${fileName}`;

    console.log('Upload path:', filePath);

    // 🔥 핵심: 프론트엔드에서 직접 Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('layerminder') // 버킷 이름 확인 필요
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('=== Supabase Direct Upload Error ===');
      console.error('Error:', error);
      return null;
    }

    console.log('✅ Direct upload successful:', data);

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('layerminder')
      .getPublicUrl(filePath);

    return {
      fileKey: filePath,
      publicUrl: urlData.publicUrl,
      uploadMethod: 'direct_supabase'
    };

  } catch (error) {
    console.error('=== Direct Upload Error ===');
    console.error('Error:', error);
    return null;
  }
}

// 이미지 삭제 함수
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

// 유틸리티 함수들
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

// 파일 존재 여부 확인
export async function fileExists(path: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from('layerminder')
      .list(path.substring(0, path.lastIndexOf('/')), {
        search: path.substring(path.lastIndexOf('/') + 1)
      });

    return !error && data && data.length > 0;
  } catch (error) {
    console.error('File exists check error:', error);
    return false;
  }
}