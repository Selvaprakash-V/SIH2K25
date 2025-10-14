#!/usr/bin/env python3
"""
Convert Excel files to CSV for MongoDB Compass import.
Adds district metadata and normalizes column names.
"""

import os
import re
import pandas as pd
from pathlib import Path

# District mapping based on file codes
DISTRICT_MAP = {
    "1101": ("1101", "North Sikkim"),
    "1102": ("1102", "West Sikkim"), 
    "1103": ("1103", "South Sikkim"),
    "1104": ("1104", "East Sikkim"),
}

def infer_district(filename):
    """Extract district code and name from filename"""
    match = re.search(r'(1101|1102|1103|1104)', filename)
    if not match:
        return None, None
    code = match.group(1)
    return DISTRICT_MAP.get(code, (None, None))

def find_village_column(columns):
    """Try to find a village name column"""
    for col in columns:
        normalized = re.sub(r'[^0-9a-zA-Z]+', '_', col.strip().lower())
        if "village" in normalized and ("name" in normalized or normalized.endswith("village")):
            return col
    return None

def main():
    # Setup paths
    backend_dir = Path(__file__).parent
    repo_root = backend_dir.parent
    data_dir = repo_root / "data" / "sikkim"
    csv_dir = data_dir / "csv"
    
    # Create output directory
    csv_dir.mkdir(parents=True, exist_ok=True)
    
    # Find Excel files
    excel_files = list(data_dir.glob("*.xlsx"))
    if not excel_files:
        print(f"ERROR: No .xlsx files found in {data_dir}")
        print(f"Please put your 4 Excel files (PCA_SC1101_2011_MDDS_DDW.xlsx, etc.) in: {data_dir}")
        return
    
    print(f"Found {len(excel_files)} Excel files in {data_dir}")
    
    # Process each Excel file
    for excel_path in sorted(excel_files):
        print(f"\nProcessing: {excel_path.name}")
        
        try:
            # Read Excel file (all columns as string to preserve codes)
            df = pd.read_excel(excel_path, dtype=str, engine="openpyxl")
            df = df.fillna("")  # Replace NaN with empty strings
            
            # Infer district info from filename
            district_code, district_name = infer_district(excel_path.name)
            
            # Try to identify village name column
            village_col = find_village_column(df.columns)
            if village_col and "village_name" not in df.columns:
                df["village_name"] = df[village_col]
            
            # Add metadata columns
            df["state_name"] = "Sikkim"
            if district_code:
                df["district_code"] = district_code
            if district_name:
                df["district_name"] = district_name
            df["_source_file"] = excel_path.name
            
            # Create CSV output path
            csv_path = csv_dir / f"{excel_path.stem}.csv"
            
            # Save to CSV
            df.to_csv(csv_path, index=False, encoding="utf-8")
            
            print(f"✓ Created: {csv_path}")
            print(f"  Rows: {len(df)}")
            print(f"  Columns: {len(df.columns)}")
            if district_name:
                print(f"  District: {district_name}")
            if village_col:
                print(f"  Village column: {village_col}")
                
        except Exception as e:
            print(f"✗ ERROR processing {excel_path.name}: {e}")
    
    print(f"\n✅ Done! CSV files saved to: {csv_dir}")
    print("Next step: Import these CSV files into MongoDB Compass")

if __name__ == "__main__":
    main()