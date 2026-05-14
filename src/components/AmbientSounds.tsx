import React, { useEffect, useRef } from 'react';

export default function AmbientSounds() {
  const rainRef = useRef<HTMLAudioElement>(null);
  const fireRef = useRef<HTMLAudioElement>(null);
  const windRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (rainRef.current) rainRef.current.volume = 0.4;
    if (fireRef.current) fireRef.current.volume = 0.6;
    if (windRef.current) windRef.current.volume = 0.3;

    const playAudio = () => {
      rainRef.current?.play().catch(() => {});
      fireRef.current?.play().catch(() => {});
      windRef.current?.play().catch(() => {});
    };

    playAudio();
    
    // In case autoplay fails due to lack of interaction, any click will start it
    window.addEventListener('click', playAudio);
    window.addEventListener('keydown', playAudio);
    
    return () => {
      window.removeEventListener('click', playAudio);
      window.removeEventListener('keydown', playAudio);
    };
  }, []);

  return (
    <>
      <audio ref={rainRef} src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_3d1daeeab8.mp3?filename=rain-and-thunder-16705.mp3" loop />
      <audio ref={fireRef} src="https://cdn.pixabay.com/download/audio/2022/10/25/audio_2eb276ea79.mp3?filename=fireplace-magic-122941.mp3" loop />
      <audio ref={windRef} src="https://cdn.pixabay.com/download/audio/2021/08/09/audio_ee4f981e4a.mp3?filename=wind-outside-sound-ambient-141941.mp3" loop />
    </>
  );
}
