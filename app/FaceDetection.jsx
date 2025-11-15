import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function FaceDetection() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [songs, setSongs] = useState([]);
  const cameraRef = useRef(null);

  // Simulate face detection
  useEffect(() => {
    let detectionInterval;
    if (permission?.granted) {
      detectionInterval = setInterval(() => {
        const faceDetected = Math.random() > 0.2;
        setIsFaceDetected(faceDetected);
      }, 1500);
    }
    return () => {
      if (detectionInterval) clearInterval(detectionInterval);
    };
  }, [permission]);

  const handleScan = async () => {
    if (!cameraRef.current) return;

    try {
      setIsLoading(true);
      setSongs([]);

      // Capture image
      const photo = await cameraRef.current.takePictureAsync({ base64: true });

      // Send image to backend
      const response = await fetch("http://192.168.0.227/api/scan-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo.base64 }),
      });

      const data = await response.json();

      if (data.songs) {
        setSongs(data.songs);
      } else {
        alert("No recommendations found.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to scan image or connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Loading permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>We need your permission to use the camera</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      />

      {/* Face detection guide */}
      <View style={styles.faceGuide}>
        <View
          style={[
            styles.faceCircle,
            isFaceDetected ? styles.faceCircleActive : styles.faceCircleInactive,
          ]}
        />
        <Text style={styles.guideText}>
          {isFaceDetected
            ? "Face detected! ✓"
            : "Position your face in the circle"}
        </Text>
      </View>

      {/* Scan button */}
      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? "Scanning..." : "Scan Face"}
          onPress={handleScan}
          disabled={!isFaceDetected || isLoading}
          color={isFaceDetected ? "#4CAF50" : "#777"}
        />
      </View>

      {/* Loader or results */}
      <View style={styles.resultsContainer}>
        {isLoading && <ActivityIndicator size="large" color="#fff" />}
        {!isLoading && songs.length > 0 && (
          <>
            <Text style={styles.resultTitle}>🎵 Recommended Songs</Text>
            <FlatList
              data={songs}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.songItem}>
                  <Text style={styles.songTitle}>{item.title}</Text>
                  <Text style={styles.songArtist}>{item.artist}</Text>
                </View>
              )}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  faceGuide: {
    position: "absolute",
    top: "15%",
    left: "10%",
    right: "10%",
    alignItems: "center",
  },
  faceCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderStyle: "dashed",
  },
  faceCircleActive: {
    borderColor: "#4CAF50",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  faceCircleInactive: {
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  guideText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  resultsContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  resultTitle: {
    color: "#4CAF50",
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "bold",
  },
  songItem: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    width: width * 0.9,
  },
  songTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  songArtist: {
    color: "#bbb",
    fontSize: 14,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
