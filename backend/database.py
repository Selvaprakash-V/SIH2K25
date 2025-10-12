from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

client = None
database = None

async def connect_to_mongo():
    global client, database
    client = AsyncIOMotorClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
    database = client.ruraliq

async def close_mongo_connection():
    global client
    if client:
        client.close()

async def get_database():
    global database
    if database is None:
        await connect_to_mongo()
    return database