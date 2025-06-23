import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 이미지 업로드 함수
export async function uploadImage(file: File, userId: string): Promise<{
  fileKey: string;
  publicUrl: string;
} | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('layerminder')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('layerminder')
      .getPublicUrl(filePath);

    return {
      fileKey: filePath,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload error:', error);
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