from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.services.data_generator import generate_synthetic_dataset, DATASET_DIR
from app.database.db import get_db_connection
import pandas as pd
import os
import io

router = APIRouter(prefix="/api/dataset", tags=["Dataset Management"])

REQUIRED_COLUMNS = ["tender_id", "title", "category", "estimated_value", "bidder_id", "bidder_name", "bid_amount"]

@router.post("/reset-sample")
def reset_sample_dataset():
    t_count, b_count, bdr_count = generate_synthetic_dataset(num_tenders=120)
    return {
        "status": "success",
        "message": "Sample synthetic procurement dataset reloaded successfully.",
        "tenders": t_count,
        "bids": b_count,
        "bidders": bdr_count
    }

@router.get("/download/raw")
def download_raw_dataset():
    csv_path = os.path.join(DATASET_DIR, "procurement_tenders_raw.csv")
    if not os.path.exists(csv_path):
        # Generate if not exists
        generate_synthetic_dataset(num_tenders=120)
    return FileResponse(csv_path, media_type="text/csv", filename="procurement_tenders_raw.csv")

@router.get("/download/processed")
def download_processed_dataset():
    conn = get_db_connection()
    df_tenders = pd.read_sql_query("SELECT * FROM tenders", conn)
    conn.close()
    
    csv_path = os.path.join(DATASET_DIR, "procurement_tenders_processed.csv")
    df_tenders.to_csv(csv_path, index=False)
    return FileResponse(csv_path, media_type="text/csv", filename="procurement_tenders_processed.csv")

@router.post("/upload")
async def upload_csv_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    # Column validation
    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Uploaded CSV missing required columns: {missing_cols}. Required: {REQUIRED_COLUMNS}"
        )

    # Clean duplicates and missing values
    initial_rows = len(df)
    df.drop_duplicates(inplace=True)
    df.dropna(subset=["tender_id", "estimated_value", "bidder_id", "bid_amount"], inplace=True)
    cleaned_rows = len(df)

    preview = df.head(10).to_dict(orient="records")

    return {
        "status": "success",
        "filename": file.filename,
        "initial_rows": initial_rows,
        "cleaned_rows": cleaned_rows,
        "duplicates_removed": initial_rows - cleaned_rows,
        "preview": preview,
        "message": "Dataset validated and preprocessed successfully."
    }
