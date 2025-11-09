export const extractFrameFromVideo = (videoFile: File, timeInSeconds?: number): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return reject(new Error('Could not get 2D context from canvas.'));
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // Seek to middle frame if no specific time is provided
      video.currentTime = timeInSeconds === undefined ? video.duration / 2 : Math.min(timeInSeconds, video.duration);
    };

    video.onseeked = () => {
      // Add a small delay to ensure the frame is painted
      setTimeout(() => {
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0); // Use JPEG for best quality
        URL.revokeObjectURL(video.src); // Clean up object URL
        resolve(dataUrl);
      }, 100); // 100ms delay, adjust if needed
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(video.src);
      console.error("Video error:", e);
      let errorMessage = "Error loading video.";
      if (video.error) {
        switch (video.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Video playback aborted.";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "A network error caused video download to fail.";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Video playback aborted due to a corruption problem or because the video used features your browser did not support.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "The video could not be loaded, either because the server or network failed or because the format is not supported.";
            break;
          default:
            errorMessage = "An unknown video error occurred.";
        }
      }
      reject(new Error(errorMessage));
    };
    
    video.src = URL.createObjectURL(videoFile);
    video.load(); // Important to trigger loading
  });
};

export const sanitizeFilename = (name: string, originalExtension: string): string => {
  // Remove or replace invalid characters for filenames
  let sanitized = name
    .replace(/#/g, '') // Remove hashtags as they aren't ideal for filenames
    .replace(/[\\/?%*:|"<>\r\n]/g, '-') // Replace invalid filesystem characters
    .replace(/\s\s+/g, ' ') // Collapse multiple spaces to a single space
    .trim(); // Remove leading/trailing whitespace

  // Ensure it's not empty and doesn't exceed a reasonable length
  if (!sanitized) {
    sanitized = 'untitled video';
  }
  sanitized = sanitized.substring(0, 100); // Max length for filename part
  sanitized = sanitized.trim(); // Trim again after substring

  // Ensure it has the original extension
  const ext = originalExtension.startsWith('.') ? originalExtension : `.${originalExtension}`;
  if (!sanitized.toLowerCase().endsWith(ext.toLowerCase())) {
     // Remove any existing extension if it's different, then add correct one
    const lastDot = sanitized.lastIndexOf('.');
    if (lastDot > 0 && sanitized.substring(lastDot).length <= 5) { // Simple check for existing extension
        sanitized = sanitized.substring(0, lastDot);
    }
    sanitized += ext;
  }
  
  return sanitized;
};