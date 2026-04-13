"""
Main ML Pipeline: Load → Feature Engineering → Train → Evaluate → Select Best
→ Predict 2026 → Export CSV.

Usage:
  python main.py
  python main.py --data data/historical_closing_ranks.csv --output output/predicted_2026_closing_rank.csv
"""
import argparse
from pathlib import Path

import pandas as pd
import numpy as np

from config import (
    BASE_DIR,
    OUTPUT_DIR,
    OUTPUT_CSV,
    DEFAULT_DATA_PATH,
    TRAIN_END_YEAR,
    VAL_YEAR,
    TIME_COLUMN,
    MIN_YEARS_FOR_BOOSTED,
)
from data_loader import load_data, prepare_data, validate_required_columns
from feature_engineering import FeatureEngineer
from evaluate import run_evaluation
from predict import predict_2026


def run_pipeline(
    data_path: str = None,
    output_path: str = None,
) -> pd.DataFrame:
    """
    Orchestrate full pipeline and export predicted_2026_closing_rank.csv.
    """
    # --- 1. Load ---
    if data_path is None:
        data_path = str(DEFAULT_DATA_PATH)
    if not Path(data_path).exists() and data_path == str(DEFAULT_DATA_PATH):
        print("No data file found. Generating sample data...")
        from generate_sample_data import generate_sample_data
        generate_sample_data()
        data_path = str(DEFAULT_DATA_PATH)

    print(f"Loading data from {data_path}")
    df = load_data(data_path)
    missing = validate_required_columns(df)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    df = df[df["Year"] <= TRAIN_END_YEAR]
    n_years = df["Year"].nunique()
    print(f"Training data: {len(df)} rows, years {df['Year'].min()}-{df['Year'].max()} ({n_years} years)")

    # --- 2. Prepare X, y ---
    X_df, y = prepare_data(df, train_end_year=TRAIN_END_YEAR, handle_missing="drop")
    X_df["Year"] = df.loc[X_df.index, "Year"]

    # --- 3. Feature engineering (encoders stored on fe) ---
    fe = FeatureEngineer()
    X_encoded = fe.fit_transform(X_df)
    feature_names = fe.get_feature_names()

    # --- 4. Evaluate: time-aware split, metrics, best model by R² ---
    include_boosted = n_years >= MIN_YEARS_FOR_BOOSTED
    if include_boosted:
        print(f"\nIncluding XGBoost/LightGBM (data has {n_years} years >= {MIN_YEARS_FOR_BOOSTED})")
    best_model, best_name, results, _ = run_evaluation(
        X_encoded, y, feature_names, include_boosted=include_boosted
    )

    # --- 5. Retrain best model on full data (train + val) ---
    from evaluate import time_aware_split
    X_train, X_val, y_train, y_val = time_aware_split(X_encoded, y, val_year=VAL_YEAR)
    X_full = np.vstack([X_train, X_val])
    y_full = np.concatenate([y_train, y_val])
    best_model.fit(X_full, y_full)

    # --- 6. Predict 2026 ---
    train_df = df.loc[X_df.index].copy()
    pred_df = predict_2026(best_model, fe, train_df)

    # --- 7. Export ---
    out_file = Path(output_path) if output_path else OUTPUT_CSV
    out_file.parent.mkdir(parents=True, exist_ok=True)
    pred_df.to_csv(out_file, index=False)
    print(f"\nExported {len(pred_df)} predictions to {out_file}")

    metrics_path = OUTPUT_DIR / "model_comparison.csv"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(results).to_csv(metrics_path, index=False)
    print(f"Model comparison saved to {metrics_path}")

    return pred_df


def main():
    parser = argparse.ArgumentParser(
        description="Closing Rank Prediction ML Pipeline"
    )
    parser.add_argument(
        "--data", "-d",
        type=str,
        default=None,
        help="Path to CSV or directory of CSVs (target schema)",
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=None,
        help="Output path for predicted_2026_closing_rank.csv",
    )
    args = parser.parse_args()
    run_pipeline(data_path=args.data, output_path=args.output)


if __name__ == "__main__":
    main()
