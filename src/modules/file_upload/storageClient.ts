import crypto from 'crypto';
import configs from '../../configs/configs';
import getSupabaseClient from '../../libs/supabase';

export const uploadFileToStorage = async (
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<string> => {
  const supabase = getSupabaseClient();
  const fileExt = originalName.split('.').pop() || 'jpg';
  const randomFileName = `${crypto.randomUUID()}.${fileExt}`;
  const storageKey = `evidence/${randomFileName}`;

  if (!configs.supabase.url || !configs.supabase.serviceRoleKey) {
    console.warn('⚠️ Supabase credentials missing; simulating file upload with generated key:', storageKey);
    return storageKey;
  }

  const { error } = await supabase.storage
    .from(configs.supabase.bucket)
    .upload(storageKey, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload media evidence to storage: ${error.message}`);
  }

  return storageKey;
};

export const createSignedUrl = async (
  storageKey: string,
  expiresInSeconds = 3600
): Promise<string> => {
  if (!configs.supabase.url || !configs.supabase.serviceRoleKey) {
    return `https://placeholder-storage.campusguard.local/${storageKey}`;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(configs.supabase.bucket)
    .createSignedUrl(storageKey, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error('Error generating signed URL:', error);
    return `https://placeholder-storage.campusguard.local/${storageKey}`;
  }

  return data.signedUrl;
};
