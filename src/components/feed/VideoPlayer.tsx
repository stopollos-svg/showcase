import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, Maximize2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  caption?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // IntersectionObserver for autoplay muted when in view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            videoRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => {
                // Autoplay may be restricted by browser until user interaction
                setIsPlaying(false);
              });
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0.5] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(current);
    setProgress((current / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    videoRef.current.currentTime = pct * (videoRef.current.duration || 0);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onClick={togglePlay}
      className="relative w-full aspect-[4/5] bg-stone-950 overflow-hidden cursor-pointer group rounded-xl"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={isMuted}
        playsInline
        loop
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full object-cover"
      />

      {/* Center play state indicator on pause */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] transition-opacity">
          <div className="w-14 h-14 rounded-full bg-stone-900/80 text-white flex items-center justify-center shadow-xl border border-white/20">
            <Play className="w-6 h-6 ml-1 fill-white" />
          </div>
        </div>
      )}

      {/* Floating control buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <button
          onClick={toggleMute}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-orange-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom video timeline & progress */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          onClick={handleSeek}
          className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer relative group-hover:h-2 transition-all"
        >
          <div
            className="h-full bg-orange-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-white/80 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span className="text-[10px] text-white/60">Tap video to pause</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
