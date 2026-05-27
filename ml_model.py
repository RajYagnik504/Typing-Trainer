import os
import random

# Global variables for the ML model
_rf_model = None
_model_available = False

try:
    import numpy as np
    from sklearn.ensemble import RandomForestClassifier
    _model_available = True
except ImportError:
    pass

def train_mock_model():
    """
    Generates a synthetic dataset and trains a RandomForestClassifier to classify typing skill.
    Features: [wpm, accuracy, rhythm_score]
    Target labels: 
      0: Beginner
      1: Intermediate
      2: Advanced
      3: Expert
    """
    global _rf_model, _model_available
    
    if not _model_available:
        return
        
    try:
        # Generate synthetic data
        np.random.seed(42)
        X = []
        y = []
        
        # 200 samples
        for _ in range(200):
            # Features: wpm, accuracy, rhythm_score
            wpm = np.random.uniform(5, 110)
            accuracy = np.random.uniform(60, 100)
            rhythm_score = np.random.uniform(40, 100)
            
            # Label heuristic
            score = (wpm * 0.5) + ((accuracy - 60) * 0.8) + ((rhythm_score - 40) * 0.4)
            
            if score < 25:
                label = 0  # Beginner
            elif score < 50:
                label = 1  # Intermediate
            elif score < 75:
                label = 2  # Advanced
            else:
                label = 3  # Expert
                
            X.append([wpm, accuracy, rhythm_score])
            y.append(label)
            
        X = np.array(X)
        y = np.array(y)
        
        _rf_model = RandomForestClassifier(n_estimators=50, random_state=42)
        _rf_model.fit(X, y)
    except Exception:
        # Fallback if any training error occurs
        _rf_model = None

def predict_skill_level(wpm, accuracy, rhythm_score):
    """
    Predicts the student's typing level badge using the trained Random Forest model.
    Falls back to a robust rule-based logic if ML is unavailable.
    """
    global _rf_model
    
    label_map = {
        0: "Beginner",
        1: "Intermediate",
        2: "Advanced",
        3: "Expert"
    }
    
    # Try using Random Forest
    if _rf_model is not None:
        try:
            pred = _rf_model.predict([[wpm, accuracy, rhythm_score]])[0]
            return label_map[pred]
        except Exception:
            pass
            
    # Deterministic Rule-Based Fallback Classifier
    # Calculates a weighted composite metric
    norm_wpm = min(wpm / 100.0, 1.0)
    norm_acc = min(max((accuracy - 50.0) / 50.0, 0.0), 1.0)
    norm_rhy = min(rhythm_score / 100.0, 1.0)
    
    composite_score = (norm_wpm * 0.5) + (norm_acc * 0.3) + (norm_rhy * 0.2)
    
    if composite_score < 0.3 or wpm < 25:
        return "Beginner"
    elif composite_score < 0.55 or wpm < 45:
        return "Intermediate"
    elif composite_score < 0.8 or wpm < 70:
        return "Advanced"
    else:
        return "Expert"

# Train the model on load if possible
train_mock_model()
