import api from './api';
import { Attachment } from '../types';
import { supabase } from './supabase';

const STORAGE_BUCKET = 'minebrief-attachments';

const fileCategory = (extension: string): Attachment['file_type'] => {
  if (extension === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) return 'image';
  return 'audio';
};

const mimeTypeFor = (file: File, extension: string): string => {
  if (file.type) return file.type;
  const knownTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
  };
  return knownTypes[extension] || 'application/octet-stream';
};

export const uploadService = {
  uploadFile: async (file: File, reportId?: number): Promise<Attachment> => {
    const isDemo = window.localStorage.getItem('minebrief_demo') === 'true';
    if (!isDemo && supabase) {
      if (reportId === undefined) {
        throw new Error('Select or create a report before uploading an attachment.');
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error('Sign in before uploading attachments.');

      const profileResponse = await api.get<{ workspace_id: number }>('/auth/profile');
      const workspaceId = profileResponse.data.workspace_id;
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const mimeType = mimeTypeFor(file, extension);
      if (!workspaceId) throw new Error('Your account has no active workspace.');
      if (file.size > 20 * 1024 * 1024) throw new Error('Attachments must be 20 MB or smaller.');

      const storagePath = [
        workspaceId,
        sessionData.session.user.id,
        reportId,
        `${crypto.randomUUID()}.${extension}`,
      ].join('/');
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, { contentType: mimeType, upsert: false });
      if (storageError) throw storageError;

      try {
        const response = await api.post<Attachment>('/uploads', {
          report_id: reportId,
          storage_path: storagePath,
          original_name: file.name,
          file_type: fileCategory(extension),
          file_size: file.size,
          mime_type: mimeType,
        });
        return response.data;
      } catch (error) {
        const { error: cleanupError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);
        if (cleanupError) {
          throw new Error(
            `Attachment metadata could not be saved and the uploaded object could not be removed: ${cleanupError.message}`
          );
        }
        throw error;
      }
    }

    const formData = new FormData();
    formData.append('file', file);
    if (reportId !== undefined) {
      formData.append('report_id', String(reportId));
    }

    const response = await api.post<Attachment>('/uploads', formData);
    return response.data;
  },

  getAttachmentUrl: async (attachmentId: number): Promise<string> => {
    const response = await api.get<{ url: string }>(`/uploads/${attachmentId}/url`);
    if (response.data.url.startsWith('/api/uploads/')) {
      const localFilePath = response.data.url.replace(/^\/api/, '');
      const fileResponse = await api.get<Blob>(localFilePath, { responseType: 'blob' });
      return URL.createObjectURL(fileResponse.data);
    }
    return response.data.url;
  },
};

export default uploadService;
