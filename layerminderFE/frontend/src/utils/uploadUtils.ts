export function validateFileForUpload(file: File): { valid: boolean; error?: string } {
  // 파일 크기 제한 (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `파일 크기가 너무 큽니다. (최대 10MB, 현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)` 
    };
  }
  
  // 파일 타입 검증
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `지원하지 않는 파일 형식입니다. (지원: JPG, PNG, WebP)` 
    };
  }
  
  // 파일명 검증
  if (file.name.length > 100) {
    return { 
      valid: false, 
      error: '파일명이 너무 깁니다. (최대 100자)' 
    };
  }
  
  return { valid: true };
}