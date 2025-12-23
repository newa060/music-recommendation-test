import { Feather, FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useMusic } from "../../context/MusicContext";


const { width, height } = Dimensions.get("window");

// Custom Slider Component
const CustomSlider = ({ value, minimumValue, maximumValue, onValueChange, minimumTrackTintColor, maximumTrackTintColor, thumbTintColor, style }) => {
  const [sliderWidth, setSliderWidth] = useState(width - 120);
  const [isSeeking, setIsSeeking] = useState(false);
  
  const onLayout = (event) => {
    setSliderWidth(event.nativeEvent.layout.width);
  };

  const handlePress = (event) => {
    const x = event.nativeEvent.locationX;
    const newValue = (x / sliderWidth) * (maximumValue - minimumValue) + minimumValue;
    setIsSeeking(true);
    onValueChange(Math.max(minimumValue, Math.min(maximumValue, newValue)));
    // Reset seeking state after a short delay
    setTimeout(() => setIsSeeking(false), 100);
  };

  const progress = maximumValue > 0 ? (value - minimumValue) / (maximumValue - minimumValue) : 0;
  const thumbPosition = progress * sliderWidth;

  return (
    <View style={[styles.sliderContainer, style]} onLayout={onLayout}>
      <View 
        style={[
          styles.track,
          { backgroundColor: maximumTrackTintColor }
        ]}
      />
      <View 
        style={[
          styles.progress,
          { 
            backgroundColor: minimumTrackTintColor,
            width: thumbPosition
          }
        ]}
      />
      <View 
        style={[
          styles.thumb,
          { 
            backgroundColor: thumbTintColor,
            left: thumbPosition - 8
          }
        ]}
      />
      <TouchableOpacity 
        style={styles.sliderTouchable}
        activeOpacity={1}
        onPress={handlePress}
        disabled={isSeeking}
      />
    </View>
  );
};

// Animated Song Card Component
const AnimatedSongCard = ({ 
  item, 
  index, 
  musicWaveAnim, 
  isCurrentlyPlaying, 
  playSound, 
  isFeatured = false, 
  onPlay,
  onCardPress
}) => {
  const cardAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 150),
      Animated.parallel([
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (isFeatured) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const cardOpacity = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const handlePlay = () => {
    onPlay(item);
  };

  const handleCardPress = () => {
    onCardPress(item);
  };

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.9}>
      <Animated.View
        style={[
          isFeatured ? styles.featuredCard : styles.songCard,
          {
            opacity: cardOpacity,
            transform: [
              { translateY: cardTranslateY },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        {isFeatured && (
          <Animated.View
            style={[
              styles.glowEffect,
              { opacity: glowOpacity }
            ]}
          />
        )}
        
        <View style={styles.songHeader}>
          <View style={styles.songInfo}>
            <View style={styles.titleRow}>
              <Text style={isFeatured ? styles.featuredTitle : styles.songTitle}>
                {item.title}
              </Text>
              {isFeatured && (
                <View style={styles.featuredBadge}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.featuredBadgeText}>Featured</Text>
                </View>
              )}
            </View>
            
            <View style={styles.songMeta}>
              <View style={styles.languageTag}>
                <Ionicons name="language" size={12} color="#6C63FF" />
                <Text style={styles.songLang}>{item.language || "Unknown"}</Text>
              </View>
              
              {isFeatured && item.similarity && (
                <View style={styles.similarityTag}>
                  <Ionicons name="pulse" size={12} color="#1DB954" />
                  <Text style={styles.songSim}>
                    {(item.similarity * 100).toFixed(1)}% Match
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.musicWave}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height: isFeatured ? 20 : 12,
                    backgroundColor: isFeatured ? "#FFD700" : "#6C63FF",
                    transform: [
                      {
                        scaleY: isCurrentlyPlaying ? musicWaveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 1.5],
                        }) : 0.2,
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.playButton,
            isCurrentlyPlaying && styles.playingButton,
            isFeatured && styles.featuredPlayButton
          ]}
          onPress={handlePlay}
        >
          <Ionicons 
            name={isCurrentlyPlaying ? "pause" : "play"} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.playText}>
            {isCurrentlyPlaying ? " Pause" : " Play Now"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Full Screen Music Player Component
const FullScreenPlayer = ({ 
  visible, 
  song, 
  isPlaying, 
  onPlayPause, 
  onClose,
  onSeek,
  currentPosition,
  duration,
  onSkipForward,
  onSkipBackward 
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const formatTime = (milliseconds) => {
    if (!milliseconds || isNaN(milliseconds)) return "0:00";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!visible || !song) return null;

  return (
    <Animated.View style={[styles.fullScreenPlayer, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <Animated.View 
        style={[
          styles.playerContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Header */}
        <View style={styles.playerHeader}>
          <TouchableOpacity style={styles.minimizeButton} onPress={onClose}>
            <Ionicons name="chevron-down" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.playerTitle}>Now Playing</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Album Art */}
        <View style={styles.albumArtContainer}>
          <View style={styles.albumArt}>
            <Ionicons name="musical-notes" size={120} color="#6C63FF" />
            <View style={styles.albumArtOverlay} />
          </View>
        </View>

        {/* Song Info */}
        <View style={styles.songInfoContainer}>
          <Text style={styles.playerSongTitle}>{song.title}</Text>
          <Text style={styles.playerArtist}>Unknown Artist</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
          <CustomSlider
            value={currentPosition}
            minimumValue={0}
            maximumValue={duration > 0 ? duration : 1}
            onValueChange={onSeek}
            minimumTrackTintColor="#6C63FF"
            maximumTrackTintColor="#333"
            thumbTintColor="#6C63FF"
            style={styles.progressBar}
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={onSkipBackward}>
            <Ionicons name="play-skip-back" size={30} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playPauseButton} onPress={onPlayPause}>
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={40} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={onSkipForward}>
            <Ionicons name="play-skip-forward" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Additional Controls */}
        <View style={styles.additionalControls}>
          <TouchableOpacity style={styles.smallControlButton}>
            <Ionicons name="shuffle" size={24} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallControlButton}>
            <Ionicons name="repeat" size={24} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallControlButton}>
            <Feather name="heart" size={24} color="#888" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// Animated Section Header
const AnimatedSectionHeader = ({ title, icon, delay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.sectionHeader,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <Text style={styles.sectionHeaderText}>
        {icon} {title}
      </Text>
      <View style={styles.headerUnderline} />
    </Animated.View>
  );
};

// Exit Confirmation Modal
const ExitConfirmationModal = ({ visible, onConfirm, onCancel }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.modalHeader}>
            <Ionicons name="log-out-outline" size={32} color="#FF6B6B" />
            <Text style={styles.modalTitle}>Exit App</Text>
          </View>
          
          <Text style={styles.modalMessage}>
            Are you sure you want to exit? Any playing music will be stopped.
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Yes, Exit</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const Home = () => {
  const [searchText, setSearchText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [fullScreenPlayerVisible, setFullScreenPlayerVisible] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const router = useRouter();

  // Use MusicContext for all audio operations
  const { 
    playSound, 
    stopMusic, 
    currentlyPlayingId, 
    playbackStatus, 
    setPlaybackStatus,
    isPlaying 
  } = useMusic();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const musicWaveAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-100)).current;
  const resultsScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setRecentlyPlayed([]);
  }, []);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup is handled by MusicContext
    };
  }, []);

  const saveToRecentlyPlayed = (song) => {
    const newRecentlyPlayed = [
      song,
      ...recentlyPlayed.filter(item => item.filename !== song.filename)
    ].slice(0, 5);
    setRecentlyPlayed(newRecentlyPlayed);
  };

  // Header animation sequence
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Music wave animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(musicWaveAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(musicWaveAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Pulse animation for search button when loading
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loading]);

  const handlePlayWithHistory = (song) => {
    playSound(song);
    saveToRecentlyPlayed(song);
  };

  const handleCardPress = (song) => {
    setCurrentSong(song);
    setFullScreenPlayerVisible(true);
    // Auto-play when opening full screen
    if (currentlyPlayingId !== song.filename) {
      playSound(song);
    }
  };

  const handleFullScreenPlayPause = async () => {
    // This will be handled by the MusicContext playSound function
    if (currentSong) {
      playSound(currentSong);
    }
  };

  const handleSeek = async (value) => {
    // Seek functionality should be implemented in MusicContext
    console.log("Seek to:", value);
    // This would require adding seek functionality to MusicContext
  };

  const handleSkipForward = async () => {
    // Skip forward functionality should be implemented in MusicContext
    console.log("Skip forward");
    // This would require adding skip functionality to MusicContext
  };

  const handleSkipBackward = async () => {
    // Skip backward functionality should be implemented in MusicContext
    console.log("Skip backward");
    // This would require adding skip functionality to MusicContext
  };

  const handleCloseFullScreen = () => {
    setFullScreenPlayerVisible(false);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      const shakeAnim = new Animated.Value(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 15, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -15, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      return;
    }

    setLoading(true);
    setResult(null);

    try {
       const res = await fetch(
        `http://192.168.18.240:3000/recommend?song=${encodeURIComponent(searchText)}`
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      const data = await res.json();
      console.log("API Response:", data);
      
      const hasValidResults = data && 
        ((data.searched_song && data.recommendations && data.recommendations.length > 0) ||
         (data.recommendations && data.recommendations.length > 0) ||
         (data.searched_song));
      
      if (hasValidResults) {
        setResult(data);
        Animated.spring(resultsScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      } else {
        setResult({ 
          error: "No results found for '" + searchText + "'. Try a different song name or check the spelling." 
        });
      }
    } catch (err) {
      console.error("Error fetching recommendation:", err);
      setResult({ 
        error: "Failed to get song recommendations. Please check your connection and try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFaceDetection = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.7, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      router.push("/FaceDetection");
    });
  };

  const handleBackToHome = async () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 100, duration: 400, useNativeDriver: true }),
      Animated.timing(resultsScaleAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setResult(null);
      setSearchText("");
      slideAnim.setValue(0);
      resultsScaleAnim.setValue(0);
    });
  };

  const handleConfirmExit = async () => {
    await stopMusic();
    setShowExitModal(false);
    router.back();
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

  // Simple back button handler - shows exit confirmation
  const handleBackPress = () => {
    if (result) {
      handleBackToHome();
    } else {
      setShowExitModal(true);
    }
  };

const isSongPlaying = (song) => {
  if (!song || !song.filename) return false; // <-- safe check
  return currentlyPlayingId === song.filename;
};

  const renderSong = ({ item, index }) => (
  item ? (
    <AnimatedSongCard
      item={item}
      index={index}
      musicWaveAnim={musicWaveAnim}
      isCurrentlyPlaying={isSongPlaying(item)}
      playSound={playSound}
      onPlay={playSound}
      onCardPress={handleCardPress}
    />
  ) : null
);

  const renderRecentlyPlayed = ({ item, index }) => (
    <AnimatedSongCard 
      item={item} 
      index={index} 
      musicWaveAnim={musicWaveAnim}
      isCurrentlyPlaying={isSongPlaying(item)}
      playSound={playSound}
      onPlay={handlePlayWithHistory}
      onCardPress={handleCardPress}
    />
  );

  const hasValidSearchResults = result && 
    !result.error && 
    (result.searched_song || (result.recommendations && result.recommendations.length > 0));

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Animated Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateX: headerSlideAnim }],
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Aatmabeat</Text>
              <Animated.View 
                style={[
                  styles.titleUnderline,
                  {
                    transform: [{ scaleX: musicWaveAnim }],
                  },
                ]} 
              />
            </View>
            <Text style={styles.subtitle}>Find music that matches your mood</Text>
          </View>
          
          {/* Back/Exit Button */}
          <TouchableOpacity style={styles.exitButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={20} color="#FF6B6B" />
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Back to Home Button */}
        {result && (
          <View style={styles.backButtonContainer}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
                <Ionicons name="arrow-back" size={18} color="#fff" />
                <Text style={styles.backButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Search Section */}
        <Animated.View style={[styles.searchSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#6C63FF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for songs..."
                placeholderTextColor="#666"
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
              />
            </View>
            <TouchableOpacity style={styles.faceButton} onPress={handleFaceDetection}>
              <MaterialIcons name="face" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={[styles.searchBtn, loading && styles.searchBtnLoading]} onPress={handleSearch} disabled={loading}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              ) : (
                <Text style={styles.searchBtnText}>Search Music</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Recently Played Section */}
        {!result && recentlyPlayed.length > 0 && (
          <Animated.View style={[styles.recentlyPlayedSection, { opacity: fadeAnim }]}>
            <AnimatedSectionHeader title="Recently Played" icon="🕒" delay={300} />
            <FlatList
              data={recentlyPlayed}
              keyExtractor={(item, index) => `recent-${index}`}
              renderItem={renderRecentlyPlayed}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        )}

        {/* Results Section */}
        {result && (
          <Animated.View style={[styles.resultSection, { opacity: resultsScaleAnim, transform: [{ scale: resultsScaleAnim }] }]}>
            {result.error ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="musical-notes" size={64} color="#666" />
                <Text style={styles.noResultsTitle}>No Results Found</Text>
                <Text style={styles.noResultsText}>{result.error}</Text>
                <TouchableOpacity style={styles.tryAgainButton} onPress={() => { setResult(null); setSearchText(""); }}>
                  <Text style={styles.tryAgainText}>Try Another Song</Text>
                </TouchableOpacity>
              </View>
            ) : hasValidSearchResults ? (
              <>
                {result.searched_song && (
                  <>
                    <AnimatedSectionHeader title="Your Searched Song" delay={200} />
                    <AnimatedSongCard 
                      item={result.searched_song} 
                      index={0}
                      musicWaveAnim={musicWaveAnim}
                      isCurrentlyPlaying={isSongPlaying(result.searched_song)}
                      playSound={playSound}
                      onPlay={playSound}
                      onCardPress={handleCardPress}
                      isFeatured={true}
                    />
                  </>
                )}
                {result.recommendations && result.recommendations.length > 0 && (
                  <>
                    <AnimatedSectionHeader title="Recommended For You" delay={400} />
                    <View style={styles.recommendationsContainer}>
                      <FlatList
                        data={result.recommendations}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderSong}
                        scrollEnabled={false}
                        showsVerticalScrollIndicator={false}
                      />
                    </View>
                  </>
                )}
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="musical-notes" size={64} color="#666" />
                <Text style={styles.noResultsTitle}>No Results Found</Text>
                <Text style={styles.noResultsText}>No songs found for your search. Try a different song name.</Text>
                <TouchableOpacity style={styles.tryAgainButton} onPress={() => { setResult(null); setSearchText(""); }}>
                  <Text style={styles.tryAgainText}>Try Another Song</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        {/* Empty State */}
        {!result && recentlyPlayed.length === 0 && !loading && (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={styles.emptyStateIcon}>
              <FontAwesome5 name="search" size={80} color="#333" />
              <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
            </View>
            <Text style={styles.emptyStateTitle}>Discover New Music</Text>
            <Text style={styles.emptyStateText}>
              Search for your favorite songs or use face detection to find music that matches your mood
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Full Screen Music Player */}
      <FullScreenPlayer
        visible={fullScreenPlayerVisible}
        song={currentSong}
        isPlaying={isSongPlaying(currentSong)}
        onPlayPause={handleFullScreenPlayPause}
        onClose={handleCloseFullScreen}
        onSeek={handleSeek}
        currentPosition={playbackStatus?.positionMillis || 0}
        duration={playbackStatus?.durationMillis || 0}
        onSkipForward={handleSkipForward}
        onSkipBackward={handleSkipBackward}
      />

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        visible={showExitModal}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />
    </View>
  );
};

export default Home;

// ... keep all your existing styles exactly the same ...
const styles = StyleSheet.create({
  // ... ALL YOUR EXISTING STYLES REMAIN UNCHANGED ...
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  headerContent: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1.5,
    textShadowColor: "rgba(108, 99, 255, 0.3)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  titleUnderline: {
    width: 80,
    height: 4,
    backgroundColor: "#6C63FF",
    borderRadius: 2,
    marginTop: 8,
    transformOrigin: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: "#bbb",
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  exitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
    marginTop: 8,
  },
  exitButtonText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  backButtonContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(42, 42, 42, 0.9)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  searchSection: {
    marginBottom: 30,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    padding: 0,
    fontWeight: "500",
  },
  faceButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 20,
    padding: 16,
    marginLeft: 12,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  searchBtn: {
    marginTop: 16,
    backgroundColor: "#6C63FF",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  searchBtnLoading: {
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  searchBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  recentlyPlayedSection: {
    marginBottom: 30,
  },
  resultSection: {
    marginTop: 10,
  },
  sectionHeader: {
    marginBottom: 20,
    marginTop: 10,
  },
  sectionHeaderText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerUnderline: {
    width: 60,
    height: 3,
    backgroundColor: "#6C63FF",
    borderRadius: 2,
  },
  featuredCard: {
    backgroundColor: "rgba(108, 99, 255, 0.15)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(108, 99, 255, 0.5)",
    overflow: "hidden",
    position: "relative",
  },
  glowEffect: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: "#6C63FF",
    borderRadius: 30,
    opacity: 0.3,
  },
  songCard: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  songHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  songInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  featuredTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.5)",
  },
  featuredBadgeText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  songMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  languageTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(108, 99, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  similarityTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(29, 185, 84, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  songLang: {
    color: "#6C63FF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  songSim: {
    color: "#1DB954",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  musicWave: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 25,
    marginLeft: 12,
    paddingBottom: 2,
  },
  waveBar: {
    width: 3,
    marginHorizontal: 1.5,
    borderRadius: 2,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  playingButton: {
    backgroundColor: "#FF6B6B",
  },
  featuredPlayButton: {
    backgroundColor: "#FFD700",
  },
  playText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  recommendationsContainer: {
    marginTop: 8,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  tryAgainButton: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tryAgainText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    position: "relative",
    marginBottom: 24,
  },
  pulseCircle: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: "rgba(108, 99, 255, 0.1)",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(108, 99, 255, 0.3)",
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },
  // Full Screen Player Styles
  fullScreenPlayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0A0A0A',
    zIndex: 1000,
  },
  playerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  minimizeButton: {
    padding: 10,
  },
  playerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  albumArt: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    position: 'relative',
  },
  albumArtOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  songInfoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  playerSongTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  playerArtist: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  timeText: {
    color: '#888',
    fontSize: 12,
    width: 40,
  },
  progressBar: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  controlButton: {
    padding: 20,
  },
  playPauseButton: {
    backgroundColor: '#6C63FF',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallControlButton: {
    padding: 15,
    marginHorizontal: 10,
  },
  // Custom Slider Styles
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  progress: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6C63FF',
    position: 'absolute',
    left: 0,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
    position: 'absolute',
    top: '50%',
    marginTop: -8,
  },
  sliderTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#333',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});