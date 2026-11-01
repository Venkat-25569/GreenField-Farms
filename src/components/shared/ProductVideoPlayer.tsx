import { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  RotateCcw, Loader2, AlertCircle, Film, Sparkles, Check
} from 'lucide-react';
import type { ProductVideo } from '@/types';
import { cn } from '@/lib/utils';

interface ProductVideoPlayerProps {
  videos: ProductVideo[];
  productName: string;
}

export function ProductVideoPlayer({ videos, productName }: ProductVideoPlayerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeVideo = videos[selectedIndex] || null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset player state when changing active video
  useEffect(() => {
    setIsPlaying(false);
    setHasStarted(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    setIsLoading(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [selectedIndex]);

  // Sync fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      setHasStarted(true);
      setIsLoading(true);
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Video playback error:', err);
          setHasError(true);
          setIsLoading(false);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoading(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    videoRef.current.volume = newVol;
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeVideo) {
    return (
      <div className="aspect-[4/3] rounded-2xl bg-cream-50 border border-forest-100 flex flex-col items-center justify-center p-8 text-center">
        <Film className="w-12 h-12 text-forest-300 mb-2" />
        <p className="text-forest-900 font-semibold">No videos available for this product</p>
        <p className="text-xs text-earth-500 mt-1">Check back later or browse product photos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Video Screen Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className="relative aspect-[4/3] sm:aspect-[16/10] bg-black rounded-2xl overflow-hidden shadow-md group border border-forest-950/20 select-none flex items-center justify-center"
      >
        {/* HTML5 Video Element (Lazy loaded until user starts playback) */}
        <video
          ref={videoRef}
          src={activeVideo.video_url}
          poster={activeVideo.thumbnail_url || undefined}
          preload={hasStarted ? 'auto' : 'none'}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => { setIsLoading(false); setIsPlaying(true); }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={() => { setHasError(true); setIsLoading(false); }}
          onClick={handlePlayPause}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Poster / Play Overlay before video starts */}
        {!hasStarted && (
          <div
            onClick={handlePlayPause}
            className="absolute inset-0 bg-forest-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer group/overlay transition-all"
          >
            {activeVideo.thumbnail_url && (
              <img
                src={activeVideo.thumbnail_url}
                alt={activeVideo.title || productName}
                className="absolute inset-0 w-full h-full object-cover -z-10 opacity-70 group-hover/overlay:scale-105 transition-transform duration-500"
              />
            )}
            
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-forest-700/90 text-white flex items-center justify-center shadow-2xl border-2 border-harvest-400 group-hover/overlay:scale-110 group-hover/overlay:bg-forest-600 transition-all duration-300">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-harvest-400 text-harvest-400 ml-1" />
            </div>

            <div className="mt-4 px-4 py-1.5 rounded-full bg-forest-950/80 backdrop-blur-md border border-harvest-400/40 text-cream-100 text-xs sm:text-sm font-semibold tracking-wide">
              ▶ Click to Play Video
            </div>
            {activeVideo.title && (
              <p className="text-white/90 text-xs mt-2 drop-shadow-md font-medium max-w-[85%] text-center line-clamp-1">
                {activeVideo.title}
              </p>
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-forest-950/80 text-white">
              <Loader2 className="w-8 h-8 animate-spin text-harvest-400" />
              <span className="text-xs font-medium">Buffering video...</span>
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-forest-950/90 text-white p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
            <p className="font-semibold text-sm">Failed to stream video</p>
            <p className="text-xs text-forest-300 mt-1 max-w-sm">
              The video could not be loaded. Please check your network connection or verify the video file format.
            </p>
            <button
              onClick={() => {
                setHasError(false);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play();
                }
              }}
              className="mt-3 px-3 py-1.5 rounded-lg bg-forest-800 hover:bg-forest-700 text-xs font-semibold flex items-center gap-1.5 border border-forest-600"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry Playback
            </button>
          </div>
        )}

        {/* Top Video Title Pill */}
        {hasStarted && showControls && activeVideo.title && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none transition-opacity duration-300">
            <span className="text-xs font-medium bg-forest-950/85 backdrop-blur-md text-white px-3 py-1 rounded-full border border-forest-700/50 truncate max-w-[75%]">
              🎬 {activeVideo.title}
            </span>
          </div>
        )}

        {/* Custom GreenField Video Controls Bar */}
        {hasStarted && (
          <div
            className={cn(
              "absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 sm:p-4 transition-opacity duration-300 flex flex-col gap-2",
              showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
          >
            {/* Scrubber / Progress Bar */}
            <div className="flex items-center gap-2 group/slider">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-harvest-400 hover:h-2 transition-all"
              />
            </div>

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-3">
                {/* Play / Pause */}
                <button
                  onClick={handlePlayPause}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                {/* Volume & Mute */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-14 sm:w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-harvest-400"
                  />
                </div>

                {/* Time Display */}
                <span className="text-[11px] font-mono text-white/90">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right Side: Fullscreen */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multiple Videos Thumbnail Selector Strip */}
      {videos.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-forest-900 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-forest-700" />
            Product Videos ({videos.length}):
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {videos.map((vid, idx) => {
              const isActive = selectedIndex === idx;
              return (
                <button
                  key={vid.id || idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={cn(
                    "relative flex-shrink-0 w-24 h-18 rounded-xl overflow-hidden border-2 transition-all duration-200 text-left group bg-forest-950",
                    isActive
                      ? "border-harvest-400 ring-2 ring-forest-400/50 scale-102"
                      : "border-earth-200 hover:border-forest-400 opacity-80 hover:opacity-100"
                  )}
                >
                  {vid.thumbnail_url ? (
                    <img
                      src={vid.thumbnail_url}
                      alt={vid.title || `Video ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-forest-900 text-harvest-400">
                      <Film className="w-6 h-6" />
                    </div>
                  )}

                  {/* Play overlay icon */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                    <div className="w-6 h-6 rounded-full bg-forest-800/90 text-harvest-400 flex items-center justify-center shadow">
                      <Play className="w-3 h-3 fill-harvest-400 ml-0.5" />
                    </div>
                  </div>

                  {/* Active Indicator Badge */}
                  {isActive && (
                    <span className="absolute top-1 right-1 bg-harvest-400 text-forest-950 text-[9px] font-bold px-1 rounded shadow-xs">
                      Active
                    </span>
                  )}

                  {/* Video Number/Title */}
                  <div className="absolute bottom-0 inset-x-0 bg-black/75 px-1 py-0.5 text-[10px] text-white truncate text-center">
                    {vid.title || `Video ${idx + 1}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

