import os
import json
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from app.database.db import get_db_connection

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

def generate_pdf_investigation_report(tender_id: str, alert_id: str = None) -> str:
    """
    Generates a formal, intelligence-grade PDF forensic audit report for a suspicious tender.
    Returns the absolute path to the generated PDF.
    """
    conn = get_db_connection()
    t_row = conn.execute("SELECT * FROM tenders WHERE tender_id = ?", (tender_id,)).fetchone()
    bids = conn.execute("SELECT * FROM bids WHERE tender_id = ? ORDER BY bid_amount ASC", (tender_id,)).fetchall()
    
    alert_row = None
    if alert_id:
        alert_row = conn.execute("SELECT * FROM alerts WHERE alert_id = ?", (alert_id,)).fetchone()
    if not alert_row:
        alert_row = conn.execute("SELECT * FROM alerts WHERE tender_id = ? ORDER BY risk_score DESC", (tender_id,)).fetchone()

    conn.close()

    if not t_row:
        raise ValueError(f"Tender {tender_id} not found.")

    filename = f"ProcureGuard_Investigation_{tender_id}_{datetime.date.today().strftime('%Y%m%d')}.pdf"
    pdf_path = os.path.join(REPORTS_DIR, filename)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom palette
    primary_color = colors.HexColor("#0f172a")
    accent_blue = colors.HexColor("#0284c7")
    accent_red = colors.HexColor("#b91c1c")
    accent_green = colors.HexColor("#047857")
    neutral_bg = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=12
    )

    heading2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b")
    )

    badge_style = ParagraphStyle(
        'RiskBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.white
    )

    elements = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>PROCUREGUARD AI</b><br/><font size=8 color='#0284c7'>INTELLIGENCE FOR TRANSPARENT PROCUREMENT</font>", body_style),
            Paragraph(f"<b>CONFIDENTIAL FORENSIC AUDIT DOSSIER</b><br/><font size=8 color='#64748b'>Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</font>", ParagraphStyle('RAlign', parent=body_style, alignment=2))
        ]
    ]
    t_header = Table(header_data, colWidths=[3.5*inch, 4.0*inch])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t_header)
    elements.append(HRFlowable(width="100%", thickness=1.5, color=accent_blue, spaceBefore=2, spaceAfter=14))

    # 2. Executive Summary & Risk Rating
    risk_score = t_row["risk_score"]
    risk_level = t_row["risk_level"]
    risk_badge_color = accent_red if risk_level == "High" else (colors.HexColor("#d97706") if risk_level == "Medium" else accent_green)

    elements.append(Paragraph(f"Investigation Dossier: {t_row['title']}", title_style))
    elements.append(Paragraph(f"Tender ID: <b>{t_row['tender_id']}</b> &nbsp;|&nbsp; Category: <b>{t_row['category']}</b> &nbsp;|&nbsp; Location: <b>{t_row['location']}</b>", subtitle_style))

    summary_box_data = [
        [
            Paragraph(f"<b>HYBRID COLLUSION RISK SCORE</b><br/><font size=22><b>{risk_score} / 100</b></font><br/>Classification: <b>{risk_level.upper()} RISK</b>", ParagraphStyle('Score', parent=body_style, textColor=risk_badge_color)),
            Paragraph(f"<b>AI DETECTION SUMMARY</b><br/>{t_row['ai_explanation']}<br/><br/><i>Simulated Dataset Scenario: {t_row['simulation_scenario']}</i>", body_style)
        ]
    ]
    t_summary = Table(summary_box_data, colWidths=[2.6*inch, 4.9*inch])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), neutral_bg),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(t_summary)
    elements.append(Spacer(1, 14))

    # 3. Contract & Procurement Parameters
    elements.append(Paragraph("1. Procurement Metadata & Financial Overview", heading2_style))
    est_val = f"${t_row['estimated_value']:,.2f}"
    win_bid = f"${t_row['winning_bid']:,.2f}" if t_row['winning_bid'] else "N/A"
    
    meta_table_data = [
        [
            Paragraph("<b>Government Estimated Value:</b>", body_style), Paragraph(est_val, body_style),
            Paragraph("<b>Winning Bid Amount:</b>", body_style), Paragraph(win_bid, body_style)
        ],
        [
            Paragraph("<b>Contract Awardee:</b>", body_style), Paragraph(str(t_row['winning_supplier_name']), body_style),
            Paragraph("<b>Total Submissions:</b>", body_style), Paragraph(f"{t_row['num_bidders']} Verified Suppliers", body_style)
        ],
        [
            Paragraph("<b>Tender Opening Date:</b>", body_style), Paragraph(str(t_row['tender_date']), body_style),
            Paragraph("<b>Procurement Status:</b>", body_style), Paragraph(str(t_row['status']), body_style)
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[1.8*inch, 2.0*inch, 1.8*inch, 1.9*inch])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_meta)
    elements.append(Spacer(1, 14))

    # 4. Bid Breakdown Table
    elements.append(Paragraph("2. Forensic Bid Breakdown & Price Disparity Analysis", heading2_style))
    bid_rows = [
        [
            Paragraph("<b>Supplier Name</b>", body_style),
            Paragraph("<b>Bid Amount</b>", body_style),
            Paragraph("<b>Ratio to Est.</b>", body_style),
            Paragraph("<b>Timestamp</b>", body_style),
            Paragraph("<b>IP Subnet</b>", body_style),
            Paragraph("<b>Outcome</b>", body_style)
        ]
    ]

    for b in bids:
        is_win = bool(b["is_winner"])
        outcome_text = "<font color='#047857'><b>AWARDED (L1)</b></font>" if is_win else "<font color='#64748b'>Unsuccessful</font>"
        bid_rows.append([
            Paragraph(f"<b>{b['bidder_name']}</b><br/><font size=7 color='#64748b'>{b['bidder_id']}</font>", body_style),
            Paragraph(f"${b['bid_amount']:,.2f}", body_style),
            Paragraph(f"{b['bid_to_estimate_ratio']*100:.2f}%", body_style),
            Paragraph(str(b['bid_timestamp']), body_style),
            Paragraph(str(b['ip_address']), body_style),
            Paragraph(outcome_text, body_style)
        ])

    t_bids = Table(bid_rows, colWidths=[2.1*inch, 1.2*inch, 1.0*inch, 1.4*inch, 1.0*inch, 0.8*inch])
    t_bids.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t_bids)
    elements.append(Spacer(1, 14))

    # 5. Detected Collusion Indicators & Forensic Signals
    elements.append(Paragraph("3. Algorithmic Collusion Indicators Detected", heading2_style))
    try:
        indicators = json.loads(t_row["contributing_indicators"]) if t_row["contributing_indicators"] else []
    except Exception:
        indicators = []
    
    if not indicators:
        indicators = ["Standard market dispersal; no severe anomaly detected."]

    ind_rows = []
    for idx, ind in enumerate(indicators):
        bullet = f"• [INDICATOR-0{idx+1}]"
        ind_rows.append([
            Paragraph(f"<b>{bullet}</b>", ParagraphStyle('B', parent=body_style, textColor=accent_red if risk_level == 'High' else colors.HexColor("#b45309"))),
            Paragraph(ind, body_style)
        ])
    
    t_ind = Table(ind_rows, colWidths=[1.5*inch, 6.0*inch])
    t_ind.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), neutral_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_ind)
    elements.append(Spacer(1, 14))

    # 6. Recommended Auditor Next Steps
    elements.append(Paragraph("4. Recommended Forensic Investigation Steps", heading2_style))
    steps_data = [
        [
            Paragraph("<b>Step 1: Subpoena Digital Logs</b>", body_style),
            Paragraph("Request ISP and institutional server access logs to verify if bids were uploaded from shared hardware or identical MAC addresses.", body_style)
        ],
        [
            Paragraph("<b>Step 2: Corporate Registry Search</b>", body_style),
            Paragraph("Examine the beneficial ownership and director cross-holdings between the top 3 participating bidders for undisclosed parent-subsidiary relationships.", body_style)
        ],
        [
            Paragraph("<b>Step 3: Historical Tender Cross-Audit</b>", body_style),
            Paragraph("Inspect preceding and subsequent procurement awards in the same district to cross-verify winner rotation patterns identified by ProcureGuard GraphSAGE.", body_style)
        ],
        [
            Paragraph("<b>Step 4: Formal Hearing / Freeze</b>", body_style),
            Paragraph("Issue formal request for explanation regarding bid pricing parity before contract finalization or fund disbursement.", body_style)
        ]
    ]
    t_steps = Table(steps_data, colWidths=[2.2*inch, 5.3*inch])
    t_steps.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_steps)
    elements.append(Spacer(1, 16))

    # 7. Official Legal Disclaimer
    disclaimer_text = (
        "<b>OFFICIAL REGULATORY DISCLAIMER:</b> ProcureGuard AI operates as an automated decision-support intelligence platform. "
        "A High or Medium risk score indicates statistical, behavioural, and topological anomalies requiring human audit. "
        "It does not constitute conclusive legal proof of criminal antitrust collusion under competition laws. "
        "This dossier is intended exclusively for authorized public procurement auditors and anti-corruption oversight bodies."
    )
    elements.append(Paragraph(disclaimer_text, ParagraphStyle('Disc', parent=body_style, fontSize=7.5, leading=10, textColor=colors.HexColor("#64748b"))))

    # Build PDF
    doc.build(elements)

    # Record investigation in database
    conn = get_db_connection()
    rep_id = f"REP-{tender_id}"
    conn.execute("""
        INSERT OR REPLACE INTO investigations (
            report_id, alert_id, tender_id, auditor_notes, findings, status, pdf_path, generated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        rep_id,
        alert_row["alert_id"] if alert_row else None,
        tender_id,
        "Automated AI forensic audit package compiled.",
        t_row["ai_explanation"],
        "Generated",
        pdf_path,
        datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()

    return pdf_path
