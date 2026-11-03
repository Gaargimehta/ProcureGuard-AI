import random
import uuid
import datetime
import os
import json
import pandas as pd
import numpy as np
from app.database.db import get_db_connection, init_db

DATASET_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "datasets")
os.makedirs(DATASET_DIR, exist_ok=True)

CATEGORIES = [
    "Civil Infrastructure & Highway",
    "Medical Equipment & Hospital Supplies",
    "IT Systems & Cloud Infrastructure",
    "Security & Surveillance",
    "Municipal Environmental Services",
    "School Education Logistics"
]

LOCATIONS = [
    "Capital Metropolitan",
    "Northern Industrial Hub",
    "Southern Port Authority",
    "Eastern Riverine District",
    "Western Technology Corridor",
    "Central Highlands District",
    "Special Economic Zone Alpha"
]

SUPPLIER_NAMES = [
    # Cartel Ring 1: Bid Rotation (Civil Infrastructure)
    ("BID-101", "Apex Infrastructure Ltd", "Civil Infrastructure & Highway", "Cartel Ring Alpha"),
    ("BID-102", "BuildTech Engineering Corp", "Civil Infrastructure & Highway", "Cartel Ring Alpha"),
    ("BID-103", "Vertex Highway Constructors", "Civil Infrastructure & Highway", "Cartel Ring Alpha"),

    # Cartel Ring 2: Cover Bidding / Sham Bidding (Medical Equipment)
    ("BID-201", "MedSupply Global Solutions", "Medical Equipment & Hospital Supplies", "Cartel Ring Beta"),
    ("BID-202", "HealthCare Innovations Inc", "Medical Equipment & Hospital Supplies", "Cartel Ring Beta"),
    ("BID-203", "BioPharma Direct Logistics", "Medical Equipment & Hospital Supplies", "Cartel Ring Beta"),

    # Cartel Ring 3: Market Allocation / Token Bidding (IT Systems)
    ("BID-301", "CyberShield Systems", "IT Systems & Cloud Infrastructure", "Cartel Ring Gamma"),
    ("BID-302", "SecureNet Technologies", "IT Systems & Cloud Infrastructure", "Cartel Ring Gamma"),
    ("BID-303", "OmniData Enterprise", "IT Systems & Cloud Infrastructure", "Cartel Ring Gamma"),

    # Legitimate / Competitive Suppliers (30+ suppliers)
    ("BID-401", "Horizon Engineering Works", "Civil Infrastructure & Highway", None),
    ("BID-402", "Atlas Paving & Concrete", "Civil Infrastructure & Highway", None),
    ("BID-403", "Pinnacle Bridge Works", "Civil Infrastructure & Highway", None),
    ("BID-404", "Keystone Heavy Construction", "Civil Infrastructure & Highway", None),
    ("BID-405", "Metro Roadworks Ltd", "Civil Infrastructure & Highway", None),

    ("BID-501", "CareFirst Life Sciences", "Medical Equipment & Hospital Supplies", None),
    ("BID-502", "Apex MedTech Instruments", "Medical Equipment & Hospital Supplies", None),
    ("BID-503", "Sanitas Clinical Supplies", "Medical Equipment & Hospital Supplies", None),
    ("BID-504", "Pulse Diagnostic Devices", "Medical Equipment & Hospital Supplies", None),
    ("BID-505", "Novus BioEquipment Corp", "Medical Equipment & Hospital Supplies", None),

    ("BID-601", "CloudMatrix Solutions", "IT Systems & Cloud Infrastructure", None),
    ("BID-602", "Synergy IT Services", "IT Systems & Cloud Infrastructure", None),
    ("BID-603", "Quantum Networks Inc", "IT Systems & Cloud Infrastructure", None),
    ("BID-604", "NextGen Enterprise Systems", "IT Systems & Cloud Infrastructure", None),
    ("BID-605", "Vanguard Cyber Analytics", "IT Systems & Cloud Infrastructure", None),

    ("BID-701", "Aegis Security Group", "Security & Surveillance", None),
    ("BID-702", "Fortress Perimeter Systems", "Security & Surveillance", None),
    ("BID-703", "Sentinel Guard Technologies", "Security & Surveillance", None),
    ("BID-704", "EagleEye Video Surveillance", "Security & Surveillance", None),
    ("BID-705", "Titan Defense Logistics", "Security & Surveillance", None),

    ("BID-801", "EcoClean Municipal Waste", "Municipal Environmental Services", None),
    ("BID-802", "GreenTerra Waste Disposal", "Municipal Environmental Services", None),
    ("BID-803", "BioRecycle Solutions", "Municipal Environmental Services", None),
    ("BID-804", "CleanCity Sanitation Ltd", "Municipal Environmental Services", None),

    ("BID-901", "EduFurnish Supply Co", "School Education Logistics", None),
    ("BID-902", "Universal School Gear", "School Education Logistics", None),
    ("BID-903", "Scholastic Print & Paper", "School Education Logistics", None),
    ("BID-904", "Beacon Educational Logistics", "School Education Logistics", None),
    ("BID-905", "Academic Hub Outfitters", "School Education Logistics", None),
]

def generate_synthetic_dataset(num_tenders: int = 120, seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    init_db()

    tenders = []
    bids = []
    bidder_stats = {
        item[0]: {
            "bidder_id": item[0],
            "name": item[1],
            "category": item[2],
            "cartel_group": item[3],
            "total_bids": 0,
            "total_wins": 0,
            "total_won_value": 0.0,
            "bid_ratios": [],
            "risk_score": 0.0,
            "risk_level": "Low",
            "suspicious_flags": [],
            "created_at": "2024-01-15 09:00:00"
        }
        for item in SUPPLIER_NAMES
    }

    start_date = datetime.date(2025, 1, 10)
    current_date = start_date

    cartel_ring_1 = [s for s in SUPPLIER_NAMES if s[3] == "Cartel Ring Alpha"]
    cartel_ring_2 = [s for s in SUPPLIER_NAMES if s[3] == "Cartel Ring Beta"]
    cartel_ring_3 = [s for s in SUPPLIER_NAMES if s[3] == "Cartel Ring Gamma"]

    rotation_counter_1 = 0
    cover_counter_2 = 0

    for i in range(1, num_tenders + 1):
        tender_id = f"TND-2025-{1000 + i}"
        current_date += datetime.timedelta(days=random.choice([1, 2, 3]))
        date_str = current_date.strftime("%Y-%m-%d")

        # Decide scenario
        # 1-15: Bid Rotation (Civil Infrastructure)
        # 16-27: Cover Bidding (Medical Equipment)
        # 28-36: Market Allocation / Extreme Similarity (IT Systems)
        # 37-120: Normal Competitive Bidding across various sectors
        if 1 <= i <= 15:
            scenario = "Simulated Bid Rotation"
            category = "Civil Infrastructure & Highway"
            estimated_value = round(random.uniform(4_500_000, 18_000_000), 2)
            title = f"Phase {i} Highway Reconstruction and Grade Separation"
            location = random.choice(LOCATIONS[:3])

            # Systematic rotation of winner among the 3 cartel members
            designated_winner_idx = rotation_counter_1 % len(cartel_ring_1)
            rotation_counter_1 += 1
            participating = list(cartel_ring_1)
            
            # Occasionally add 1 outside bidder who is outpriced
            if random.random() < 0.4:
                outsider = random.choice([s for s in SUPPLIER_NAMES if s[2] == category and not s[3]])
                participating.append(outsider)

            tender_bids = []
            winner_bidder = participating[designated_winner_idx]
            
            # Designated winner submits slightly below estimate (e.g. 98.2% - 99.4%)
            win_ratio = round(random.uniform(0.981, 0.995), 4)
            win_amount = round(estimated_value * win_ratio, 2)
            
            ip_base = "192.168.42."

            for idx, p in enumerate(participating):
                p_id, p_name, _, _ = p
                is_win = (p_id == winner_bidder[0])
                if is_win:
                    bid_amount = win_amount
                    ratio = win_ratio
                else:
                    # Sham / cover bid: deliberately 6% to 14% higher than winner
                    ratio = round(win_ratio + random.uniform(0.065, 0.135), 4)
                    bid_amount = round(estimated_value * ratio, 2)
                
                # Shared IP subnet pattern in cartels
                ip = f"{ip_base}{10 + idx}"
                time_offset = random.randint(120, 360) # within minutes
                bid_time = f"{date_str} 14:{time_offset // 60:02d}:{time_offset % 60:02d}"

                tender_bids.append({
                    "bid_id": f"BID-{tender_id}-{p_id}",
                    "tender_id": tender_id,
                    "bidder_id": p_id,
                    "bidder_name": p_name,
                    "bid_amount": bid_amount,
                    "bid_to_estimate_ratio": ratio,
                    "is_winner": 1 if is_win else 0,
                    "bid_timestamp": bid_time,
                    "ip_address": ip
                })

        elif 16 <= i <= 28:
            scenario = "Simulated Cover Bidding"
            category = "Medical Equipment & Hospital Supplies"
            estimated_value = round(random.uniform(2_200_000, 9_500_000), 2)
            title = f"Specialized Surgical Imaging Systems Batch {i - 15}"
            location = random.choice(LOCATIONS[2:5])

            # In cover bidding, one designated company always wins, others provide token quotes
            # with suspicious bid similarity (differing by exact fractions like 0.5% or 0.75%)
            designated_winner = cartel_ring_2[0] # MedSupply Global Solutions always wins
            participating = list(cartel_ring_2)
            if random.random() < 0.3:
                outsider = random.choice([s for s in SUPPLIER_NAMES if s[2] == category and not s[3]])
                participating.append(outsider)

            win_ratio = round(random.uniform(0.985, 0.998), 4)
            win_amount = round(estimated_value * win_ratio, 2)
            ip_subnet = "10.45.88." # Exact same subnet submissions

            tender_bids = []
            for idx, p in enumerate(participating):
                p_id, p_name, _, _ = p
                is_win = (p_id == designated_winner[0])
                if is_win:
                    bid_amount = win_amount
                    ratio = win_ratio
                elif p[3] == "Cartel Ring Beta":
                    # Suspiciously close cover bid with exact offset (0.8% or 1.2% higher)
                    exact_offset = 0.008 * (idx)
                    ratio = round(win_ratio + exact_offset, 4)
                    bid_amount = round(estimated_value * ratio, 2)
                else:
                    ratio = round(random.uniform(1.05, 1.15), 4)
                    bid_amount = round(estimated_value * ratio, 2)

                tender_bids.append({
                    "bid_id": f"BID-{tender_id}-{p_id}",
                    "tender_id": tender_id,
                    "bidder_id": p_id,
                    "bidder_name": p_name,
                    "bid_amount": bid_amount,
                    "bid_to_estimate_ratio": ratio,
                    "is_winner": 1 if is_win else 0,
                    "bid_timestamp": f"{date_str} 10:15:{10 + idx * 4:02d}", # Submitted within seconds
                    "ip_address": f"{ip_subnet}{100 + idx}"
                })

        elif 29 <= i <= 38:
            scenario = "Simulated Market Allocation"
            category = "IT Systems & Cloud Infrastructure"
            estimated_value = round(random.uniform(3_000_000, 12_000_000), 2)
            title = f"Enterprise Government Cloud & Security Node {i - 28}"
            location = "Central Highlands District" if i % 2 == 0 else "Western Technology Corridor"

            # Allocate by territory or rotate with narrow win margins
            designated_winner = cartel_ring_3[i % len(cartel_ring_3)]
            participating = list(cartel_ring_3)
            
            win_ratio = round(random.uniform(0.975, 0.988), 4)
            win_amount = round(estimated_value * win_ratio, 2)

            tender_bids = []
            for idx, p in enumerate(participating):
                p_id, p_name, _, _ = p
                is_win = (p_id == designated_winner[0])
                ratio = win_ratio if is_win else round(win_ratio + 0.015 * (idx + 1), 4)
                bid_amount = round(estimated_value * ratio, 2)
                
                tender_bids.append({
                    "bid_id": f"BID-{tender_id}-{p_id}",
                    "tender_id": tender_id,
                    "bidder_id": p_id,
                    "bidder_name": p_name,
                    "bid_amount": bid_amount,
                    "bid_to_estimate_ratio": ratio,
                    "is_winner": 1 if is_win else 0,
                    "bid_timestamp": f"{date_str} 11:{20 + idx * 8:02d}:00",
                    "ip_address": f"172.16.{10 + idx}.24"
                })

        else:
            # Normal competitive bidding
            scenario = "Normal Competitive"
            category = random.choice(CATEGORIES)
            estimated_value = round(random.uniform(800_000, 15_000_000), 2)
            
            category_titles = {
                "Civil Infrastructure & Highway": f"Municipal Roadway Modernization Sector {i}",
                "Medical Equipment & Hospital Supplies": f"Regional Hospital Diagnostic Diagnostic Fleet {i}",
                "IT Systems & Cloud Infrastructure": f"District Public Records Digitalization Unit {i}",
                "Security & Surveillance": f"Integrated Smart City CCTV Grid Expansion {i}",
                "Municipal Environmental Services": f"Comprehensive Urban Waste Recycling Facility {i}",
                "School Education Logistics": f"Unified Public School STEM Lab Supply & Desks {i}"
            }
            title = category_titles.get(category, f"Public Procurement Package {i}")
            location = random.choice(LOCATIONS)

            eligible = [s for s in SUPPLIER_NAMES if s[2] == category]
            if len(eligible) < 3:
                eligible = SUPPLIER_NAMES
            
            num_bidders = random.randint(4, min(7, len(eligible)))
            participating = random.sample(eligible, num_bidders)

            # Legitimate competitive pricing: ratios between 0.88 and 1.08 with genuine spread
            bids_with_ratios = []
            for p in participating:
                ratio = round(random.uniform(0.885, 1.075), 4)
                bids_with_ratios.append((p, ratio))
            
            # Lowest valid bid wins
            bids_with_ratios.sort(key=lambda x: x[1])
            winner_tuple = bids_with_ratios[0]

            tender_bids = []
            for idx, (p, ratio) in enumerate(bids_with_ratios):
                p_id, p_name, _, _ = p
                is_win = (idx == 0)
                bid_amount = round(estimated_value * ratio, 2)
                # Diverse independent IP addresses
                ip = f"{random.randint(24, 210)}.{random.randint(10, 240)}.{random.randint(1, 250)}.{random.randint(2, 254)}"
                bid_time = f"{date_str} {random.randint(9, 16):02d}:{random.randint(10, 59):02d}:{random.randint(10, 59):02d}"

                tender_bids.append({
                    "bid_id": f"BID-{tender_id}-{p_id}",
                    "tender_id": tender_id,
                    "bidder_id": p_id,
                    "bidder_name": p_name,
                    "bid_amount": bid_amount,
                    "bid_to_estimate_ratio": ratio,
                    "is_winner": 1 if is_win else 0,
                    "bid_timestamp": bid_time,
                    "ip_address": ip
                })

        # Sort tender bids by amount ascending so winning bid is lowest
        tender_bids.sort(key=lambda x: x["bid_amount"])
        for idx, b in enumerate(tender_bids):
            b["is_winner"] = 1 if idx == 0 else 0
        
        winning_bid = tender_bids[0]

        # Update stats
        for b in tender_bids:
            b_id = b["bidder_id"]
            if b_id in bidder_stats:
                bidder_stats[b_id]["total_bids"] += 1
                bidder_stats[b_id]["bid_ratios"].append(b["bid_to_estimate_ratio"])
                if b["is_winner"]:
                    bidder_stats[b_id]["total_wins"] += 1
                    bidder_stats[b_id]["total_won_value"] += b["bid_amount"]

        bids.extend(tender_bids)

        tenders.append({
            "tender_id": tender_id,
            "title": title,
            "category": category,
            "location": location,
            "estimated_value": estimated_value,
            "tender_date": date_str,
            "num_bidders": len(tender_bids),
            "winning_bid": winning_bid["bid_amount"],
            "winning_supplier_id": winning_bid["bidder_id"],
            "winning_supplier_name": winning_bid["bidder_name"],
            "risk_score": 0.0, # Updated by detection engine
            "risk_level": "Low",
            "status": "Completed",
            "simulation_scenario": scenario,
            "ai_explanation": "Pending baseline detection inference.",
            "contributing_indicators": "[]",
            "created_at": f"{date_str} 18:00:00"
        })

    # Finalize bidder records
    final_bidders = []
    for b_id, b_data in bidder_stats.items():
        total_bids = b_data["total_bids"]
        total_wins = b_data["total_wins"]
        win_rate = round(total_wins / total_bids, 3) if total_bids > 0 else 0.0
        avg_ratio = round(sum(b_data["bid_ratios"]) / len(b_data["bid_ratios"]), 4) if b_data["bid_ratios"] else 1.0

        final_bidders.append({
            "bidder_id": b_id,
            "name": b_data["name"],
            "category": b_data["category"],
            "total_bids": total_bids,
            "total_wins": total_wins,
            "win_rate": win_rate,
            "total_won_value": round(b_data["total_won_value"], 2),
            "avg_bid_ratio": avg_ratio,
            "risk_score": 0.0,
            "risk_level": "Low",
            "suspicious_flags": json.dumps([]),
            "cartel_group": b_data["cartel_group"],
            "created_at": b_data["created_at"]
        })

    # Persist to database
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM tenders")
    cursor.execute("DELETE FROM bids")
    cursor.execute("DELETE FROM bidders")
    cursor.execute("DELETE FROM alerts")
    cursor.execute("DELETE FROM investigations")

    for t in tenders:
        cursor.execute("""
            INSERT INTO tenders (
                tender_id, title, category, location, estimated_value, tender_date,
                num_bidders, winning_bid, winning_supplier_id, winning_supplier_name,
                risk_score, risk_level, status, simulation_scenario, ai_explanation,
                contributing_indicators, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t["tender_id"], t["title"], t["category"], t["location"], t["estimated_value"],
            t["tender_date"], t["num_bidders"], t["winning_bid"], t["winning_supplier_id"],
            t["winning_supplier_name"], t["risk_score"], t["risk_level"], t["status"],
            t["simulation_scenario"], t["ai_explanation"], t["contributing_indicators"],
            t["created_at"]
        ))

    for b in bids:
        cursor.execute("""
            INSERT INTO bids (
                bid_id, tender_id, bidder_id, bidder_name, bid_amount,
                bid_to_estimate_ratio, is_winner, bid_timestamp, ip_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            b["bid_id"], b["tender_id"], b["bidder_id"], b["bidder_name"],
            b["bid_amount"], b["bid_to_estimate_ratio"], b["is_winner"],
            b["bid_timestamp"], b["ip_address"]
        ))

    for bdr in final_bidders:
        cursor.execute("""
            INSERT INTO bidders (
                bidder_id, name, category, total_bids, total_wins, win_rate,
                total_won_value, avg_bid_ratio, risk_score, risk_level,
                suspicious_flags, cartel_group, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            bdr["bidder_id"], bdr["name"], bdr["category"], bdr["total_bids"],
            bdr["total_wins"], bdr["win_rate"], bdr["total_won_value"],
            bdr["avg_bid_ratio"], bdr["risk_score"], bdr["risk_level"],
            bdr["suspicious_flags"], bdr["cartel_group"], bdr["created_at"]
        ))

    conn.commit()
    conn.close()

    # Also save raw CSVs
    df_tenders = pd.DataFrame(tenders)
    df_bids = pd.DataFrame(bids)
    df_bidders = pd.DataFrame(final_bidders)

    # Merged flat CSV for auditor download / inspection
    df_merged = df_bids.merge(df_tenders[["tender_id", "title", "category", "location", "estimated_value", "tender_date", "simulation_scenario"]], on="tender_id")
    
    raw_csv_path = os.path.join(DATASET_DIR, "procurement_tenders_raw.csv")
    df_merged.to_csv(raw_csv_path, index=False)
    
    print(f"Generated {len(tenders)} tenders, {len(bids)} bids, and {len(final_bidders)} bidders.")
    print(f"Saved raw dataset to: {raw_csv_path}")
    return len(tenders), len(bids), len(final_bidders)

if __name__ == "__main__":
    generate_synthetic_dataset()
