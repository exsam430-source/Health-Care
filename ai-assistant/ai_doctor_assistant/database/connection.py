"""
MongoDB Connection Manager
Handles connection with fallback to in-memory storage
"""

import os
import sys
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


# ─────────────────────────────────────────────────────────
# IN-MEMORY COLLECTION
# ─────────────────────────────────────────────────────────

class InMemoryCollection:
    """Simulates a MongoDB collection in memory"""

    def __init__(self, name):
        self.name = name
        self._documents = []
        self._id_counter = 1

    def insert_one(self, document):
        doc = document.copy()
        doc['_id'] = f"mem_{self.name}_{self._id_counter}"
        if 'created_at' not in doc:
            doc['created_at'] = datetime.now()
        self._id_counter += 1
        self._documents.append(doc)

        class InsertResult:
            pass

        result = InsertResult()
        result.inserted_id = doc['_id']
        return result

    def find_one(self, query=None):
        if not query:
            return self._documents[0] if self._documents else None
        for doc in self._documents:
            if self._matches(doc, query):
                return doc
        return None

    def find(self, query=None):
        if not query:
            return list(self._documents)
        return [d for d in self._documents if self._matches(d, query)]

    def update_one(self, query, update):
        for i, doc in enumerate(self._documents):
            if self._matches(doc, query):
                if '$set' in update:
                    self._documents[i].update(update['$set'])
                if '$inc' in update:
                    for key, val in update['$inc'].items():
                        self._documents[i][key] = (
                            self._documents[i].get(key, 0) + val
                        )
                return

    def update_many(self, query, update):
        for i, doc in enumerate(self._documents):
            if self._matches(doc, query):
                if '$set' in update:
                    self._documents[i].update(update['$set'])

    def delete_one(self, query):
        for i, doc in enumerate(self._documents):
            if self._matches(doc, query):
                self._documents.pop(i)
                return

    def count_documents(self, query=None):
        if not query:
            return len(self._documents)
        return len([d for d in self._documents if self._matches(d, query)])

    def create_index(self, *args, **kwargs):
        pass  # No-op for in-memory

    def _matches(self, document, query):
        for key, value in query.items():
            if key == '$ne':
                continue
            doc_val = document.get(key)

            # Handle nested operators
            if isinstance(value, dict):
                if '$ne' in value:
                    if doc_val == value['$ne']:
                        return False
                elif '$in' in value:
                    if doc_val not in value['$in']:
                        return False
                elif '$gt' in value:
                    if not (doc_val and doc_val > value['$gt']):
                        return False
                elif '$lt' in value:
                    if not (doc_val and doc_val < value['$lt']):
                        return False
            else:
                if doc_val != value:
                    return False
        return True


# ─────────────────────────────────────────────────────────
# IN-MEMORY DATABASE
# ─────────────────────────────────────────────────────────

class InMemoryDB:
    """
    Fallback in-memory database when MongoDB is not available
    """

    def __init__(self):
        self._collections = {}
        print("   ⚠️  Using In-Memory database (MongoDB not available)")
        print("   ⚠️  Data will be lost when server restarts")
        print("   ℹ️  Install MongoDB for persistent storage")

    def __getattr__(self, collection_name):
        if collection_name.startswith('_'):
            raise AttributeError(collection_name)
        if collection_name not in self._collections:
            self._collections[collection_name] = InMemoryCollection(
                collection_name
            )
        return self._collections[collection_name]

    def __getitem__(self, collection_name):
        return self.__getattr__(collection_name)


# ─────────────────────────────────────────────────────────
# DATABASE CONNECTION — SIMPLE SINGLETON
# ─────────────────────────────────────────────────────────

# Single global instance — created once
_db_instance = None


def get_db():
    """
    Get database instance
    Tries MongoDB first, falls back to in-memory
    Called from anywhere in the app
    """
    global _db_instance

    if _db_instance is not None:
        return _db_instance

    # Try MongoDB
    try:
        from pymongo import MongoClient
        from pymongo.errors import ServerSelectionTimeoutError

        client = MongoClient(
            Config.MONGO_URI,
            serverSelectionTimeoutMS=3000
        )

        # Test the connection
        client.server_info()

        db = client[Config.MONGO_DB_NAME]

        # Create indexes for performance
        _create_indexes(db)

        print(f"   ✅ MongoDB connected: {Config.MONGO_DB_NAME}")
        _db_instance = db
        return _db_instance

    except Exception as e:
        error_msg = str(e)[:60]
        print(f"   ⚠️  MongoDB not available: {error_msg}")
        _db_instance = InMemoryDB()
        return _db_instance


def _create_indexes(db):
    """Create MongoDB indexes for better performance"""
    try:
        db.comparisons.create_index([
            ("patient_id", 1),
            ("appointment_id", 1)
        ])
        db.ai_predictions.create_index([
            ("patient_id", 1)
        ])
        db.symptom_sessions.create_index([
            ("patient_id", 1),
            ("appointment_id", 1)
        ])
        db.patient_profiles.create_index(
            [("patient_id", 1)],
            unique=True
        )
    except Exception:
        pass  # Indexes are optional


def reset_db():
    """
    Reset database connection
    Useful for testing
    """
    global _db_instance
    _db_instance = None
    print("   🔄 Database connection reset")