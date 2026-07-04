import { supabaseAdmin } from '../config/supabase.js';

/**
 * Upload file buffer to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} mimeType - File mime type
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export const uploadToSupabaseStorage = async (fileBuffer, fileName, mimeType) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized for storage uploads');
  }

  const bucketName = 'civic-reports';

  // Defensively try to create bucket if it doesn't exist
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some(b => b.name === bucketName);
    
    if (!exists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      if (createError) console.error('Failed to auto-create bucket, will attempt upload anyway:', createError.message);
    }
  } catch (err) {
    console.warn('Storage bucket check/create failed:', err.message);
  }

  // Generate a unique filename using timestamp
  const uniqueName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(uniqueName, fileBuffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  // Retrieve public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(uniqueName);

  return publicUrl;
};

/**
 * Extracts the filename/path of an image from its public Supabase URL
 */
export const getStoragePathFromUrl = (url, bucketName = 'avatars') => {
  if (!url) return null;
  const parts = url.split(`/storage/v1/object/public/${bucketName}/`);
  if (parts.length === 2) {
    return parts[1];
  }
  return null;
};

/**
 * Upload profile avatar to Supabase storage, creating the avatars bucket if it doesn't exist,
 * and deleting any previous avatar file to avoid orphans.
 */
export const uploadAvatarToStorage = async (userId, fileBuffer, fileName, mimeType, currentAvatarUrl = null) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized for storage uploads');
  }

  const bucketName = 'avatars';

  // Create bucket if it doesn't exist
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some(b => b.name === bucketName);
    if (!exists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      });
      if (createError) console.error('Failed to auto-create avatars bucket:', createError.message);
    }
  } catch (err) {
    console.warn('Avatars bucket check failed:', err.message);
  }

  // Delete old avatar if it exists in the storage bucket
  if (currentAvatarUrl) {
    const oldPath = getStoragePathFromUrl(currentAvatarUrl, bucketName);
    if (oldPath) {
      try {
        await supabaseAdmin.storage.from(bucketName).remove([oldPath]);
      } catch (err) {
        console.warn('Failed to delete old avatar:', err.message);
      }
    }
  }

  // Save the new file under user id folder to organize storage
  const uniqueName = `${userId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(uniqueName, fileBuffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(uniqueName);

  return publicUrl;
};
