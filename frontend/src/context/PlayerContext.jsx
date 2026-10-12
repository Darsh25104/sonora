import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { streamUrl } from '../services/api.js';
import * as songsService from '../services/songs.service.js';
import { useAuth } from './AuthContext.jsx';
import { useUI } from './UIContext.jsx';

const PlayerContext = createContext(null);
const VOLUME_KEY = 'sonora_volume';

const storedVolume = () => {
  const value = Number(localStorage.getItem(VOLUME_KEY));
  return Number.isFinite(value) && value > 0 ? Math.min(value, 1) : 0.8;
};

/**
 * ── How playback works ────────────────────────────────────────────────
 *
 *  User clicks a song card
 *          ↓
 *  playSong(song, queue)  →  currentTrack + queue + currentIndex in state
 *          ↓
 *  useEffect(currentTrack) sets <audio>.src = /api/songs/:id/stream
 *          ↓
 *  audio.play() → "play" event → isPlaying = true → UI updates
 *          ↓
 *  "timeupdate" → currentTime (progress bar), "durationchange" → duration
 *          ↓
 *  "ended" → repeat/shuffle logic → next track loads automatically
 *
 * Because the <audio> element and this state live *above* the router,
 * navigation never interrupts playback.
 */
export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const { user } = useAuth();
  const { showToast } = useUI();

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(storedVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off' | 'all' | 'one'

  /* ------------------------------------------------------------------ */
  /* Audio element events (attached once)                                */
  /* ------------------------------------------------------------------ */

  // Keeps the latest "ended" logic reachable from the long-lived listener.
  const onEndedRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onDurationChange = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => onEndedRef.current?.();
    const onError = () => {
      setIsPlaying(false);
      showToast('This track could not be played. The audio file may be missing.', 'error');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [showToast]);

  /* ------------------------------------------------------------------ */
  /* Volume                                                              */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  const setVolume = useCallback((value) => {
    const next = Math.min(1, Math.max(0, value));
    setVolumeState(next);
    localStorage.setItem(VOLUME_KEY, String(next));
    if (next > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  /* ------------------------------------------------------------------ */
  /* Recently played bookkeeping                                         */
  /* ------------------------------------------------------------------ */

  const lastRecordedRef = useRef(null);

  useEffect(() => {
    if (!currentTrack || !user) return; // anonymous visitors get no history
    const id = String(currentTrack._id);
    const now = Date.now();
    if (lastRecordedRef.current?.id === id && now - lastRecordedRef.current.at < 30000) return;

    lastRecordedRef.current = { id, at: now };
    songsService.recordPlay(id).catch(() => {}); // never block playback on stats
  }, [currentTrack, user]);

  /* ------------------------------------------------------------------ */
  /* Loading a track                                                     */
  /* ------------------------------------------------------------------ */

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const promise = audio.play();
    if (promise) {
      promise.catch(() => {
        setIsPlaying(false);
        showToast('Autoplay was blocked — press the play button to start.', 'info');
      });
    }
  }, [showToast]);

  const loadAndPlay = useCallback(
    (song, list, index) => {
      if (list?.length) {
        setQueue(list);
        setCurrentIndex(index);
      }
      setCurrentTrack(song);
    },
    []
  );

  // A new track was selected → point the audio element at the stream URL.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (audio.dataset.songId !== String(currentTrack._id)) {
      audio.dataset.songId = String(currentTrack._id);
      audio.src = streamUrl(currentTrack._id);
      setCurrentTime(0);
      setDuration(currentTrack.duration || 0);
    }

    audio.volume = isMuted ? 0 : volume;
    playAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  /* ------------------------------------------------------------------ */
  /* Public controls                                                     */
  /* ------------------------------------------------------------------ */

  const playSong = useCallback(
    (song, list = []) => {
      if (!song) return;
      const isSameTrack = currentTrack && String(currentTrack._id) === String(song._id);

      if (isSameTrack) {
        // Clicking the playing row toggles playback.
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) playAudio();
        else audio.pause();
        return;
      }

      // Pick the queue that actually contains this song:
      //   1. the list passed by the caller (card/row context)
      //   2. otherwise the queue already loaded
      //   3. otherwise a single-track queue
      // This keeps queue[currentIndex] === currentTrack so next/prev stay correct.
      let targetList = list;
      let targetIndex = list.length
        ? list.findIndex((s) => String(s._id) === String(song._id))
        : -1;

      if (targetIndex < 0 && queue.length) {
        targetList = queue;
        targetIndex = queue.findIndex((s) => String(s._id) === String(song._id));
      }
      if (targetIndex < 0) {
        targetList = [song];
        targetIndex = 0;
      }

      loadAndPlay(song, targetList, targetIndex);
    },
    [currentTrack, queue, loadAndPlay, playAudio]
  );

  const playFromList = useCallback(
    (list, index = 0) => {
      if (!list?.length) return;
      const song = list[index];
      if (!song) return;

      const isSameTrack = currentTrack && String(currentTrack._id) === String(song._id);
      setQueue(list);
      setCurrentIndex(index);
      if (isSameTrack) {
        playAudio();
        return;
      }
      setCurrentTrack(song);
    },
    [currentTrack, loadAndPlay, playAudio]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) playAudio();
    else audio.pause();
  }, [currentTrack, playAudio]);

  /** Picks the index of the next track. Returns null when playback should stop. */
  const pickNextIndex = useCallback(
    (forEnded) => {
      if (!queue.length) return null;

      if (shuffle && queue.length > 1) {
        let next = currentIndex;
        while (next === currentIndex) next = Math.floor(Math.random() * queue.length);
        return next;
      }

      if (currentIndex < queue.length - 1) return currentIndex + 1;
      if (repeat === 'all' || !forEnded) return 0; // wrap
      return null; // end of queue with repeat off
    },
    [queue, currentIndex, shuffle, repeat]
  );

  const goToIndex = useCallback(
    (index) => {
      const song = queue[index];
      if (!song) return;

      // Single-item queue: restart the same track.
      if (index === currentIndex) {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
          playAudio();
        }
        return;
      }
      setCurrentIndex(index);
      setCurrentTrack(song);
    },
    [queue, currentIndex, playAudio]
  );

  const next = useCallback(() => {
    const index = pickNextIndex(false);
    if (index === null) return;
    goToIndex(index);
  }, [pickNextIndex, goToIndex]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    // Standard behaviour: restart the song unless we're near its start.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (!queue.length) return;
    const index = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    goToIndex(index);
  }, [currentIndex, queue.length, goToIndex]);

  /** "ended" handler — decides what happens when a song finishes. */
  const handleEnded = useCallback(() => {
    if (repeat === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        playAudio();
      }
      return;
    }
    const index = pickNextIndex(true);
    if (index === null) {
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }
    goToIndex(index);
  }, [repeat, pickNextIndex, goToIndex, playAudio]);

  useEffect(() => {
    onEndedRef.current = handleEnded; // always the latest closure
  });

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time)) return;
    const clamped = Math.min(Math.max(0, time), audio.duration || time);
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
    []
  );

  const value = useMemo(
    () => ({
      currentTrack,
      queue,
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      shuffle,
      repeat,
      hasTrack: Boolean(currentTrack),
      playSong,
      playFromList,
      togglePlay,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
    }),
    [
      currentTrack, queue, currentIndex, isPlaying, currentTime, duration,
      volume, isMuted, shuffle, repeat,
      playSong, playFromList, togglePlay, next, previous, seek,
      setVolume, toggleMute, toggleShuffle, cycleRepeat,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* Hidden element that actually decodes and plays the audio. */}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}
