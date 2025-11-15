import React, { createContext, useState, useEffect, useContext } from "react";
import { Audio } from "expo-av";

export const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [sound, setSound] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);

  const stopMusic = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setCurrentlyPlayingId(null);
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Failed to stop music:", err);
    }
  };

  const playSound = async (song) => {
    if (!song?.filename) return;

    try {
      if (sound && currentlyPlayingId !== song.filename) {
        await stopMusic();
      }

      if (currentlyPlayingId === song.filename && sound) {
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        {
          uri: `http://192.168.18.240:3000/api/audio/play/${encodeURIComponent(song.filename)}`,
        },
        { shouldPlay: true },
        (status) => {
          setPlaybackStatus({
            positionMillis: status.positionMillis || 0,
            durationMillis: status.durationMillis || 0,
            isLoaded: status.isLoaded,
          });
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) setCurrentlyPlayingId(null);
        }
      );

      setSound(newSound);
      setCurrentlyPlayingId(song.filename);
      setIsPlaying(true);
    } catch (err) {
      console.error("Failed to play song:", err);
    }
  };

  useEffect(() => {
    return () => stopMusic();
  }, []);

  return (
    <MusicContext.Provider
      value={{
        playSound,
        stopMusic,
        currentlyPlayingId,
        setCurrentlyPlayingId,
        playbackStatus,
        setPlaybackStatus,
        isPlaying,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

// ✅ Export a custom hook for easy usage
export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
};
