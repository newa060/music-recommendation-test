from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import random
import datetime

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
try:
    client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=3000)
    db = client["musicDB"]
    songs_collection = db["songs"]
    print("✅ MongoDB connected successfully")
    
    # Check if we have songs
    total_songs = songs_collection.count_documents({})
    print(f"📊 Total songs in database: {total_songs}")
    
except Exception as e:
    print(f"❌ MongoDB error: {e}")
    songs_collection = None

# Store session history in memory
session_history = {}

@app.route("/api/working-scan", methods=["POST"])
def working_scan():
    """Working API that returns DIFFERENT songs each time"""
    
    try:
        data = request.get_json()
        session_id = data.get("session_id", "default")
        
        # Get random emotion
        emotions = ["happy", "sad", "neutral"]
        emotion = random.choice(emotions)
        
        print(f"\n🎭 Session {session_id[:8]}... - Emotion: {emotion}")
        
        # Check MongoDB connection
        if songs_collection is None:
            return jsonify({
                "success": False,
                "error": "MongoDB not connected",
                "emotion": emotion,
                "songs": []
            }), 200
        
        # Get ALL songs with this emotion
        query = {"song_emotion": emotion}
        all_songs = list(songs_collection.find(query))
        
        print(f"📝 Found {len(all_songs)} songs with emotion '{emotion}'")
        
        # If we have songs with this emotion
        if all_songs:
            # Get previously shown songs for this session
            shown_songs = session_history.get(session_id, [])
            
            # Filter out already shown songs
            available_songs = [song for song in all_songs 
                              if str(song.get("_id", "")) not in shown_songs]
            
            print(f"📊 Available (not shown): {len(available_songs)} / Shown before: {len(shown_songs)}")
            
            # If we have enough new songs, use them
            if len(available_songs) >= 5:
                selected_songs = random.sample(available_songs, min(5, len(available_songs)))
            else:
                # Mix some new and some old songs
                if available_songs:
                    selected_songs = available_songs[:min(3, len(available_songs))]
                    # Add some previously shown songs to make 5
                    needed = 5 - len(selected_songs)
                    if shown_songs and needed > 0:
                        # Get song objects from IDs
                        shown_song_objects = []
                        for song_id in shown_songs[-10:]:  # Last 10 shown
                            try:
                                song = songs_collection.find_one({"_id": ObjectId(song_id)})
                                if song and song not in selected_songs:
                                    shown_song_objects.append(song)
                            except:
                                pass
                        
                        if shown_song_objects:
                            selected_songs.extend(random.sample(shown_song_objects, 
                                                              min(needed, len(shown_song_objects))))
                else:
                    # No new songs, shuffle all songs
                    selected_songs = random.sample(all_songs, min(5, len(all_songs)))
            
            # Update session history
            new_song_ids = [str(song.get("_id", "")) for song in selected_songs]
            if session_id not in session_history:
                session_history[session_id] = []
            session_history[session_id].extend(new_song_ids)
            
            # Keep only last 20 songs per session
            session_history[session_id] = session_history[session_id][-20:]
            
        else:
            # No songs with this emotion, get any songs
            print(f"⚠️ No songs for '{emotion}', getting random songs")
            all_random_songs = list(songs_collection.find().limit(50))
            selected_songs = random.sample(all_random_songs, min(5, len(all_random_songs)))
        
        # SHUFFLE the selected songs for extra randomness
        random.shuffle(selected_songs)
        
        # Format songs for frontend
        result_songs = []
        for i, song in enumerate(selected_songs[:5]):  # Max 5 songs
            song_id = str(song.get("_id", f"song_{i}"))
            filename = song.get("filename", "")
            
            if not filename:
                title = song.get("title", f"Song_{i}")
                filename = f"{title.replace(' ', '_').replace('.', '_')}.mp3"
            
            # Calculate score with randomness
            base_score = random.uniform(0.7, 0.95)
            # Adjust score based on features
            if emotion == "happy":
                score = (song.get("valence", 0.5) * 0.4 + 
                        song.get("energy", 0.5) * 0.4 + 
                        song.get("danceability", 0.5) * 0.2)
            elif emotion == "sad":
                score = ((1 - song.get("valence", 0.5)) * 0.5 + 
                        (1 - song.get("energy", 0.5)) * 0.3 + 
                        song.get("acousticness", 0.5) * 0.2)
            else:  # neutral
                score = 0.5 + random.uniform(-0.2, 0.2)
            
            # Add some random variation
            final_score = max(0.1, min(0.99, score + random.uniform(-0.1, 0.1)))
            
            result_songs.append({
                "id": song_id,
                "title": song.get("title", f"Song {i+1}"),
                "artist": "Artist",
                "score": round(final_score, 3),
                "emotion": song.get("song_emotion", emotion),
                "filename": filename,
                "audio_url": f"http://192.168.18.240:3000/api/audio/play/{filename}",
                "features": {
                    "danceability": round(song.get("danceability", 0), 2),
                    "energy": round(song.get("energy", 0), 2),
                    "valence": round(song.get("valence", 0), 2),
                }
            })
        
        print(f"✅ Returning {len(result_songs)} SHUFFLED songs")
        for song in result_songs:
            print(f"   🎵 {song['title']} (score: {song['score']})")
        
        return jsonify({
            "success": True,
            "emotion": emotion,
            "songs": result_songs,
            "session_id": session_id,
            "total_songs_in_db": songs_collection.count_documents({}),
            "message": f"Found {len(result_songs)} songs for {emotion} mood"
        }), 200
        
    except Exception as e:
        print(f"❌ API Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e),
            "emotion": "neutral",
            "songs": []
        }), 500

@app.route("/api/reset-session/<session_id>", methods=["GET"])
def reset_session(session_id):
    """Reset song history for a session"""
    if session_id in session_history:
        session_history[session_id] = []
        return jsonify({
            "success": True,
            "message": f"Session {session_id[:8]}... history cleared"
        }), 200
    return jsonify({
        "success": False,
        "message": "Session not found"
    }), 404

@app.route("/api/get-songs/<emotion>", methods=["GET"])
def get_songs_by_emotion(emotion):
    """Get all songs for an emotion (for testing)"""
    try:
        if songs_collection is None:
            return jsonify({"error": "MongoDB not connected"}), 500
        
        songs = list(songs_collection.find({"song_emotion": emotion}))
        
        return jsonify({
            "success": True,
            "emotion": emotion,
            "total_songs": len(songs),
            "song_titles": [s.get("title", "Unknown") for s in songs[:20]]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/test", methods=["GET"])
def test_api():
    """Test endpoint"""
    stats = {
        "status": "online",
        "timestamp": datetime.datetime.now().isoformat(),
        "mongo_connected": songs_collection is not None,
        "total_songs": songs_collection.count_documents({}) if songs_collection else 0,
        "active_sessions": len(session_history),
        "emotions": {
            "happy": songs_collection.count_documents({"song_emotion": "happy"}) if songs_collection else 0,
            "sad": songs_collection.count_documents({"song_emotion": "sad"}) if songs_collection else 0,
            "neutral": songs_collection.count_documents({"song_emotion": "neutral"}) if songs_collection else 0,
        }
    }
    return jsonify(stats), 200

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🎵 WORKING AUDIO API WITH SHUFFLING")
    print("="*60)
    print("📡 Endpoints:")
    print("   POST /api/working-scan     - Get DIFFERENT songs each time")
    print("   GET  /api/reset-session/<id> - Reset session history")
    print("   GET  /api/get-songs/<emo>  - Get songs by emotion")
    print("   GET  /api/test             - Test API status")
    print("="*60)
    
    if songs_collection is not None:
        # Count songs by emotion
        print("📊 Songs by emotion:")
        for emotion in ["happy", "sad", "neutral"]:
            count = songs_collection.count_documents({"song_emotion": emotion})
            print(f"   {emotion}: {count} songs")
        
        # Show sample songs
        print("\n🎵 Sample songs:")
        for emotion in ["happy", "sad", "neutral"]:
            sample = songs_collection.find_one({"song_emotion": emotion})
            if sample:
                print(f"   {emotion}: {sample.get('title', 'Unknown')}")
    
    app.run(host="0.0.0.0", port=5000, debug=True)