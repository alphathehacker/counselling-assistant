"""
Model evaluation: time-aware split, MAE/RMSE/R², best model selection by R².
Prints feature importance if available.
"""
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Tuple, Dict, List, Any, Optional

from config import VAL_YEAR, TIME_COLUMN
from models import get_models, get_feature_importance


def compute_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> Dict[str, float]:
    """Compute MAE, RMSE, R²."""
    y_true = np.asarray(y_true).ravel()
    y_pred = np.asarray(y_pred).ravel()
    mask = ~(
        np.isnan(y_true)
        | np.isnan(y_pred)
        | np.isinf(y_true)
        | np.isinf(y_pred)
    )
    y_true, y_pred = y_true[mask], y_pred[mask]
    if len(y_true) == 0:
        return {"mae": np.nan, "rmse": np.nan, "r2": np.nan}
    return {
        "mae": mean_absolute_error(y_true, y_pred),
        "rmse": np.sqrt(mean_squared_error(y_true, y_pred)),
        "r2": r2_score(y_true, y_pred),
    }


def time_aware_split(
    X: pd.DataFrame,
    y: pd.Series,
    val_year: int = VAL_YEAR,
    time_col: str = TIME_COLUMN,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Time-aware split: train on Year < val_year, validate on Year == val_year.
    Prevents data leakage.
    """
    X = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X
    y = pd.Series(y) if not isinstance(y, pd.Series) else y
    tc = time_col if time_col in X.columns else "Year"
    if tc not in X.columns:
        raise ValueError(f"Time column '{time_col}' not in X. Columns: {list(X.columns)}")

    train_mask = X[tc] < val_year
    val_mask = X[tc] == val_year

    if val_mask.sum() == 0:
        from sklearn.model_selection import train_test_split
        X_tr, X_val, y_tr, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        return (
            X_tr.values,
            X_val.values,
            y_tr.values,
            y_val.values,
        )

    X_train = X[train_mask].values
    X_val = X[val_mask].values
    y_train = y[train_mask].values
    y_val = y[val_mask].values
    return X_train, X_val, y_train, y_val


def run_evaluation(
    X_encoded: pd.DataFrame,
    y: pd.Series,
    feature_names: List[str],
    include_boosted: bool = False,
) -> Tuple[Any, str, List[Dict], Optional[Dict[str, float]]]:
    """
    Train all models, compute MAE/RMSE/R², select best by R².
    Prints feature importance if available.

    Args:
        X_encoded: Encoded feature matrix (with Year column).
        y: Target (Closing_Rank).
        feature_names: List of feature column names.
        include_boosted: Whether to include XGBoost/LightGBM.

    Returns:
        (best_model, best_model_name, results_list, feature_importance_dict)
    """
    X_train, X_val, y_train, y_val = time_aware_split(X_encoded, y)

    models = get_models(include_boosted=include_boosted)
    results = []
    best_model = None
    best_name = None
    best_r2 = -np.inf
    best_fi = None

    print("\n--- Model Comparison ---")
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_val)
        metrics = compute_metrics(y_val, y_pred)
        results.append({
            "model": name,
            "MAE": metrics["mae"],
            "RMSE": metrics["rmse"],
            "R2": metrics["r2"],
        })
        print(
            f"  {name}: MAE={metrics['mae']:.2f}, "
            f"RMSE={metrics['rmse']:.2f}, R2={metrics['r2']:.4f}"
        )
        if metrics["r2"] > best_r2:
            best_r2 = metrics["r2"]
            best_model = model
            best_name = name
            best_fi = get_feature_importance(model, feature_names)

    print(f"\nBest model (by R²): {best_name} (R²={best_r2:.4f})")

    # Print feature importance if available
    if best_fi:
        print("\n--- Feature Importance (top 15) ---")
        sorted_fi = sorted(
            best_fi.items(), key=lambda x: -x[1]
        )[:15]
        for feat, imp in sorted_fi:
            print(f"  {feat}: {imp:.4f}")

    return best_model, best_name, results, best_fi
