import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Gauge,
  Scaling,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  caption?: string;
  autoPlayInView?: boolean;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  caption,
  autoPlayInView = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRateIndex, setPlaybackRateIndex] = useState(1); // default 1x
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('contain');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeSrc, setActiveSrc] = useState(src);

  const hideControlsTimeoutRef = useRef<any>(null);

  // Sync src prop changes
  useEffect(() => {
    setActiveSrc(src);
    setHasError(false);
  }, [src]);

  // Autohide controls logic
  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2800);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      scheduleHideControls();
    } else {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    }
    return () => {
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
  }, [isPlaying, scheduleHideControls]);

  // IntersectionObserver for muted autoplay when visible
  useEffect(() => {
    if (!autoPlayInView) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current || hasError) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            videoRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0.6] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [autoPlayInView, hasError]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
    scheduleHideControls();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.8);
      videoRef.current.volume = 0.8;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setProgress((cur / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setHasError(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    videoRef.current.currentTime = pct * (videoRef.current.duration || 0);
    setProgress(pct * 100);
    scheduleHideControls();
  };

  const handleSkip = (seconds: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
    );
    scheduleHideControls();
  };

  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextIdx = (playbackRateIndex + 1) % PLAYBACK_RATES.length;
    setPlaybackRateIndex(nextIdx);
    videoRef.current.playbackRate = PLAYBACK_RATES[nextIdx];
    scheduleHideControls();
  };

  const toggleFitMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFitMode((prev) => (prev === 'cover' ? 'contain' : 'cover'));
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const formatTime = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleLoadSample = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSrc('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    setHasError(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={scheduleHideControls}
      onClick={togglePlay}
      className={`relative w-full aspect-[4/3] sm:aspect-[16/10] bg-stone-950 overflow-hidden cursor-pointer group select-none ${
        isFullscreen ? 'aspect-auto h-full w-full' : 'rounded-b-none'
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={activeSrc}
        poster={poster}
        muted={isMuted}
        playsInline
        loop
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => setHasError(true)}
        className={`w-full h-full transition-all duration-200 ${
          fitMode === 'cover' ? 'object-cover' : 'object-contain'
        }`}
      />

      {/* Error Fallback Banner */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 p-4 text-center text-white z-20">
          <AlertCircle className="w-8 h-8 text-orange-500 mb-2" />
          <p className="text-xs font-semibold text-stone-200 mb-1">Video stream could not be loaded</p>
          <p className="text-[11px] text-stone-400 mb-3 max-w-xs">
            External video URL is unreachable or requires direct media stream permissions.
          </p>
          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Play Sample Craft Video</span>
          </button>
        </div>
      )}

      {/* Big Center Play / Pause Indicator */}
      {!isPlaying && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none transition-opacity">
          <div className="w-14 h-14 rounded-full bg-stone-900/80 text-white flex items-center justify-center shadow-xl border border-white/20 backdrop-blur-sm">
            <Play className="w-6 h-6 ml-0.5 fill-white" />
          </div>
        </div>
      )}

      {/* Floating Top Controls (Fit, Skip, Mute) */}
      <div
        className={`absolute top-3 right-3 flex items-center gap-1.5 z-20 transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fit Toggle (Cover vs Contain) */}
        <button
          onClick={toggleFitMode}
          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 backdrop-blur-sm transition text-[10px] flex items-center gap-1"
          title={fitMode === 'contain' ? 'Switch to Fill Frame (Cover)' : 'Switch to Full Video (Contain)'}
        >
          <Scaling className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-mono uppercase">{fitMode}</span>
        </button>

        {/* Speed button */}
        <button
          onClick={cyclePlaybackRate}
          className="px-2 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white font-mono text-xs font-bold backdrop-blur-sm transition"
          title="Playback speed"
        >
          {PLAYBACK_RATES[playbackRateIndex]}x
        </button>

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bottom Video Controls Bar & Timeline */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 z-20 flex flex-col gap-2 transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrubber / Progress Bar */}
        <div
          onClick={handleSeek}
          className="w-full h-2 bg-white/25 rounded-full overflow-hidden cursor-pointer relative group-hover:h-2.5 transition-all"
        >
          <div
            className="h-full bg-orange-500 rounded-full relative transition-all"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md" />
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between text-white text-xs font-sans">
          {/* Left Controls: Play/Pause, Rewind, Fast Forward, Time */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/20 transition active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={(e) => handleSkip(-5, e)}
              className="p-1 rounded hover:bg-white/20 transition text-white/80 hover:text-white"
              title="Rewind 5s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => handleSkip(5, e)}
              className="p-1 rounded hover:bg-white/20 transition text-white/80 hover:text-white"
              title="Fast Forward 5s"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-[11px] text-white/90 tabular-nums ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: Volume Slider & Mute Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1 rounded hover:bg-white/20 text-white/90 hover:text-white transition"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-orange-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-18 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-orange-500"
                title="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
