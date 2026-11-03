import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
import xgboost as xgb
from typing import Dict, Any, Tuple

FEATURE_COLUMNS = [
    "winning_ratio",
    "winning_margin",
    "second_spread",
    "coef_variation",
    "min_non_win_diff",
    "num_bidders",
    "ratio_pegging_indicator",
    "max_pair_jaccard",
    "avg_pair_jaccard",
    "winner_win_rate",
    "shared_subnet_flag",
    "winner_centrality",
    "winner_clustering"
]

class DetectionModels:
    def __init__(self):
        self.rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
        self.xgb_model = xgb.XGBClassifier(
            n_estimators=80,
            max_depth=4,
            learning_rate=0.08,
            random_state=42,
            eval_metric="logloss"
        )
        self.iso_forest = IsolationForest(
            n_estimators=100,
            contamination=0.25,
            random_state=42
        )
        self.is_trained = False
        self.feature_importances = {}

    def fit_models(self, X_df: pd.DataFrame, scenario_labels: pd.Series):
        """
        Fits Random Forest, XGBoost on simulation training data (distinguishing normal vs simulated cartels),
        and fits Isolation Forest for unsupervised anomaly detection.
        """
        X = X_df[FEATURE_COLUMNS].fillna(0).values
        # 0 for Normal Competitive, 1 for any simulated cartel
        y = scenario_labels.apply(lambda s: 0 if "Normal" in str(s) else 1).values

        # 1. Fit Random Forest
        self.rf_model.fit(X, y)

        # 2. Fit XGBoost
        self.xgb_model.fit(X, y)

        # 3. Fit Isolation Forest
        self.iso_forest.fit(X)

        self.is_trained = True

        # Extract combined feature importance
        rf_imp = self.rf_model.feature_importances_
        xgb_imp = self.xgb_model.feature_importances_
        
        for idx, col in enumerate(FEATURE_COLUMNS):
            combined_imp = 0.5 * rf_imp[idx] + 0.5 * xgb_imp[idx]
            self.feature_importances[col] = round(float(combined_imp), 4)

        return self.feature_importances

    def predict(self, X_df: pd.DataFrame) -> Dict[str, np.ndarray]:
        """
        Runs inference across all 3 models:
        - rf_probs: probability of collusion from Random Forest
        - xgb_probs: probability of collusion from XGBoost
        - iso_scores: normalized anomaly score from Isolation Forest (0 to 1)
        """
        X = X_df[FEATURE_COLUMNS].fillna(0).values
        
        # Supervised probabilities
        rf_probs = self.rf_model.predict_proba(X)[:, 1]
        xgb_probs = self.xgb_model.predict_proba(X)[:, 1]

        # Isolation Forest anomaly score: lower means more anomalous
        raw_iso = self.iso_forest.score_samples(X)
        # Normalize to 0 (normal) to 1 (highly anomalous)
        min_iso = np.min(raw_iso)
        max_iso = np.max(raw_iso)
        iso_scores = 1.0 - (raw_iso - min_iso) / (max_iso - min_iso + 1e-6)

        return {
            "rf_probs": rf_probs,
            "xgb_probs": xgb_probs,
            "iso_scores": iso_scores
        }
