import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function FaceDetection() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [songs, setSongs] = useState([]);

  const handleScan = async () => {
    if (!cameraRef.current || loading) return;

    try {
      setLoading(true);
      setEmotion(null);
      setSongs([]);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: true,
      });

      await cameraRef.current.resumePreview();

      const response = await fetch(
        "http://192.168.18.240:5000/api/scan-face",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: photo.base64.replace(/\s/g, ""),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setEmotion(data.emotion);
      setSongs(data.songs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Permission loading
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading camera permissions…</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission required</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />

      {/* Spotify-style Player */}
      <View style={styles.player}>
        {/* Emotion / Playlist title */}
        <Text style={styles.playlistTitle}>
          {emotion ? `${emotion.toUpperCase()} VIBES` : "MOOD PLAYER"}
        </Text>

        {/* Loader */}
        {loading && (
          <ActivityIndicator
            size="small"
            color="#1DB954"
            style={{ marginVertical: 10 }}
          />
        )}

        {/* Song List */}
        {!loading && songs.length > 0 && (
          <FlatList
            data={songs}
            keyExtractor={(_, i) => i.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={styles.songRow}>
                <Text style={styles.trackNumber}>{index + 1}</Text>
                <Text style={styles.songTitle}>{item.title}</Text>
              </View>
            )}
          />
        )}

        {/* No songs */}
        {!loading && emotion && songs.length === 0 && (
          <Text style={styles.noSongs}>No songs found</Text>
        )}

        {/* Scan Button */}
        <View style={styles.buttonWrapper}>
          <Button
            title={loading ? "Scanning..." : "Scan Face"}
            onPress={handleScan}
            disabled={loading}
            color="#1DB954"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },

  /* Player */
  player: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: height * 0.38,
    backgroundColor: "#121212",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },

  playlistTitle: {
    color: "#1DB954",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 1,
  },

  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  trackNumber: {
    color: "#777",
    width: 24,
    fontSize: 14,
  },

  songTitle: {
    color: "#fff",
    fontSize: 16,
  },

  noSongs: {
    color: "#aaa",
    marginTop: 10,
    textAlign: "center",
  },

  buttonWrapper: {
    marginTop: 12,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },

  text: { color: "#fff" },
});
