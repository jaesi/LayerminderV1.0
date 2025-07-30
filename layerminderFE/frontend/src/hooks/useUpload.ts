// hooks/useUpload.ts
import { useState, useCallback } from 'react';

// 업로드 결과 타입 정의
export interface UploadResult {
  imageId: string;
  publicUrl: string;
  fileKey: string;
  file: File;
}

export interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  currentFile?: string;
  error?: string;
}

export interface UseUploadOptions {
  maxFiles?: number;
  onSuccess?: (results: UploadResult[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number, currentFile?: string) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const {
    maxFiles = 2,
    onSuccess,
    onError,
    onProgress
  } = options;

  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  });

  const updateProgress = useCallback((progress: number, currentFile?: string) => {
    setState(prev => ({ ...prev, progress, currentFile }));
    onProgress?.(progress, currentFile);
  }, [onProgress]);

  const setError = useCallback((error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error;
    setState(prev => ({ 
      ...prev, 
      status: 'error', 
      error: errorMessage,
      progress: 0 
    }));
    
    if (error instanceof Error) {
      onError?.(error);
    } else {
      onError?.(new Error(errorMessage));
    }
  }, [onError]);

  const setSuccess = useCallback((results: UploadResult[]) => {
    setState(prev => ({ 
      ...prev, 
      status: 'success', 
      progress: 100,
      error: undefined
    }));
    onSuccess?.(results);
  }, [onSuccess]);

  const startUpload = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      status: 'uploading', 
      progress: 0,
      error: undefined
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      progress: 0,
      error: undefined,
      currentFile: undefined
    });
  }, []);

  return {
    ...state,
    maxFiles,
    startUpload,
    updateProgress,
    setError,
    setSuccess,
    reset,
    isUploading: state.status === 'uploading'
  };
}