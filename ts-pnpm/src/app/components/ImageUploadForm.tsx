'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';

interface ImageUploadFormProps {
  onUploadSuccess?: (data: any) => void;
  onUploadError?: (error: any) => void;
  maxFileSizeMB?: number;
}

const DEFAULT_MAX_FILE_SIZE_MB = 5;

const ImageUploadForm: React.FC<ImageUploadFormProps> = ({
  onUploadSuccess,
  onUploadError,
  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setUploadMessage(null);
    setErrorMessage(null);

    if (selectedFile) {
      if (selectedFile.size > maxFileSizeBytes) {
        setErrorMessage(
          `File is too large. Maximum size is ${maxFileSizeMB}MB.`
        );
        setFile(null);
        setPreviewUrl(null);
        event.target.value = ''; // Clear the input
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setErrorMessage(
        `File is too large. Maximum size is ${maxFileSizeMB}MB. Please select a smaller file.`
      );
      return;
    }

    setIsUploading(true);
    setUploadMessage('Uploading image...');
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', altText);
    formData.append('description', description);
    // TODO: Add uploaderId if needed, e.g., from user session
    // formData.append('uploaderId', currentUserId);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Upload failed');
      }

      setUploadMessage('Image uploaded successfully!');
      console.log('Upload successful:', data);
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
      // Reset form fully on success
      setFile(null);
      setPreviewUrl(null);
      setAltText('');
      setDescription('');
      // Clear the file input visually by resetting its value if possible (requires a ref or other method)
      // For simplicity, we rely on setting file to null which disables submit button.
      // A more robust clear might involve resetting the form element itself.
      const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMessage(error.message || 'An unexpected error occurred.');
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg shadow-md">
      <div>
        <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700">
          Image File
        </label>
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
          "
          disabled={isUploading}
        />
        {errorMessage && file?.size && file.size > maxFileSizeBytes && (
          <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
        )}
      </div>

      {previewUrl && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">Preview:</p>
          <img src={previewUrl} alt="Image preview" className="mt-1 max-h-48 rounded border" />
        </div>
      )}

      <div>
        <label htmlFor="altText" className="block text-sm font-medium text-gray-700">
          Alt Text (for accessibility)
        </label>
        <input
          id="altText"
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., A handyman fixing a leaky faucet"
          disabled={isUploading}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., Before and after shot of a kitchen remodel in Raleigh"
          disabled={isUploading}
        />
      </div>

      <button
        type="submit"
        disabled={isUploading || !file}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading...' : 'Upload Image'}
      </button>

      {uploadMessage && (
        <p className="mt-2 text-sm text-green-600">{uploadMessage}</p>
      )}
      {errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </form>
  );
};

export default ImageUploadForm; 