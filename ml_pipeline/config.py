"""
Configuration for Closing Rank Prediction ML Pipeline.
Defines file paths, feature/target columns, model hyperparameters, and random_state.
"""
from pathlib import Path

# -----------------------------------------------------------------------------
# File paths
# -----------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "output"
DEFAULT_DATA_PATH = DATA_DIR / "historical_closing_ranks.csv"
OUTPUT_CSV = OUTPUT_DIR / "predicted_2026_closing_rank.csv"

# -----------------------------------------------------------------------------
# Schema: feature and target columns
# -----------------------------------------------------------------------------
REQUIRED_COLUMNS = [
    "Institute",
    "Institute_Type",
    "Program",
    "Seat_Type",
    "Gender",
    "Year",
    "Round",
    "Closing_Rank",
]

FEATURE_COLUMNS = [
    "Institute",
    "Institute_Type",
    "Program",
    "Seat_Type",
    "Gender",
    "Year",
    "Round",
]

# Categorical columns to LabelEncode (Year is numeric)
CATEGORICAL_COLUMNS = [
    "Institute",
    "Institute_Type",
    "Program",
    "Seat_Type",
    "Gender",
    "Round",
]

TARGET_COLUMN = "Closing_Rank"
TIME_COLUMN = "Year"

# -----------------------------------------------------------------------------
# Time bounds
# -----------------------------------------------------------------------------
TRAIN_END_YEAR = 2025
PREDICT_YEAR = 2026
VAL_YEAR = 2025  # Validate on this year (time-aware: train on Year < VAL_YEAR)

# Minimum number of years of data to enable XGBoost/LightGBM (optional)
MIN_YEARS_FOR_BOOSTED = 4

# -----------------------------------------------------------------------------
# Reproducibility
# -----------------------------------------------------------------------------
RANDOM_STATE = 42

# -----------------------------------------------------------------------------
# Model hyperparameters (prevent overfitting: limit depth, min_samples)
# -----------------------------------------------------------------------------
MODEL_PARAMS = {
    "linear_regression": {},
    "random_forest": {
        "n_estimators": 100,
        "max_depth": 15,
        "min_samples_leaf": 5,
        "min_samples_split": 10,
        "random_state": RANDOM_STATE,
    },
    "gradient_boosting": {
        "n_estimators": 100,
        "max_depth": 5,
        "learning_rate": 0.1,
        "min_samples_leaf": 10,
        "min_samples_split": 20,
        "subsample": 0.8,
        "random_state": RANDOM_STATE,
    },
    # Optional: used only when years >= MIN_YEARS_FOR_BOOSTED
    "xgboost": {
        "n_estimators": 100,
        "max_depth": 5,
        "learning_rate": 0.1,
        "min_child_weight": 10,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "random_state": RANDOM_STATE,
    },
    "lightgbm": {
        "n_estimators": 100,
        "max_depth": 5,
        "learning_rate": 0.1,
        "min_child_samples": 20,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "random_state": RANDOM_STATE,
        "verbosity": -1,
    },
}
