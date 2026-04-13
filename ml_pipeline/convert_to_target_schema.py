"""
Convert JEE Main, JEE Advanced, and similar wide-format cutoffs to target schema:
Institute, Institute_Type, Program, Seat_Type, Gender, Year, Round, Closing_Rank

Usage:
  python convert_to_target_schema.py --input "jee_mains cutoffs.csv" --year 2024 --output data/jee_main_2024.csv
"""
import pandas as pd
import argparse
import re
from pathlib import Path


def convert_jee_main(df: pd.DataFrame, year: int) -> pd.DataFrame:
    """
    Convert JEE Main wide format to long format.
    Columns: Institute_Group, Institute, Academic Program Name, Quota, Gender,
             OPEN (CRL) Round 1-6, EWS Round 1-6, OBC-NCL Round 1-6, SC Round 1-6, ST Round 1-6
    """
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    id_cols = ["Institute_Group", "Institute", "Academic Program Name", "Quota", "Gender"]
    id_cols = [c for c in id_cols if c in df.columns]
    if not id_cols:
        raise ValueError("JEE Main: expected Institute_Group, Institute, Academic Program Name, Quota, Gender")

    # Map column -> (Seat_Type, Round)
    # e.g. "OPEN (CRL) Round 1" -> (OPEN, 1), "EWS (Category Rank) Round 2" -> (EWS, 2)
    pattern = re.compile(r"^(OPEN|EWS|OBC-NCL|SC|ST)(?:\s*\([^)]*\))?\s+Round\s+(\d+)", re.I)
    rows = []
    for _, r in df.iterrows():
        for col in df.columns:
            if col in id_cols:
                continue
            m = pattern.match(col)
            if m:
                seat_type = m.group(1).upper()
                if "OBC" in seat_type:
                    seat_type = "OBC-NCL"
                round_num = int(m.group(2))
                val = r[col]
                if pd.isna(val) or val == "" or str(val).strip() == "":
                    continue
                try:
                    rank = float(val)
                    if rank <= 0:
                        continue
                except (ValueError, TypeError):
                    continue
                rows.append({
                    "Institute_Type": r.get("Institute_Group", ""),
                    "Institute": r.get("Institute", ""),
                    "Program": r.get("Academic Program Name", ""),
                    "Seat_Type": seat_type,
                    "Gender": r.get("Gender", ""),
                    "Year": year,
                    "Round": round_num,
                    "Closing_Rank": rank,
                })
    return pd.DataFrame(rows)


def convert_jee_advanced(df: pd.DataFrame, year: int) -> pd.DataFrame:
    """
    Convert JEE Advanced wide format to long format.
    Columns: Institute Name, Branch, Quota, Gender, OPEN Round 1-6, EWS Round 1-6, etc.
    """
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    id_cols = ["Institute Name", "Branch", "Quota", "Gender"]
    id_cols = [c for c in id_cols if c in df.columns]
    if not id_cols:
        raise ValueError("JEE Advanced: expected Institute Name, Branch, Quota, Gender")

    # Column pattern: "OPEN Round 1", "EWS Round 2", "OBC-NCL Round 3", etc.
    pattern = re.compile(r"^(OPEN|EWS|OBC-NCL|SC|ST)(?:\s*\([^)]*\))?\s+Round\s+(\d+)", re.I)
    rows = []
    for _, r in df.iterrows():
        for col in df.columns:
            if col in id_cols:
                continue
            m = pattern.match(col)
            if m:
                seat_type = m.group(1).upper()
                if "OBC" in seat_type:
                    seat_type = "OBC-NCL"
                round_num = int(m.group(2))
                val = r[col]
                if pd.isna(val) or val == "" or str(val).strip() == "":
                    continue
                try:
                    rank = float(str(val).replace("P", "").replace("p", ""))
                    if rank <= 0:
                        continue
                except (ValueError, TypeError):
                    continue
                rows.append({
                    "Institute_Type": "IIT",  # JEE Advanced is IITs
                    "Institute": r.get("Institute Name", ""),
                    "Program": r.get("Branch", ""),
                    "Seat_Type": seat_type,
                    "Gender": r.get("Gender", ""),
                    "Year": year,
                    "Round": round_num,
                    "Closing_Rank": rank,
                })
    return pd.DataFrame(rows)


def convert_neet(df: pd.DataFrame, year: int) -> pd.DataFrame:
    """
    Convert NEET wide format to long format.
    Columns: Institute, State, Quota, Course, EWS_R1, Open_R1, OBC_R1, SC_R1, ST_R1, etc.
    """
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    id_cols = ["Institute", "State", "Quota", "Course"]
    id_cols = [c for c in id_cols if c in df.columns]
    if not id_cols:
        id_cols = [c for c in df.columns if c in ["Institute", "Course"]]

    # NEET columns: Open_R1, EWS_R1, OBC_R1, SC_R1, ST_R1, Open_Stray Round, etc.
    pattern = re.compile(r"^(Open|EWS|OBC|SC|ST)(?:\s*PwD)?_R?(\d+)|^(Open|EWS|OBC|SC|ST)(?:\s*PwD)?_(?:Stray|R\d+)", re.I)
    rows = []
    for _, r in df.iterrows():
        for col in df.columns:
            if col in id_cols:
                continue
            m = re.search(r"(Open|EWS|OBC|SC|ST).*?R?(\d+)|Stray", col, re.I)
            if not m:
                continue
            parts = re.split(r"[\s_]", col)
            seat_type = "OPEN" if "Open" in col or "OPEN" in col.upper() else parts[0].upper()
            if "OBC" in seat_type:
                seat_type = "OBC-NCL"
            round_match = re.search(r"R(\d+)|Stray", col, re.I)
            round_num = int(round_match.group(1)) if round_match and round_match.group(1) else 1
            val = r[col]
            if pd.isna(val) or val == "" or str(val).strip() == "":
                continue
            try:
                rank = float(val)
                if rank <= 0:
                    continue
            except (ValueError, TypeError):
                continue
            rows.append({
                "Institute_Type": r.get("State", "Unknown"),
                "Institute": r.get("Institute", ""),
                "Program": r.get("Course", ""),
                "Seat_Type": seat_type,
                "Gender": "Gender-Neutral",  # NEET often doesn't split by gender
                "Year": year,
                "Round": round_num,
                "Closing_Rank": rank,
            })
    return pd.DataFrame(rows)


def detect_format(df: pd.DataFrame) -> str:
    """Detect format: jee_main, jee_advanced, neet, or target (already in schema)."""
    cols = [str(c).lower() for c in df.columns]
    if "academic program name" in cols and "institute_group" in cols:
        return "jee_main"
    if "institute name" in cols and "branch" in cols and "quota" in cols:
        return "jee_advanced"
    if "course" in cols and ("open_r1" in " ".join(cols) or "ews_r1" in " ".join(cols)):
        return "neet"
    if all(x in cols for x in ["institute", "program", "seat_type", "gender", "year", "round", "closing_rank"]):
        return "target"
    return "unknown"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", "-i", required=True, help="Input CSV path")
    parser.add_argument("--year", "-y", type=int, required=True, help="Year for this dataset")
    parser.add_argument("--output", "-o", required=True, help="Output CSV path")
    parser.add_argument("--format", choices=["jee_main", "jee_advanced", "neet", "auto"], default="auto")
    args = parser.parse_args()

    df = pd.read_csv(args.input, encoding="utf-8", low_memory=False)
    fmt = args.format
    if fmt == "auto":
        fmt = detect_format(df)
        print(f"Detected format: {fmt}")

    if fmt == "jee_main":
        out = convert_jee_main(df, args.year)
    elif fmt == "jee_advanced":
        out = convert_jee_advanced(df, args.year)
    elif fmt == "neet":
        out = convert_neet(df, args.year)
    else:
        raise SystemExit(f"Unknown or unsupported format: {fmt}")

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    out.to_csv(args.output, index=False)
    print(f"Wrote {len(out)} rows to {args.output}")


if __name__ == "__main__":
    main()
