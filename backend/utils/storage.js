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
