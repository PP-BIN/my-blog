import { useEffect, useRef, useState } from 'react';
import styles from '../css/MusicPlayer.module.css';

const playlist = [
  {
    title: '동물의 숲 bgm 1',
    file: '/audio/1am.mp3',
    cover: '/images/모동숲.jpg',
  },
  {
    title: '동물의 숲 bgm 2',
    file: '/audio/2am.mp3',
    cover: '/images/cover1.png',
  },
];

function MusicPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(new Audio());
  const progressRef = useRef(null);

  // ✅ 곡 변경 시 초기화 + 이벤트 등록
  useEffect(() => {
    const audio = audioRef.current;
    audio.src = playlist[currentIndex].file;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (isPlaying) audio.play();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex]);

  // ✅ play/pause 토글
  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const handlePlayPause = () => setIsPlaying((prev) => !prev);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
    setCurrentTime(0); // ✅ 진행 바 초기화
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? playlist.length - 1 : prev - 1));
    setIsPlaying(true);
    setCurrentTime(0); // ✅ 진행 바 초기화
  };

  // ✅ 시크바 드래그
  const handleSeek = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // ✅ 시크바 클릭(PC+모바일)
  const handleProgressClick = (e) => {
    const progressBar = progressRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX || e.touches?.[0].clientX; // 모바일 터치 대응
    const offsetX = clickX - rect.left;
    const newTime = (offsetX / rect.width) * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentSong = playlist[currentIndex];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>PLAYLIST</h3>
      <p className={styles.songTitle}>{currentSong.title}</p>

      <div className={styles.diskWrapper}>
        <img src="/images/vinyl.png" alt="vinyl" className={styles.vinyl} />
        <img
          src={currentSong.cover}
          alt="cover"
          className={`${styles.cover} ${styles.rotating} ${
            !isPlaying ? styles.paused : ''
          }`}
        />
      </div>

      {/* ✅ 진행 바 + 시간 */}
      <div className={styles.progressWrapper}>
        <span className={styles.time}>{formatTime(currentTime)}</span>
        <div
          className={styles.progressContainer}
          onClick={handleProgressClick}
          onTouchStart={handleProgressClick} // 모바일 터치 대응
        >
          <input
            ref={progressRef}
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className={styles.progressBar}
          />
        </div>
        <span className={styles.time}>{formatTime(duration)}</span>
      </div>

      <div className={styles.controls}>
        <button onClick={handlePrev}>⏮</button>
        <button onClick={handlePlayPause}>{isPlaying ? '⏸' : '▶'}</button>
        <button onClick={handleNext}>⏭</button>
      </div>
    </div>
  );
}

export default MusicPlayer;





