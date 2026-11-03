from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.services.report_generator import generate_pdf_investigation_report
from app.database.db import get_db_connection
import os

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("")
def list_investigation_reports():
    conn = get_db_connection()
    reports = conn.execute("""
        SELECT i.*, t.title, t.risk_score, t.risk_level, t.winning_supplier_name
        FROM investigations i
        JOIN tenders t ON i.tender_id = t.tender_id
        ORDER BY i.generated_at DESC
    """).fetchall()
    conn.close()
    return {"reports": [dict(r) for r in reports]}

@router.get("/{tender_id}/pdf")
def get_pdf_report(tender_id: str):
    try:
        pdf_path = generate_pdf_investigation_report(tender_id=tender_id)
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=500, detail="Failed to locate generated PDF")
        
        filename = os.path.basename(pdf_path)
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=filename,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
