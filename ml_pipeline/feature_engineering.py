"""
Feature engineering for closing rank prediction.
LabelEncode: Institute, Institute_Type, Program, Seat_Type, Gender, Round.
Year is used as numeric feature.
Returns X, y and encoders (encoders stored on the FeatureEngineer instance).
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from typing import Tuple, Dict, Optional, List

from config import CATEGORICAL_COLUMNS, TIME_COLUMN


class FeatureEngineer:
    """
    Fit/transform categorical columns with LabelEncoder; Year as numeric.
    Encoders are stored in self.encoders for inverse_transform in prediction output.
    """

    def __init__(self):
        self.encoders: Dict[str, LabelEncoder] = {}
        self.feature_columns: Optional[List[str]] = None

    def fit_transform(
        self,
        X: pd.DataFrame,
        y: Optional[pd.Series] = None,
    ) -> pd.DataFrame:
        """
        Fit encoders on training data and transform X.
        Year is kept as numeric; categoricals are LabelEncoded.

        Returns:
            Encoded DataFrame (same columns, categoricals replaced by int labels).
        """
        X = X.copy()
        X.columns = [str(c).strip() for c in X.columns]
        self._align_column_names(X)

        cat_cols = [c for c in CATEGORICAL_COLUMNS if c in X.columns]
        time_col = TIME_COLUMN if TIME_COLUMN in X.columns else "Year"
        if time_col not in X.columns:
            for c in X.columns:
                if c.lower() == "year":
                    time_col = c
                    break

        X_encoded = X.copy()
        for col in cat_cols:
            if col not in X_encoded.columns:
                continue
            le = LabelEncoder()
            vals = X_encoded[col].astype(str).fillna("__MISSING__")
            le.fit(vals.unique())
            X_encoded[col] = le.transform(vals)
            self.encoders[col] = le

        if time_col in X_encoded.columns:
            X_encoded[time_col] = pd.to_numeric(
                X_encoded[time_col], errors="coerce"
            ).fillna(0)

        self.feature_columns = list(X_encoded.columns)
        return X_encoded

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Transform new data using fitted encoders.
        Unseen categories are encoded as -1.
        """
        X = X.copy()
        X.columns = [str(c).strip() for c in X.columns]
        self._align_column_names(X)

        for col, le in self.encoders.items():
            if col not in X.columns:
                continue
            vals = X[col].astype(str).fillna("__MISSING__")
            classes_set = set(le.classes_)
            X[col] = vals.apply(
                lambda v: le.transform([v])[0] if v in classes_set else -1
            )

        for time_col in (TIME_COLUMN, "Year"):
            if time_col in X.columns:
                X[time_col] = pd.to_numeric(X[time_col], errors="coerce").fillna(0)

        if self.feature_columns:
            X = X[[c for c in self.feature_columns if c in X.columns]]
        return X

    def _align_column_names(self, X: pd.DataFrame) -> None:
        """Align common aliases to schema names (in-place)."""
        alias = {
            "institute": "Institute",
            "institute_type": "Institute_Type",
            "institute_group": "Institute_Type",
            "program": "Program",
            "branch": "Program",
            "seat_type": "Seat_Type",
            "quota": "Seat_Type",
            "category": "Seat_Type",
            "gender": "Gender",
            "year": "Year",
            "round": "Round",
        }
        for col in list(X.columns):
            key = col.lower()
            if key in alias and alias[key] not in X.columns:
                X.rename(columns={col: alias[key]}, inplace=True)

    def get_feature_names(self) -> List[str]:
        return self.feature_columns or []

    def inverse_transform_categoricals(self, X_encoded: pd.DataFrame) -> pd.DataFrame:
        """
        Inverse transform encoded columns back to original labels.
        Used when building prediction output with human-readable columns.
        """
        X = X_encoded.copy()
        for col, le in self.encoders.items():
            if col not in X.columns:
                continue
            # -1 or unknown -> "__MISSING__" or first class
            vals = X[col].astype(int)
            mask = (vals >= 0) & (vals < len(le.classes_))
            X[col] = "__UNKNOWN__"
            X.loc[mask, col] = le.inverse_transform(vals[mask])
        return X
