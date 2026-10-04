import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import configs from '../../configs/configs';
import getSupabaseClient from '../../libs/supabase';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const ensureUploadDir = (subDir: string) => {
  const dir = path.join(UPLOADS_DIR, subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

export const uploadFileToStorage = async (
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<string> => {
  const fileExt = originalName.split('.').pop() || 'jpg';
  const randomFileName = `${crypto.randomUUID()}.${fileExt}`;
  const storageKey = `evidence/${randomFileName}`;

  // 1. Try uploading to Supabase if configured
  if (configs.supabase.url && configs.supabase.serviceRoleKey) {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.storage
        .from(configs.supabase.bucket)
        .upload(storageKey, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (!error) {
        return storageKey;
      }
      console.warn(
        `⚠️ [Storage] Supabase upload warning: ${error.message}. Falling back to resilient local storage.`
      );
    } catch (err: any) {
      console.warn(
        `⚠️ [Storage] Supabase network upload failed (${err?.message || err}). Falling back to resilient local storage.`
      );
    }
  } else {
    console.warn('⚠️ [Storage] Supabase credentials not set; persisting evidence to local storage.');
  }

  // 2. Resilient Fallback: Persist evidence file directly to server disk
  try {
    ensureUploadDir('evidence');
    const localFilePath = path.join(UPLOADS_DIR, 'evidence', randomFileName);
    await fs.promises.writeFile(localFilePath, fileBuffer);
    console.log(`💾 [Storage] Stored evidence file locally: uploads/evidence/${randomFileName}`);
    return storageKey;
  } catch (fsErr: any) {
    console.error('❌ [Storage] Local filesystem write failed:', fsErr);
    throw new Error(`Failed to save evidence file: ${fsErr?.message || 'Local filesystem error'}`);
  }
};

export const createSignedUrl = async (
  storageKey: string,
  expiresInSeconds = 3600
): Promise<string> => {
  const localFilePath = path.join(UPLOADS_DIR, storageKey);
  const host = '192.168.1.102'; // Local network IP reachable by mobile devices
  const localUrl = `http://${host}:${configs.port}/uploads/${storageKey}`;

  // If file exists on local server disk
  if (fs.existsSync(localFilePath)) {
    return localUrl;
  }

  // If stored in Supabase
  if (configs.supabase.url && configs.supabase.serviceRoleKey) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.storage
        .from(configs.supabase.bucket)
        .createSignedUrl(storageKey, expiresInSeconds);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (err: any) {
      console.warn(`⚠️ [Storage] Supabase createSignedUrl error: ${err?.message || err}`);
    }
  }

  return localUrl;
};
