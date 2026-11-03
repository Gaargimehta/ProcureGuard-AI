import sqlite3
import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "datasets", "procureguard.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tenders (
        tender_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        estimated_value REAL NOT NULL,
        tender_date TEXT NOT NULL,
        num_bidders INTEGER NOT NULL,
        winning_bid REAL,
        winning_supplier_id TEXT,
        winning_supplier_name TEXT,
        risk_score REAL DEFAULT 0.0,
        risk_level TEXT DEFAULT 'Low',
        status TEXT DEFAULT 'Completed',
        simulation_scenario TEXT DEFAULT 'Normal Competitive',
        ai_explanation TEXT,
        contributing_indicators TEXT,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bids (
        bid_id TEXT PRIMARY KEY,
        tender_id TEXT NOT NULL,
        bidder_id TEXT NOT NULL,
        bidder_name TEXT NOT NULL,
        bid_amount REAL NOT NULL,
        bid_to_estimate_ratio REAL NOT NULL,
        is_winner INTEGER DEFAULT 0,
        bid_timestamp TEXT,
        ip_address TEXT,
        FOREIGN KEY (tender_id) REFERENCES tenders (tender_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bidders (
        bidder_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        total_bids INTEGER DEFAULT 0,
        total_wins INTEGER DEFAULT 0,
        win_rate REAL DEFAULT 0.0,
        total_won_value REAL DEFAULT 0.0,
        avg_bid_ratio REAL DEFAULT 1.0,
        risk_score REAL DEFAULT 0.0,
        risk_level TEXT DEFAULT 'Low',
        suspicious_flags TEXT,
        cartel_group TEXT,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        alert_id TEXT PRIMARY KEY,
        tender_id TEXT NOT NULL,
        bidder_group TEXT NOT NULL,
        risk_score REAL NOT NULL,
        risk_level TEXT NOT NULL,
        pattern_type TEXT NOT NULL,
        explanation TEXT NOT NULL,
        status TEXT DEFAULT 'New',
        indicators_json TEXT,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS investigations (
        report_id TEXT PRIMARY KEY,
        alert_id TEXT,
        tender_id TEXT NOT NULL,
        auditor_notes TEXT,
        findings TEXT,
        status TEXT DEFAULT 'Draft',
        pdf_path TEXT,
        generated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_meta (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_PATH)
