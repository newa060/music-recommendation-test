from pymongo import MongoClient

try:
    # 👇 Replace this line with your own Atlas connection string
    uri = "mongodb+srv://binodstha060:tribalrain060@newaapi.m9cgmkj.mongodb.net/?appName=NewaAPI"

    # Connect to MongoDB Atlas
    client = MongoClient(uri)

    # Check connection
    print("✅ Connected to MongoDB Atlas!")

    # List databases
    print("📚 Databases available:")
    print(client.list_database_names())

    # Select your database and collection
    db = client["test"]         # 👈 change to your database name
    collection = db["songs"]    # 👈 your collection name

    # Count documents
    count = collection.count_documents({})
    print(f"📦 Documents in 'songs': {count}")

    # Show one document
    if count > 0:
        print("🧾 Sample document:")
        print(collection.find_one())

except Exception as e:
    print("❌ Connection failed!")
    print("Error:", e)
