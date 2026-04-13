"""
Generate sample multi-year (2021–2025) closing rank dataset.
Simulates realistic upward/downward rank trends and saves to data/historical_closing_ranks.csv.
"""
import pandas as pd
import numpy as np
from pathlib import Path

from config import BASE_DIR, REQUIRED_COLUMNS, TRAIN_END_YEAR, RANDOM_STATE

np.random.seed(RANDOM_STATE)


def generate_sample_data(
    years: list = None,
    n_institutes: int = 25,
    n_programs_per_institute: int = 3,
    output_path: Path = None,
) -> pd.DataFrame:
    """
    Create synthetic 5-year dataset (2021–2025) with realistic trends:
    - Slight upward trend in ranks over years (competition increases).
    - Some institutes/programs with downward (tighter) ranks.
    - Seat-type and gender variation.
    Saves to data/historical_closing_ranks.csv.
    """
    if years is None:
        years = list(range(2021, TRAIN_END_YEAR + 1))  # 2021–2025
    if output_path is None:
        output_path = BASE_DIR / "data" / "historical_closing_ranks.csv"

    institutes = [f"Institute_{i}" for i in range(1, n_institutes + 1)]
    institute_types = ["IIT", "NIT", "GFTI", "State", "Private"]
    programs = [
        "Computer Science",
        "Electronics",
        "Mechanical",
        "Civil",
        "Chemical",
        "Electrical",
    ]
    seat_types = ["OPEN", "EWS", "OBC-NCL", "SC", "ST"]
    genders = ["Gender-Neutral", "Female-only (including Supernumerary)"]
    rounds_ = [1, 2, 3, 4, 5, 6]

    inst_type_map = {
        inst: institute_types[i % len(institute_types)]
        for i, inst in enumerate(institutes)
    }

    rows = []
    for year in years:
        for inst in institutes:
            itype = inst_type_map[inst]
            n_progs = min(
                n_programs_per_institute,
                np.random.randint(2, len(programs) + 1),
            )
            progs = np.random.choice(programs, size=n_progs, replace=False)
            for prog in progs:
                base_rank = np.random.randint(1000, 200000)
                # Simulate trend: ~70% upward (rank increases), ~30% downward
                trend = np.random.choice([1, -1], p=[0.7, 0.3])
                year_factor = 1.0 + trend * 0.03 * (year - years[0])
                for seat in seat_types:
                    sf = {"OPEN": 1.0, "EWS": 1.2, "OBC-NCL": 1.5, "SC": 2.0, "ST": 2.2}[seat]
                    for gender in genders:
                        for rnd in rounds_:
                            rank = int(
                                base_rank
                                * year_factor
                                * sf
                                * (0.9 + 0.2 * np.random.rand())
                            )
                            rows.append({
                                "Institute": inst,
                                "Institute_Type": itype,
                                "Program": prog,
                                "Seat_Type": seat,
                                "Gender": gender,
                                "Year": year,
                                "Round": rnd,
                                "Closing_Rank": max(1, rank),
                            })

    df = pd.DataFrame(rows)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(
        f"Generated {len(df)} rows for years {years[0]}-{years[-1]} -> {output_path}"
    )
    return df


if __name__ == "__main__":
    generate_sample_data()
