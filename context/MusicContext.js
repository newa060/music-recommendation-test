import { Audio } from "expo-av";
import React, { createContext, useContext, useEffect, useState } from "react";

export const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [sound, setSound] = useState(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);

  // Stop music completely
  const stopMusic = async () => {
    console.log("🛑 stopMusic called");
    try {
      if (sound) {
        console.log("🛑 Sound exists, stopping...");
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setCurrentlyPlayingId(null);
        setIsPlaying(false);
        setCurrentSong(null);
        console.log("✅ Music stopped successfully");
      } else {
        console.log("🛑 No sound to stop");
        setCurrentlyPlayingId(null);
        setIsPlaying(false);
        setCurrentSong(null);
      }
    } catch (err) {
      console.error("❌ Failed to stop music:", err);
      // Reset state even if error
      setCurrentlyPlayingId(null);
      setIsPlaying(false);
      setCurrentSong(null);
    }
  };

  // Pause music (keep loaded)
  const pauseMusic = async () => {
    try {
      if (sound && isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Failed to pause music:", err);
    }
  };

  // Resume paused music
  const resumeMusic = async () => {
    try {
      if (sound && !isPlaying) {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Failed to resume music:", err);
    }
  };

  // Play or toggle music
  const playSound = async (song) => {
    if (!song?.filename) {
      console.error("❌ No filename provided");
      return;
    }

    console.log(`▶️ Request to play: ${song.filename}`);
    console.log(`📊 Currently playing: ${currentlyPlayingId}`);
    console.log(`🎵 Is playing: ${isPlaying}`);

    try {
      // If clicking the same song that's playing, pause it
      if (currentlyPlayingId === song.filename && isPlaying) {
        console.log("⏸️ Pausing current song");
        await pauseMusic();
        return;
      }

      // If clicking the same song that's paused, resume it
      if (currentlyPlayingId === song.filename && !isPlaying) {
        console.log("▶️ Resuming paused song");
        await resumeMusic();
        return;
      }

      // If a different song is playing, stop it first
      if (sound && currentlyPlayingId !== song.filename) {
        console.log("🔄 Stopping current song to play new one");
        await stopMusic();
        // Small delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`🎵 Creating new sound for: ${song.filename}`);
      
      // Create and play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        {
          uri: `http://192.168.18.240:3000/api/audio/play/${encodeURIComponent(song.filename)}`,
        },
        { shouldPlay: true, volume: 1.0 },
        (status) => {
          console.log("📊 Status update:", status);
          setPlaybackStatus({
            positionMillis: status.positionMillis || 0,
            durationMillis: status.durationMillis || 0,
            isLoaded: status.isLoaded,
          });
          setIsPlaying(status.isPlaying);
          
          if (status.didJustFinish) {
            console.log("🎵 Song finished playing");
            setCurrentlyPlayingId(null);
            setIsPlaying(false);
            setCurrentSong(null);
          }
        }
      );

      // Set the new sound
      setSound(newSound);
      setCurrentlyPlayingId(song.filename);
      setCurrentSong(song);
      setIsPlaying(true);
      
      console.log("✅ New song playing:", song.filename);
      
    } catch (err) {
      console.error("❌ Failed to play song:", err);
      // Reset state on error
      setCurrentlyPlayingId(null);
      setIsPlaying(false);
      setCurrentSong(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up MusicProvider");
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  return (
    <MusicContext.Provider
      value={{
        playSound,
        stopMusic,
        pauseMusic,
        resumeMusic,
        currentlyPlayingId,
        playbackStatus,
        isPlaying,
        currentSong,
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