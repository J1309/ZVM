import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

const LOADER_DURATION_MS = 3000;
const LOADER_PLAYBACK_RATE = 1.96;

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let done = false;
    let completionTimer: ReturnType<typeof setTimeout> | undefined;
    let loaderTimer: ReturnType<typeof setTimeout> | undefined;
    let progressFrame: number | undefined;

    const finish = () => {
      if (done) return;
      done = true;
      if (progressFrame) cancelAnimationFrame(progressFrame);
      setProgress(100);
      completionTimer = setTimeout(onComplete, 400);
    };

    const fallbackTimer = setTimeout(finish, LOADER_DURATION_MS + 500);

    const v = videoRef.current;

    const startTimeline = () => {
      if (loaderTimer) return;
      if (v) {
        try { v.playbackRate = LOADER_PLAYBACK_RATE; } catch (_) { /* Safari may throw */ }
      }
      const startedAt = performance.now();
      const updateProgress = () => {
        setProgress(Math.min(((performance.now() - startedAt) / LOADER_DURATION_MS) * 100, 100));
        progressFrame = requestAnimationFrame(updateProgress);
      };
      updateProgress();
      loaderTimer = setTimeout(finish, LOADER_DURATION_MS);
    };

    const onEnd = () => finish();

    // Start the progress timeline immediately (video is background decoration)
    startTimeline();

    if (v) {
      // Safari autoplay: ensure attributes are set programmatically as well
      v.muted = true;
      v.playsInline = true;
      v.setAttribute('webkit-playsinline', '');
      v.setAttribute('x-webkit-airplay', 'deny');
      v.controls = false;
      v.preload = 'auto';

      v.addEventListener('playing', startTimeline);
      v.addEventListener('ended', onEnd);

      // Attempt autoplay; Safari may block it silently
      const attemptPlay = () => {
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay blocked — video stays paused, but the loader
            // timeline runs regardless so the site still loads.
          });
        }
      };

      attemptPlay();

      // Safari sometimes needs a second attempt after a micro-delay
      const retryTimer = setTimeout(attemptPlay, 200);

      return () => {
        clearTimeout(loaderTimer);
        clearTimeout(fallbackTimer);
        clearTimeout(completionTimer);
        clearTimeout(retryTimer);
        if (progressFrame) cancelAnimationFrame(progressFrame);
        v.removeEventListener('playing', startTimeline);
        v.removeEventListener('ended', onEnd);
      };
    }

    return () => {
      clearTimeout(loaderTimer);
      clearTimeout(fallbackTimer);
      clearTimeout(completionTimer);
      if (progressFrame) cancelAnimationFrame(progressFrame);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#071A3D]"
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            webkit-playsinline=""
            controls={false}
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            className="preloader-video h-full w-full object-cover opacity-45"
            style={{ pointerEvents: 'none' }}
          >
            <source src="/loader2.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,61,145,0.24),rgba(7,26,61,0.86)_70%)]" />
        </div>

        <div className="relative z-10 flex w-full max-w-[248px] flex-col items-center px-4 text-center lg:hidden">
          <img src="/images/zvm_companyname_logo.png" alt="ZoomieVan" className="h-14 w-auto" />
          <p className="mt-4 text-sm font-medium text-white/82">Getting tails moving...</p>
          <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="relative z-10 hidden flex-col items-center gap-8 lg:flex">
          <div className="flex flex-col items-center gap-3">
            <img src="/images/zvm_companyname_logo.png" alt="ZoomieVan" className="h-20 w-auto" />
            <p className="text-sm font-medium text-white/82">Getting tails moving...</p>
          </div>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
