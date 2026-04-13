"""
Regression models for closing rank prediction.
Implements: Linear Regression, Random Forest Regressor, Gradient Boosting Regressor.
Optionally XGBoost and LightGBM when sufficient years of data exist (>= MIN_YEARS_FOR_BOOSTED).
All hyperparameters from config.py; random_state for reproducibility.
"""
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.base import RegressorMixin
from typing import Dict, Any, Optional

from config import MODEL_PARAMS, MIN_YEARS_FOR_BOOSTED, RANDOM_STATE

# Optional boosted models (try/except to avoid hard dependency)
_XGB_AVAILABLE = False
_LGB_AVAILABLE = False
try:
    import xgboost as xgb
    _XGB_AVAILABLE = True
except ImportError:
    pass
try:
    import lightgbm as lgb
    _LGB_AVAILABLE = True
except ImportError:
    pass


def get_models(include_boosted: bool = False) -> Dict[str, RegressorMixin]:
    """
    Return dict of model name -> model instance.
    Uses hyperparameters from config.MODEL_PARAMS.

    Args:
        include_boosted: If True and XGBoost/LightGBM are installed, add them to the suite.
    """
    models = {
        "Linear Regression": LinearRegression(**MODEL_PARAMS["linear_regression"]),
        "Random Forest": RandomForestRegressor(**MODEL_PARAMS["random_forest"]),
        "Gradient Boosting": GradientBoostingRegressor(
            **MODEL_PARAMS["gradient_boosting"]
        ),
    }
    if include_boosted:
        if _XGB_AVAILABLE:
            params = dict(MODEL_PARAMS["xgboost"])
            models["XGBoost"] = xgb.XGBRegressor(**params)
        if _LGB_AVAILABLE:
            params = dict(MODEL_PARAMS["lightgbm"])
            models["LightGBM"] = lgb.LGBMRegressor(**params)
    return models


def get_feature_importance(
    model: RegressorMixin,
    feature_names: list,
) -> Optional[Dict[str, float]]:
    """
    Extract feature importance if the model supports it.
    Returns dict feature_name -> importance, or None.
    """
    if hasattr(model, "feature_importances_"):
        imp = model.feature_importances_
        return dict(zip(feature_names, imp))
    if hasattr(model, "coef_"):
        coef = np.abs(model.coef_)
        return dict(zip(feature_names, coef))
    return None
