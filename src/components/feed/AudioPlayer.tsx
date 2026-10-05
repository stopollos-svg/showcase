import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mic,
  RotateCcw,
  Gauge,
  Music,
} from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  duration?: number;
  thumbnailUrl?: string;
  businessName?: string;
  title?: string;
}

const PLAYBACK_RATES = [1, 1.25, 1.5, 2];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  duration: propDuration = 60,
  thumbnailUrl,
  businessName = 'Audio Story',
  title,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(propDuration);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rateIndex, setRateIndex] = useState(0);

  useEffect(() => {
    if (propDuration) {
      setDuration(propDuration);
    }
  }, [propDuration]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Audio playback error:', err);
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
    e.stopPropagation();
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const next = !isMuted;
    audioRef.current.muted = next;
    setIsMuted(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) {
        audioRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const cycleRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const nextIdx = (rateIndex + 1) % PLAYBACK_RATES.length;
    setRateIndex(nextIdx);
    audioRef.current.playbackRate = PLAYBACK_RATES[nextIdx];
  };

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().then(() => setIsPlaying(true));
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Waveform bars with animation when playing
  const bars = [16, 28, 42, 30, 24, 48, 60, 36, 52, 28, 44, 58, 38, 26, 48, 64, 50, 32, 24, 40, 56, 32, 20, 38];

  return (
    <div className="relative w-full rounded-2xl bg-stone-900 text-white p-4 border border-stone-800 shadow-md select-none">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={businessName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-stone-700 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
              <Music className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{businessName}</p>
            <p className="text-[11px] text-stone-400 flex items-center gap-1">
              <Mic className="w-3 h-3 text-orange-400" />
              <span>Workshop Audio Recording</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Rate button */}
          <button
            onClick={cycleRate}
            className="px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-[10px] font-bold border border-stone-700 transition"
            title="Playback Speed"
          >
            {PLAYBACK_RATES[rateIndex]}x
          </button>
        </div>
      </div>

      {/* Waveform Visualizer & Scrub Track */}
      <div
        onClick={handleSeek}
        className="w-full py-2 cursor-pointer group flex items-end gap-1 h-14 px-1 rounded-xl bg-stone-950/60 border border-stone-800/80 mb-3 relative overflow-hidden"
      >
        {bars.map((h, i) => {
          const barFraction = (i / bars.length) * 100;
          const isPassed = barFraction <= progressPercent;
          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-150 ${
                isPassed
                  ? 'bg-orange-500'
                  : 'bg-stone-700 group-hover:bg-stone-600'
              } ${isPlaying && isPassed ? 'animate-pulse' : ''}`}
              style={{
                height: `${isPlaying ? Math.max(15, (h * (0.8 + Math.random() * 0.4))) : h}%`,
              }}
            />
          );
        })}

        {/* Hover Scrub Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none transition-all shadow-sm"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Timeline & Actions */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          {/* Play / Pause Primary Button */}
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center shadow-md active:scale-95 transition"
            aria-label={isPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
          </button>

          <button
            onClick={handleRestart}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-xs text-stone-300 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Volume & Mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
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
            className="w-14 sm:w-16 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            title="Volume"
          />
        </div>
      </div>
    </div>
  );
};
