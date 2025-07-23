import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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