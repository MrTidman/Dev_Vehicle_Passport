import { supabase } from './supabase';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const BUCKET_NAME = 'vehicle-files';

/**
 * Upload a file to Supabase Storage
 * Path format: ${carId}/${userId}/${file.name}
 * 
 * @param file - The file to upload
 * @param carId - The car ID
 * @param userId - The user ID
 * @returns The public URL of the uploaded file
 */
export async function uploadVehicleFile(
  file: File,
  carId: string,
  userId: string
): Promise<string> {
  // Validate file size
  if (file.size > MAX_SIZE) {
    throw new Error(`File size exceeds 10MB limit: ${file.name}`);
  }

  // Sanitize filename to prevent path traversal
  const sanitizedFileName = file.name.replace(/(\.\.(\/|\\)|\/|\\)/g, '_');
  const filePath = `${carId}/${userId}/${sanitizedFileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Upload multiple files to Supabase Storage
 * 
 * @param files - Array of files to upload
 * @param carId - The car ID
 * @param userId - The user ID
 * @returns Array of public URLs for uploaded files
 */
export async function uploadVehicleFiles(
  files: File[],
  carId: string,
  userId: string
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const url = await uploadVehicleFile(file, carId, userId);
    uploadedUrls.push(url);
  }

  return uploadedUrls;
}

/**
 * Delete a file from Supabase Storage
 * 
 * @param filePath - The path of the file to delete
 */
export async function deleteVehicleFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}