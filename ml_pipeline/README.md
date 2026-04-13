# Closing Rank Prediction ML Pipeline

Production-ready ML pipeline for predicting 2026 closing ranks from historical admission data (JEE Main, JEE Advanced, NEET, EAMCET, etc.).

## Setup

```bash
pip install -r requirements.txt
```

## Target Data Schema

Input CSV(s) should have (or be convertible to):

| Column | Description |
|--------|-------------|
| Institute | Institute name |
| Institute_Type | IIT, NIT, GFTI, State, Private, etc. |
| Program | Branch/course (e.g., Computer Science, ECE) |
| Seat_Type | OPEN, EWS, OBC-NCL, SC, ST |
| Gender | Gender-Neutral, Female-only, etc. |
| Year | 2021, 2022, 2023, 2024, 2025 |
| Round | 1–6 (counseling round) |
| Closing_Rank | Closing rank value |

## Usage

### 1. Convert existing JEE/NEET cutoffs to target schema

```bash
# JEE Main
python convert_to_target_schema.py -i "../jee_mains cutoffs.csv" -y 2024 -o data/jee_main_2024.csv --format jee_main

# JEE Advanced
python convert_to_target_schema.py -i "../iit jee advanced cut offs.csv" -y 2024 -o data/jee_advanced_2024.csv --format jee_advanced

# Auto-detect format
python convert_to_target_schema.py -i "../jee_mains cutoffs.csv" -y 2024 -o data/jee_main_2024.csv --format auto
```

Repeat for multiple years (2021–2025), then concatenate CSVs or place in `data/` folder.

### 2. Generate sample data (for testing)

```bash
python generate_sample_data.py
```

Creates `data/historical_closing_ranks.csv` with synthetic multi-year data.

### 3. Run full pipeline

```bash
python main.py --data data/historical_closing_ranks.csv --output output/predicted_2026_closing_rank.csv
```

Or use default paths:

```bash
python main.py
```

**Output:**
- `output/predicted_2026_closing_rank.csv` — predicted 2026 closing ranks
- `output/model_comparison.csv` — MAE, RMSE, R² for each model

## Pipeline Flow

1. **Load** — CSV(s) in target schema
2. **Feature engineering** — Label encode Institute, Program, Seat_Type, Gender, Round; Year as time feature
3. **Time-aware split** — Train on years &lt; 2025, validate on 2025
4. **Train** — Linear Regression, Random Forest, Gradient Boosting
5. **Evaluate** — MAE, RMSE, R²; select best model (by R²)
6. **Predict** — 2026 closing ranks for all unique (Institute, Program, Seat_Type, Gender, Round)
7. **Export** — `predicted_2026_closing_rank.csv`

## Configuration

Edit `config.py`:
- `TRAIN_END_YEAR` — Train up to this year (default: 2025)
- `PREDICT_YEAR` — Year to predict (default: 2026)
- `MODEL_PARAMS` — Hyperparameters (max_depth, n_estimators, etc.) for overfitting control
