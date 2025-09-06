interface PresignResponse {
  url: string;
  fields?: Record<string, string>;
  key: string;
  expires?: string;
}

export async function uploadToS3(
  file: File,
  presignData: PresignResponse,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200 || xhr.status === 204) {
        // For PUT requests, the file URL is typically the presigned URL without query params
        const fileUrl = presignData.url.split('?')[0];
        resolve(fileUrl);
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    // Check if it's a PUT request (single URL) or POST request (with form fields)
    if (presignData.fields) {
      // POST request with form data
      const formData = new FormData();
      
      // Add all the fields from presign response
      Object.entries(presignData.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Add the file last
      formData.append('file', file);

      xhr.open('POST', presignData.url);
      xhr.send(formData);
    } else {
      // PUT request
      xhr.open('PUT', presignData.url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    }
  });
}

export function generateS3Key(prefix: string, filename: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = filename.split('.').pop();
  return `${prefix}/${timestamp}-${randomString}.${extension}`;
}