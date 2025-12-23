import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from "react-native";
import { useMusic } from "../context/MusicContext";

const { width, height } = Dimensions.get("window");

// Main Component
export default function FaceDetection() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [songs, setSongs] = useState([]);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const { 
    playSound, 
    currentlyPlayingId, 
    isPlaying,
    playbackStatus,
    stopMusic 
  } = useMusic();

  // Check camera permission
  useEffect(() => {
    if (permission) {
      setHasPermission(permission.granted);
    }
  }, [permission]);

  const handleScanFace = async () => {
    // Check permission first
    if (!hasPermission) {
      Alert.alert(
        "Camera Permission Required",
        "Please grant camera permission to scan your face",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Grant Permission", onPress: requestPermission }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      setEmotion(null);
      setSongs([]);
      
      // Stop any playing music
      await stopMusic();
      
      // Show camera for scanning
      setCameraVisible(true);
      
      // Wait for camera to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!cameraRef.current) {
        throw new Error("Camera not ready");
      }
      
      console.log("📸 Taking photo...");
      
      // Take photo
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: true,
      });

      console.log("✅ Photo taken successfully");
      
      // Hide camera after taking photo
      setCameraVisible(false);
      
      // Generate a random session ID
      const sessionId = Date.now().toString();
      
      // Call Flask API
      const response = await fetch("http://192.168.18.240:5000/api/working-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: photo.base64,
          session_id: sessionId,
        }),
      });
      
      const data = await response.json();
      console.log("🎵 API Response:", data);
      
      if (data.success === false) {
        Alert.alert("API Error", data.error || "Scan failed");
        return;
      }
      
      setEmotion(data.emotion);
      
      // Shuffle songs for variety
      if (data.songs) {
        const shuffledSongs = [...data.songs].sort(() => Math.random() - 0.5);
        setSongs(shuffledSongs);
      } else {
        setSongs([]);
      }
      
      Alert.alert(
        "Mood Detected! 🎭",
        `Your emotion: ${data.emotion}\n\n` +
        `Found ${data.songs?.length || 0} matching songs\n\n` +
        `Click PLAY to listen`
      );
      
    } catch (err) {
      console.error("❌ Scan error:", err);
      setCameraVisible(false);
      
      if (err.message.includes("Camera not ready")) {
        Alert.alert(
          "Camera Error",
          "Camera is not ready. Please try again.",
          [{ text: "OK", onPress: () => setCameraVisible(false) }]
        );
      } else {
        Alert.alert(
          "Scan Failed",
          "Could not scan face. Using demo mode."
        );
        // Fallback to demo data
        setEmotion("happy");
        const demoData = [
          { id: "1", title: "45. - Golden Band", artist: "Demo Artist", score: 0.95, emotion: "happy", filename: "45._-_Golden_Band.mp3" },
          { id: "2", title: "Happy Song 2", artist: "Demo Artist 2", score: 0.88, emotion: "happy", filename: "test_song2.mp3" },
          { id: "3", title: "Joyful Melody", artist: "Demo Artist 3", score: 0.92, emotion: "happy", filename: "test_song3.mp3" },
        ];
        const shuffledDemo = [...demoData].sort(() => Math.random() - 0.5);
        setSongs(shuffledDemo);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song) => {
    if (!song.filename) {
      Alert.alert("No Audio", "Song has no audio file");
      return;
    }
    
    console.log(`▶️ Playing: ${song.filename}`);
    playSound(song);
  };

  const closeCamera = () => {
    setCameraVisible(false);
  };

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionText}>GRANT PERMISSION</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Modal - Only shows when scanning */}
      <Modal
        visible={cameraVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeCamera}
      >
        <View style={styles.cameraModalContainer}>
          <StatusBar barStyle="light-content" />
          
          <View style={styles.cameraHeader}>
            <TouchableOpacity onPress={closeCamera} style={styles.closeButton}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>SCAN YOUR FACE</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {cameraVisible && (
            <CameraView 
              ref={cameraRef}
              style={styles.camera}
              facing="front"
              onCameraReady={() => {
                console.log("✅ Camera is ready");
                setIsCameraReady(true);
              }}
              onMountError={(error) => {
                console.error("❌ Camera mount error:", error);
                Alert.alert("Camera Error", "Failed to start camera");
                setCameraVisible(false);
              }}
            />
          )}
          
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
            <Text style={styles.scanGuide}>Align your face within the frame</Text>
            
            <TouchableOpacity 
              style={styles.captureButton}
              onPress={handleScanFace}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.captureInner}>
                  <Ionicons name="scan" size={30} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎵 MOOD MUSIC</Text>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={async () => {
              // Quick test without camera
              try {
                setLoading(true);
                const response = await fetch("http://192.168.18.240:5000/api/working-scan", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ test: true })
                });
                
                const data = await response.json();
                if (data.success) {
                  setEmotion(data.emotion);
                  const shuffledSongs = [...data.songs].sort(() => Math.random() - 0.5);
                  setSongs(shuffledSongs);
                  Alert.alert("Test Success", `Got ${data.songs?.length || 0} songs`);
                }
              } catch (err) {
                Alert.alert("Test Failed", "Cannot connect to Flask");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <Text style={styles.testText}>QUICK TEST</Text>
          </TouchableOpacity>
        </View>
        
        {/* Emotion Display */}
        {emotion && (
          <View style={styles.emotionDisplay}>
            <Text style={styles.emotionLabel}>CURRENT MOOD:</Text>
            <Text style={styles.emotionValue}>{emotion.toUpperCase()}</Text>
            <View style={styles.emotionIcon}>
              <Text style={styles.emotionEmoji}>
                {emotion === 'happy' ? '😊' : 
                 emotion === 'sad' ? '😢' : '😐'}
              </Text>
            </View>
          </View>
        )}
        
        {/* Songs List */}
        {loading && !cameraVisible ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
            <Text style={styles.loadingText}>Getting songs...</Text>
          </View>
        ) : songs.length > 0 ? (
          <ScrollView style={styles.songsList}>
            <Text style={styles.songsTitle}>RECOMMENDED SONGS ({songs.length})</Text>
            {songs.map((song, index) => (
              <View 
                key={song.id || index}
                style={[
                  styles.songCard,
                  currentlyPlayingId === song.filename && isPlaying && styles.playingCard
                ]}
              >
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{song.artist || "Unknown"}</Text>
                  <View style={styles.songMeta}>
                    <Text style={styles.songScore}>Match: {song.score}</Text>
                    <Text style={styles.songEmoji}>
                      {song.emotion === 'happy' ? '😊' : 
                       song.emotion === 'sad' ? '😢' : '😐'}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.playButton,
                    currentlyPlayingId === song.filename && isPlaying && styles.playingButton
                  ]}
                  onPress={() => handlePlaySong(song)}
                >
                  <Ionicons 
                    name={currentlyPlayingId === song.filename && isPlaying ? "pause" : "play"} 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.playText}>
                    {currentlyPlayingId === song.filename && isPlaying ? " Pause" : " Play"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes" size={80} color="#333" />
            <Text style={styles.emptyTitle}>No Songs Yet</Text>
            <Text style={styles.emptyDescription}>
              Scan your face to get personalized music recommendations
            </Text>
            <Text style={styles.emptySubtext}>
              Your camera will open when you click "SCAN FACE"
            </Text>
          </View>
        )}
        
        {/* Scan Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={handleScanFace}
            disabled={loading || cameraVisible}
          >
            <Ionicons name="scan" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>
              {cameraVisible ? "SCANNING..." : 
               loading ? "PROCESSING..." : 
               "SCAN FACE FOR MOOD"}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.scanNote}>
            {cameraVisible 
              ? "Camera is open - Look at the camera" 
              : "Click to open camera and scan"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Camera Modal Styles
  cameraModalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#000",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#1DB954",
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#1DB954",
    borderTopRightRadius: 10,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#1DB954",
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#1DB954",
    borderBottomRightRadius: 10,
  },
  scanGuide: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 280,
    textAlign: "center",
  },
  captureButton: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
  },
  captureInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  // Main Content Styles
  contentContainer: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  title: {
    color: "#1DB954",
    fontSize: 28,
    fontWeight: "bold",
  },
  testButton: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  testText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  emotionDisplay: {
    backgroundColor: "#181818",
    padding: 20,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
    borderWidth: 2,
    borderColor: "#1DB954",
  },
  emotionLabel: {
    color: "#aaa",
    fontSize: 14,
  },
  emotionValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  emotionIcon: {
    backgroundColor: "#333",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  emotionEmoji: {
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 20,
  },
  songsList: {
    flex: 1,
    marginBottom: 20,
  },
  songsTitle: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // Song Card Styles
  songCard: {
    backgroundColor: "#181818",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playingCard: {
    backgroundColor: "#222",
    borderLeftWidth: 4,
    borderLeftColor: "#1DB954",
  },
  songInfo: {
    flex: 1,
    marginRight: 15,
  },
  songTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  songArtist: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  songMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  songScore: {
    color: "#1DB954",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 15,
  },
  songEmoji: {
    fontSize: 16,
  },
  playButton: {
    backgroundColor: "#1DB954",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  playingButton: {
    backgroundColor: "#FFA500",
  },
  playText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 30,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
  footer: {
    marginTop: 'auto',
  },
  scanButton: {
    backgroundColor: "#1DB954",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 25,
    marginBottom: 10,
  },
  scanButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 10,
  },
  scanNote: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: {
    color: "#fff",
    fontSize: 16,
  },
  permissionBtn: {
    backgroundColor: "#1DB954",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  permissionText: {
    color: "#fff",
    fontWeight: "bold",
  },
});