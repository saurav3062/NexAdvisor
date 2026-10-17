import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Generate UUID without external dependency
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface UploadResult {
  url: string;
  path: string;
  fileName: string;
}

async function uploadFile(
  bucket: string,
  file: File,
  folder?: string
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${generateUUID()}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
    fileName: file.name,
  };
}

async function uploadMessageAttachment(file: File): Promise<UploadResult> {
  return uploadFile('messages', file, 'attachments');
}

async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  return uploadFile('avatars', file, userId);
}

async function uploadDocument(file: File, userId: string): Promise<UploadResult> {
  return uploadFile('documents', file, userId);
}

export function useUploadFile(bucket: string) {
  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder?: string }) =>
      uploadFile(bucket, file, folder),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload file');
    },
  });
}

export function useUploadMessageAttachment() {
  return useMutation({
    mutationFn: uploadMessageAttachment,
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload file');
    },
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: ({ file, userId }: { file: File; userId: string }) =>
      uploadAvatar(file, userId),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload avatar');
    },
  });
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: ({ file, userId }: { file: File; userId: string }) =>
      uploadDocument(file, userId),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload document');
    },
  });
}

// Delete file helper
async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export function useDeleteFile(bucket: string) {
  return useMutation({
    mutationFn: (path: string) => deleteFile(bucket, path),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete file');
    },
  });
}
