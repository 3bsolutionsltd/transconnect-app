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
    // Check if this is demo mode (URL starts with DEMO_MODE:)
    if (url.startsWith('DEMO_MODE:')) {
      console.log('📄 [DEMO MODE] Simulating file upload:', file.name);
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          onProgress(100);
          console.log('✅ [DEMO MODE] Upload simulation completed');
          resolve();
        } else {
          onProgress(Math.floor(progress));
        }
      }, 100);
      
      return;
    }
    
    // Real upload for production
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