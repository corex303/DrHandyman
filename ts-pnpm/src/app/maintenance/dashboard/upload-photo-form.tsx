"use client";

import { type FormEvent,useState } from 'react';

export default function UploadPhotoForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setFile(files[0]);
      setError(null);
      setSuccessUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessUrl(null);

    try {
      const response = await fetch(
        `/api/maintenance-photos/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          body: file,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }

      const blob = await response.json();
      setSuccessUrl(blob.url);
      setFile(null); // Clear the file input
      // Clear the actual file input element visually
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Upload Maintenance Photo</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="photo-upload" className="block text-sm font-medium text-gray-700 mb-1">
            Photo
          </label>
          <input
            id="photo-upload"
            name="photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100
                       disabled:opacity-50"
            disabled={isUploading}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            <p>Error: {error}</p>
          </div>
        )}

        {successUrl && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            <p>Upload successful!</p>
            <a
              href={successUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              View Uploaded Photo: {successUrl.substring(successUrl.lastIndexOf('/') + 1)}
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !file}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm
                     disabled:bg-gray-400 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isUploading ? "Uploading..." : "Upload Photo"}
        </button>
      </form>
    </div>
  );
} 