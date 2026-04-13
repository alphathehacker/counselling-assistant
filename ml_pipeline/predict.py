"""
Prediction module: create synthetic Year=2026 dataset, predict Closing_Rank
for all unique (Institute, Program, Seat_Type, Gender, Round) combinations.
Output uses original (inverse-transformed) column values for readability.
"""
import pandas as pd
import numpy as np

from config import PREDICT_YEAR


def get_prediction_input(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create synthetic Year=2026 dataset: unique combinations of
    Institute, Institute_Type, Program, Seat_Type, Gender, Round from last year in df.
    """
    year_col = "Year" if "Year" in df.columns else "year"
    df_last = df[df[year_col] == df[year_col].max()]
    cols = ["Institute", "Institute_Type", "Program", "Seat_Type", "Gender", "Round"]
    cols = [c for c in cols if c in df_last.columns]
    pred_input = df_last[cols].drop_duplicates().copy()
    pred_input["Year"] = PREDICT_YEAR
    return pred_input


def predict_2026(
    model,
    feature_engineer,
    train_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Predict Closing_Rank for 2026 for all unique combinations.
    Encoded columns are used only for model input; output DataFrame contains
    original (inverse-transformed) Institute, Program, Seat_Type, Gender, Round.

    Returns:
        DataFrame with columns:
          Institute, Program, Seat_Type, Gender, Round, Predicted_Closing_Rank_2026
    """
    pred_input = get_prediction_input(train_df)
    X_pred = feature_engineer.transform(pred_input)
    fnames = feature_engineer.get_feature_names()
    X_pred = X_pred[[c for c in fnames if c in X_pred.columns]].fillna(0)

    preds = model.predict(X_pred)
    preds = np.clip(preds, 1, None)

    # Output with original (unencoded) labels — no inverse transform needed
    # because pred_input already holds the raw categorical values
    out = pred_input[["Institute", "Program", "Seat_Type", "Gender", "Round"]].copy()
    out["Predicted_Closing_Rank_2026"] = preds.astype(int)
    return out
