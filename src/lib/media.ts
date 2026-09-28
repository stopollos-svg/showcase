/**
 * Client-side media processing, validation, and compression utilities
 * - Image compression via Canvas (max 5 MB)
 * - Video validation (max 60 seconds, max 50 MB) + poster thumbnail capture
 * - Audio validation (max 10 min / 600s, max 20 MB) + duration probe
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  duration?: number;
  thumbnailUrl?: string;
}

export const MEDIA_LIMITS = {
  IMAGE_MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  VIDEO_MAX_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  VIDEO_MAX_DURATION_SEC: 60, // 60 seconds
  AUDIO_MAX_SIZE_BYTES: 20 * 1024 * 1024, // 20 MB
  AUDIO_MAX_DURATION_SEC: 600, // 10 minutes
};

/**
 * Compress an image file using an offscreen canvas
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<{ compressedBlob: Blob; dataUrl: string; sizeReductionPercent: number }> {
  if (file.size > MEDIA_LIMITS.IMAGE_MAX_SIZE_BYTES) {
    throw new Error(`Image size exceeds maximum limit of 5 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image data.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to create canvas context.'));
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp with fallback to jpeg
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Image compression failed.'));
            }
            const dataUrl = canvas.toDataURL('image/webp', quality);
            const reduction = Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100));
            resolve({
              compressedBlob: blob,
              dataUrl,
              sizeReductionPercent: reduction,
            });
          },
          'image/webp',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validate video file size, duration, and generate thumbnail
 */
export async function validateAndProcessVideo(file: File): Promise<ValidationResult> {
  if (file.size > MEDIA_LIMITS.VIDEO_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Video size exceeds 50 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = Math.round(video.duration);

      if (duration > MEDIA_LIMITS.VIDEO_MAX_DURATION_SEC) {
        resolve({
          valid: false,
          error: `Video duration is ${duration}s, which exceeds the 60-second limit.`,
          duration,
        });
        return;
      }

      // Generate poster thumbnail at 1s or 0s
      video.currentTime = Math.min(1, Math.max(0, duration / 2));
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve({
            valid: true,
            duration: Math.round(video.duration),
            thumbnailUrl,
          });
          return;
        }
      } catch (e) {
        // Ignored, fallback to valid without thumbnail
      }
      resolve({
        valid: true,
        duration: Math.round(video.duration),
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'Unable to parse video file. Supported formats: MP4, WebM, QuickTime.',
      });
    };

    video.src = url;
  });
}

/**
 * Validate audio file size and duration
 */
export async function validateAndProcessAudio(file: File): Promise<ValidationResult> {
  if (file.size > MEDIA_LIMITS.AUDIO_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Audio size exceeds 20 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const url = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = Math.round(audio.duration);
      if (duration > MEDIA_LIMITS.AUDIO_MAX_DURATION_SEC) {
        resolve({
          valid: false,
          error: `Audio duration is ${Math.round(duration / 60)} minutes, which exceeds the 10-minute limit.`,
          duration,
        });
        return;
      }

      resolve({
        valid: true,
        duration,
      });
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'Unable to parse audio file. Supported formats: MP3, AAC, OGG, WAV.',
      });
    };

    audio.src = url;
  });
}

/**
 * Generate a synthetic audio chime/tone Data URL for instant test playback
 */
export function generateSyntheticAudioDataUrl(): string {
  // 3-second gentle melodic chord chime for demo playback
  const sampleRate = 22050;
  const duration = 2.5;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Int16Array(numSamples);

  const notes = [261.63, 329.63, 392.0, 523.25]; // C major chord

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    // Envelope: quick attack, smooth exponential decay
    const envelope = Math.exp(-t * 2.2);

    for (let n = 0; n < notes.length; n++) {
      sample += Math.sin(2 * Math.PI * notes[n] * t) * (0.2 / notes.length);
    }
    buffer[i] = Math.floor(sample * envelope * 32767);
  }

  // Build WAV header
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  const wavBlob = new Blob([view, buffer], { type: 'audio/wav' });
  return URL.createObjectURL(wavBlob);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
