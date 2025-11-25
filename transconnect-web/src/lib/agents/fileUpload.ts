/**
 * Simple file upload helper using XHR to report progress.
 * Uploads file to presigned URL with progress tracking.
 */
export default function uploadToPresigned(
  url: string, 
  file: File, 
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('PUT', url);
    
    // Track upload progress
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };
    
    // Handle success
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    
    // Handle errors
    xhr.onerror = () => reject(new Error('Upload failed due to network error'));
    xhr.onabort = () => reject(new Error('Upload was aborted'));
    
    // Set content type
    xhr.setRequestHeader('Content-Type', file.type);
    
    // Send the file
    xhr.send(file);
  });
}

/**
 * Alternative fetch-based upload (no progress tracking)
 */
export async function uploadToPresignedFetch(url: string, file: File): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
}