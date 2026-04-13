"""
Data loader for closing rank datasets.
Loads CSV files, validates required columns, handles missing values, combines multiple yearly datasets.
Returns a clean DataFrame in target schema.
"""
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Union, Tuple, List

from config import (
    REQUIRED_COLUMNS,
    TARGET_COLUMN,
    TRAIN_END_YEAR,
    DEFAULT_DATA_PATH,
)


# Aliases accepted for column names (lowercase key -> canonical name)
COLUMN_ALIASES = {
    "institute": "Institute",
    "institute name": "Institute",
    "institute_type": "Institute_Type",
    "institute_group": "Institute_Type",
    "institute group": "Institute_Type",
    "program": "Program",
    "branch": "Program",
    "academic program name": "Program",
    "seat_type": "Seat_Type",
    "quota": "Seat_Type",
    "category": "Seat_Type",
    "gender": "Gender",
    "year": "Year",
    "round": "Round",
    "closing_rank": "Closing_Rank",
    "closing rank": "Closing_Rank",
    "cutoff_rank": "Closing_Rank",
}


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names and map aliases to required schema names."""
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]
    rename = {}
    for col in df.columns:
        key = col.lower().strip()
        if key in COLUMN_ALIASES:
            rename[col] = COLUMN_ALIASES[key]
    if rename:
        df = df.rename(columns=rename)
    return df


def validate_required_columns(df: pd.DataFrame) -> List[str]:
    """
    Validate that DataFrame has all required columns.
    Returns list of missing column names (empty if valid).
    """
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    return missing


def load_data(
    path: Union[str, Path] = None,
    encoding: str = "utf-8",
) -> pd.DataFrame:
    """
    Load closing rank data from CSV file(s).
    If path is a directory, loads and concatenates all CSV files (combine multiple yearly datasets).
    Handles missing values safely by dropping rows with missing target; optional imputation for features.

    Args:
        path: File path, directory path, or None for default DATA_DIR / historical_closing_ranks.csv
        encoding: File encoding

    Returns:
        Clean DataFrame with target schema columns (after alias mapping).
    """
    if path is None:
        path = DEFAULT_DATA_PATH
    path = Path(path)

    if path.is_file():
        files = [path]
    else:
        files = sorted(path.glob("*.csv"))

    if not files:
        raise FileNotFoundError(f"No CSV files found at {path}")

    dfs = []
    for f in files:
        df = pd.read_csv(f, encoding=encoding, low_memory=False)
        df = _normalize_columns(df)
        missing = validate_required_columns(df)
        if missing:
            raise ValueError(
                f"File {f.name} is missing required columns: {missing}. "
                f"Required: {REQUIRED_COLUMNS}"
            )
        dfs.append(df)

    df = pd.concat(dfs, ignore_index=True)
    return df


def handle_missing_values(
    df: pd.DataFrame,
    target_col: str = TARGET_COLUMN,
    strategy: str = "drop",
) -> pd.DataFrame:
    """
    Handle missing values safely.
    - Always drops rows with missing or invalid Closing_Rank.
    - strategy 'drop': drop rows with any missing feature.
    - strategy 'median': impute numeric with median, object with 'Unknown'.
    """
    df = df.copy()
    # Target: drop missing or non-positive
    df = df.dropna(subset=[target_col])
    df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
    df = df[df[target_col].notna() & (df[target_col] > 0)]

    if strategy == "drop":
        df = df.dropna()
    elif strategy == "median":
        for col in df.select_dtypes(include=[np.number]).columns:
            if col != target_col and df[col].isna().any():
                df[col] = df[col].fillna(df[col].median())
        for col in df.select_dtypes(include=["object"]).columns:
            df[col] = df[col].fillna("Unknown")
    return df


def prepare_data(
    df: pd.DataFrame,
    train_end_year: int = TRAIN_END_YEAR,
    handle_missing: str = "drop",
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Prepare features X and target y for modeling.
    Filters to train_end_year, validates schema, handles missing values.

    Returns:
        (X, y): X has feature columns only, y is Closing_Rank.
    """
    year_col = "Year" if "Year" in df.columns else "year"
    if year_col not in df.columns:
        raise ValueError("Data must contain 'Year' column")
    df = df[df[year_col] <= train_end_year].copy()

    target_col = TARGET_COLUMN if TARGET_COLUMN in df.columns else "Closing_Rank"
    if target_col not in df.columns:
        raise ValueError(f"Data must contain '{target_col}'")

    df = handle_missing_values(df, target_col=target_col, strategy=handle_missing)
    X = df.drop(columns=[target_col])
    y = df[target_col]
    return X, y
