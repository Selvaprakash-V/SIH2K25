#!/usr/bin/env python3
"""
Example fetch/display queries from MongoDB for Sikkim excel-ingested data.

Run examples:
  python fetch_sikkim_from_mongo.py --limit 5
  python fetch_sikkim_from_mongo.py --district "East Sikkim" --limit 10
  python fetch_sikkim_from_mongo.py --search-village "gangtok"
"""

import argparse
import os
from pprint import pprint
from dotenv import load_dotenv
from pymongo import MongoClient

COLLECTION = "sikkim_villages_raw"


def get_db():
    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = MongoClient(mongo_uri)
    return client["ruraliq"], client


def list_districts(db):
    return db[COLLECTION].distinct("district_name")


def query_examples(db, args):
    coll = db[COLLECTION]

    q = {}
    if args.district:
        q["district_name"] = args.district
    if args.search_village:
        q["village_name"] = {"$regex": args.search_village, "$options": "i"}

    projection = None  # full documents

    print(f"Query: {q or '{}'} | Limit: {args.limit}")
    for doc in coll.find(q, projection).limit(args.limit):
        pprint(doc)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--district", help="Filter by district name", default=None)
    parser.add_argument("--search-village", help="Case-insensitive regex for village_name", default=None)
    parser.add_argument("--limit", type=int, default=5)
    args = parser.parse_args()

    db, client = get_db()
    try:
        print("Available districts:", list_districts(db))
        query_examples(db, args)
    finally:
        client.close()
