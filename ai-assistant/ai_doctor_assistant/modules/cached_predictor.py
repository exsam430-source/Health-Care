# Add to requirements.txt:
# cachetools==5.3.2

# modules/cached_predictor.py

from cachetools import TTLCache, cached
import hashlib

# Cache stores up to 500 results for 1 hour
prediction_cache = TTLCache(maxsize=500, ttl=3600)


def get_cache_key(symptoms: list) -> str:
    """Create unique cache key from symptoms"""
    sorted_symptoms = sorted(symptoms)
    key_str = ','.join(sorted_symptoms)
    return hashlib.md5(key_str.encode()).hexdigest()


def predict_with_cache(predictor, symptoms: list) -> dict:
    """
    Get prediction with caching
    Same symptoms = instant response from cache
    """
    cache_key = get_cache_key(symptoms)

    if cache_key in prediction_cache:
        result = prediction_cache[cache_key].copy()
        result['from_cache'] = True
        return result

    result = predictor.predict(symptoms)
    prediction_cache[cache_key] = result.copy()
    result['from_cache'] = False
    return result