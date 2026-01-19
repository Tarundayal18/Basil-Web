/**
 * SecondHeroSection component for the BASIL landing page.
 * This is the second section (TWO) - Dashboard showcase
 * Dashboard video with play/pause controls
 */

"use client";

import { useEffect, useState, useRef } from "react";

/**
 * SecondHeroSection displays the dashboard video with play/pause controls.
 * @returns JSX element containing the second hero section with video
 */
export default function SecondHeroSection() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error("Video play error:", error);
          setVideoError(true);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoError = () => {
    console.error("Video failed to load");
    setVideoError(true);
  };

  // Auto-play video when component mounts
  useEffect(() => {
    if (videoRef.current && !videoError) {
      videoRef.current.play().catch(error => {
        console.error("Auto-play failed:", error);
        setIsPlaying(false);
      });
    }
  }, [videoError]);

  return (
    <section
      id="second-hero"
      className="relative pt-12 md:pt-20 pb-16 md:pb-24 px-6 md:px-10 lg:px-12 overflow-visible"
    >
      <div className="relative z-10 w-full">
        {/* Video Container */}
        <div className="relative w-full mx-auto rounded-2xl md:rounded-3xl overflow-hidden">
          {/* Gradient border effect */}
          <div className="absolute -inset-1 bg-gradient-to-br from-[#46499e] via-[#ed4734] to-[#f1b02b] rounded-2xl md:rounded-3xl opacity-20 blur-sm"></div>

          {/* Video */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-gray-200/50 shadow-[0_25px_80px_-15px_rgba(70,73,158,0.3)]">
            {videoError ? (
              <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-gray-600 mb-4">Video could not be loaded</p>
                  <p className="text-sm text-gray-500">Please make sure hero-video.mp4 is in the /public folder</p>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src="/herovideo.mp4"
                  className="w-full h-auto"
                  loop
                  playsInline
                  autoPlay
                  muted
                  preload="auto"
                  onError={handleVideoError}
                >
                  Your browser does not support the video tag.
                </video>
                
                {/* Play/Pause Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <button
                    onClick={handlePlayPause}
                    className="pointer-events-auto bg-white/90 backdrop-blur-sm text-gray-800 p-4 rounded-full text-2xl hover:bg-white transition-all focus:outline-none shadow-lg"
                  >
                    {isPlaying ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

