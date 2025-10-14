#!/usr/bin/env python3
"""
Import Sikkim district Excel files into MongoDB.

- Reads four Excel files from the repo root:
  PCA_SC1101_2011_MDDS_DDW.xlsx, PCA_SC1102_2011_MDDS_DDW.xlsx,
  PCA_SC1103_2011_MDDS_DDW.xlsx, PCA_SC1104_2011_MDDS_DDW.xlsx
- Normalizes column names and adds district metadata
- Writes to collection: sikkim_villages_raw

Usage:
  1) Ensure MongoDB is reachable via MONGO_URI in .env or environment
  2) Install deps in backend venv: pip install -r requirements.txt
  3) Run from backend folder: python import_sikkim_excel_to_mongo.py

Notes:
- We don't assume specific Excel schema; we ingest all columns as-is.
- We try to infer village/district names if present; otherwise rely on file code.
"""

import os
import sys
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient

# District code mapping per file name (1101..1104)
DISTRICT_MAPPING = {
    1101: "North Sikkim",
    1102: "West Sikkim",
    1103: "South Sikkim",
    1104: "East Sikkim",
}

DISTRICT_FILES = {
    1101: "PCA_SC1101_2011_MDDS_DDW.xlsx",
    1102: "PCA_SC1102_2011_MDDS_DDW.xlsx",
    1103: "PCA_SC1103_2011_MDDS_DDW.xlsx",
    1104: "PCA_SC1104_2011_MDDS_DDW.xlsx",
}

# Columns we attempt to align if present (case-insensitive contains)
CANDIDATE_VILLAGE_COLUMNS = [
    "village name", "village", "name of village", "name",
]
CANDIDATE_DISTRICT_COLUMNS = [
    "district name", "district",
]


def find_first_matching_column(columns, candidates):
    lowered = {c.lower(): c for c in columns}
    for cand in candidates:
        for col in columns:
            if cand in col.lower():
                return col
    # try direct lower mapping
    for cand in candidates:
        if cand in lowered:
            return lowered[cand]
    return None


def normalize_dataframe(df: pd.DataFrame, district_code: int) -> pd.DataFrame:
    df = df.copy()
    # strip/normalize column names
    df.columns = [str(c).strip() for c in df.columns]

    # add metadata
    df["district_code"] = district_code
    df["district_name"] = DISTRICT_MAPPING.get(district_code)
    df["state"] = "Sikkim"

    # try to extract a normalized village name column
    vcol = find_first_matching_column(df.columns, CANDIDATE_VILLAGE_COLUMNS)
    if vcol:
        df["village_name"] = df[vcol].astype(str).str.strip()
    else:
        # leave empty if cannot infer
        df["village_name"] = None

    # ensure numeric types where possible
    for col in df.columns:
        # skip our added metadata and village_name
        if col in {"district_code", "district_name", "state", "village_name"}:
            continue
        # try convert to numeric if feasible
        try:
            df[col] = pd.to_numeric(df[col])
        except Exception:
            # best-effort: keep as-is
            pass

    return df


def read_excel_any_sheet(path: Path) -> pd.DataFrame:
    # Attempt to read first sheet if sheet names unknown
    try:
        return pd.read_excel(path, engine="openpyxl")
    except Exception as e:
        raise RuntimeError(f"Failed reading {path.name}: {e}")


def main():
    load_dotenv()
    backend_dir = Path(__file__).parent
    repo_root = backend_dir.parent

    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = MongoClient(mongo_uri)
    db = client["ruraliq"]
    coll = db["sikkim_villages_raw"]

    all_rows = 0
    for code, fname in DISTRICT_FILES.items():
        xlsx_path = repo_root / fname
        if not xlsx_path.exists():
            print(f"WARNING: File not found: {xlsx_path}")
            continue
        print(f"Reading: {xlsx_path.name} ...")
        df = read_excel_any_sheet(xlsx_path)
        df_norm = normalize_dataframe(df, code)
        records = df_norm.to_dict(orient="records")
        if records:
            # tag source file for traceability
            for r in records:
                r["_source_file"] = fname
            # ensure indexes (safe to call repeatedly)
            coll.create_index("district_name")
            coll.create_index("district_code")
            coll.create_index("village_name")

            # idempotent load for this file: clear old rows from same source
            deleted = coll.delete_many({"_source_file": fname}).deleted_count
            if deleted:
                print(f"Removed {deleted} existing rows for {DISTRICT_MAPPING[code]} from previous loads")

            result = coll.insert_many(records)
            inserted = len(result.inserted_ids)
            all_rows += inserted
            print(f"Inserted {inserted} rows for {DISTRICT_MAPPING[code]}")
        else:
            print(f"No rows found in {fname}")

    print(f"\nDone. Total inserted: {all_rows} into collection 'sikkim_villages_raw'.")
    print("You can query with fetch_sikkim_from_mongo.py for examples.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted.")
        sys.exit(1)
