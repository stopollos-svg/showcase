import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Mic } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  duration?: number;
  thumbnailUrl?: string;
  businessName?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  duration: propDuration = 60,
  thumbnailUrl,
  businessName = 'Audio Showcase',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(propDuration);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current && propDuration) {
      setDuration(propDuration);
    }
  }, [propDuration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn('Audio play error:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(Math.round(audioRef.current.duration));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Deterministic waveform heights
  const bars = [16, 28, 42, 30, 24, 48, 60, 36, 52, 28, 44, 58, 38, 26, 48, 64, 50, 32, 24, 40, 56, 32, 20, 38];

  return (
    <div className="relative w-full rounded-2xl bg-stone-900 text-white p-4 border border-stone-800 shadow-inner overflow-hidden">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="flex items-center gap-3.5 mb-3">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={businessName}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-700 shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-orange-950/80 text-orange-400 flex items-center justify-center shrink-0 border border-orange-900/60">
            <Mic className="w-5 h-5" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-stone-200 truncate">{businessName}</p>
          <p className="text-[11px] text-stone-400">Audio Broadcast & Craft Story</p>
        </div>

        <button
          onClick={toggleMute}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center text-stone-400 hover:text-white rounded-lg transition"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-orange-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Interactive Waveform Bar Scrubber */}
      <div
        onClick={handleSeek}
        className="h-16 flex items-center justify-between gap-1 py-2 px-1 cursor-pointer bg-stone-950/60 rounded-xl border border-stone-800/80 relative"
      >
        {bars.map((height, i) => {
          const barPct = (i / bars.length) * 100;
          const isPassed = barPct <= progressPercent;

          return (
            <div
              key={i}
              className="flex-1 flex items-center justify-center h-full"
            >
              <div
                className={`w-full rounded-full transition-colors duration-100 ${
                  isPassed ? 'bg-orange-500' : 'bg-stone-700 hover:bg-stone-600'
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Play Controls & Time */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-stone-400 tabular-nums">
          <span className="text-white font-medium">{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
