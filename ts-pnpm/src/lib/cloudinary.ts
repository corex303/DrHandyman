import { v2 as cloudinary } from 'cloudinary';

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  throw new Error('Missing CLOUDINARY_CLOUD_NAME in .env.local');
}
if (!process.env.CLOUDINARY_API_KEY) {
  throw new Error('Missing CLOUDINARY_API_KEY in .env.local');
}
if (!process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Missing CLOUDINARY_API_SECRET in .env.local');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Ensures URLs are HTTPS
});

export interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  pages: number;
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  access_mode: string;
  original_filename: string;
}

/**
 * Uploads an image file to Cloudinary.
 * @param file The file to upload (e.g., from a form input, or a base64 string).
 * @param options Optional Cloudinary upload options.
 * @returns Promise<CloudinaryUploadResult>
 */
export const uploadImageToCloudinary = async (
  file: string | Buffer, // Can be a file path, base64 string, or Buffer
  options?: object
): Promise<CloudinaryUploadResult> => {
  try {
    const result = await cloudinary.uploader.upload(file as string, {
      folder: 'dr_handyman', // Optional: specify a folder in Cloudinary
      // You can add more default options here, like transformations
      ...options,
    });
    return result as unknown as CloudinaryUploadResult;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Deletes an image from Cloudinary by its public_id.
 * @param publicId The public_id of the image to delete.
 * @returns Promise<any>
 */
export const deleteImageFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

export default cloudinary; 