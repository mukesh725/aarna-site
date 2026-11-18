import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'assets' / 'data'
DATA_DIR.mkdir(parents=True, exist_ok=True)
SCRIPTS_DIR = BASE_DIR / 'scripts'

# ==============================================================================
# 1. INSTITUTIONAL / UNIT DOSE PRODUCTS (22 items from Catalog Pages 4–9)
# ==============================================================================
inst_products = [
    {
        "id": "inst-1",
        "description": "Acetaminophen 500mg Tablets Unit Dose",
        "category": "Pain Relief & Fever",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0002-4",
        "caseSize": "100 tablets/box"
    },
    {
        "id": "inst-2",
        "description": "Diphenhydramine HCl 25mg Tablets Unit Dose",
        "category": "Allergy Relief",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0004-3",
        "caseSize": "100 tablets/box"
    },
    {
        "id": "inst-3",
        "description": "Senna 8.6mg Tablets Unit Dose",
        "category": "Digestive Health",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0006-4",
        "caseSize": "100 tablets/box"
    },
    {
        "id": "inst-4",
        "description": "Meclizine 25mg Tablets Unit Dose",
        "category": "Digestive Health",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0143-3",
        "caseSize": "100 tablets/box"
    },
    {
        "id": "inst-5",
        "description": "Aspirin 81mg Tablets Unit Dose",
        "category": "Pain Relief & Fever",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0003-3",
        "caseSize": "100 tablets/box"
    },
    {
        "id": "inst-6",
        "description": "Calcium Chewable Antacid (Peppermint) 500mg Tablets Unit Dose",
        "category": "Digestive Health",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0145-3",
        "caseSize": "100 tablets/box"
    },
    {
        "id": "inst-7",
        "description": "Calcium + Vitamin D 600mg/400IU Tablets Unit Dose",
        "category": "Vitamins & Supplements",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0025-2",
        "caseSize": "100 tablets/box"
    },
    {
        "id": "inst-8",
        "description": "Senna Syrup 8.6mg/5mL Oral Liquid Unit Dose",
        "category": "Digestive Health",
        "unit": "BOX",
        "packQty": "72",
        "ndc": "82568-0024-5",
        "caseSize": "72 cups/box"
    },
    {
        "id": "inst-9",
        "description": "Guaifenesin + Dextromethorphan Sugar Free Oral Liquid Unit Dose 100mg/10mg/10mL",
        "category": "Cough & Chest Congestion",
        "unit": "BOX",
        "packQty": "72",
        "ndc": "82568-0015-1",
        "caseSize": "72 cups/box"
    },
    {
        "id": "inst-10",
        "description": "Acetaminophen Oral Liquid (Bubble Gum) 160mg/5mL Unit Dose",
        "category": "Pain Relief & Fever",
        "unit": "BOX",
        "packQty": "72",
        "ndc": "82568-0008-5",
        "caseSize": "72 cups/box"
    },
    {
        "id": "inst-11",
        "description": "Acetaminophen Oral Liquid (Cherry) 500mg/15mL Unit Dose",
        "category": "Pain Relief & Fever",
        "unit": "BOX",
        "packQty": "72",
        "ndc": "82568-0149-5",
        "caseSize": "72 cups/box"
    },
    {
        "id": "inst-12",
        "description": "Ferrous Sulfate Oral Solution 220mg/5mL Unit Dose",
        "category": "Vitamins & Supplements",
        "unit": "BOX",
        "packQty": "72",
        "ndc": "82568-0072-5",
        "caseSize": "72 cups/box"
    },
    {
        "id": "inst-13",
        "description": "Multivitamin Oral Liquid 15mL Unit Dose",
        "category": "Vitamins & Supplements",
        "unit": "BOX",
        "packQty": "72",
        "ndc": "82568-0146-2",
        "caseSize": "72 cups/box"
    },
    {
        "id": "inst-14",
        "description": "Vitamin A&D Diaper Rash Ointment & Skin Protectant 5g Unit Dose",
        "category": "Topical & Skin Care",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0068-3",
        "caseSize": "100 packets/box"
    },
    {
        "id": "inst-15",
        "description": "Calmocare (Zinc Oxide 20.4% + Menthol 0.44%) Ointment 3.5g Unit Dose",
        "category": "Topical & Skin Care",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0062-4",
        "caseSize": "100 packets/box"
    },
    {
        "id": "inst-16",
        "description": "Hydrocortisone 1% Cream 0.9g Unit Dose",
        "category": "Topical & Skin Care",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0060-3",
        "caseSize": "100 packets/box"
    },
    {
        "id": "inst-17",
        "description": "Bacitracin Ointment 400IU/g 0.9g Unit Dose",
        "category": "Topical & Skin Care",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0147-2",
        "caseSize": "100 packets/box"
    },
    {
        "id": "inst-18",
        "description": "Petrolatum Ointment 5g Unit Dose",
        "category": "Topical & Skin Care",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0148-5",
        "caseSize": "100 packets/box"
    },
    {
        "id": "inst-19",
        "description": "Psyllium Husk Regular Powder 5g Unit Dose",
        "category": "Digestive Health",
        "unit": "BOX",
        "packQty": "30",
        "ndc": "82568-0029-5",
        "caseSize": "30 packets/box"
    },
    {
        "id": "inst-20",
        "description": "Psyllium Husk Orange Flavor Powder 5g Unit Dose",
        "category": "Digestive Health",
        "unit": "BOX",
        "packQty": "30",
        "ndc": "82568-0030-3",
        "caseSize": "30 packets/box"
    },
    {
        "id": "inst-21",
        "description": "Bisacodyl 10mg Suppositories 12ct Unit Dose",
        "category": "Digestive Health",
        "unit": "BOX",
        "packQty": "12",
        "ndc": "82568-0028-2",
        "caseSize": "12 suppositories/box"
    },
    {
        "id": "inst-22",
        "description": "Bisacodyl 10mg Suppositories 50ct Unit Dose",
        "category": "Digestive Health",
        "unit": "BOX",
        "packQty": "50",
        "ndc": "82568-0028-5",
        "caseSize": "50 suppositories/box"
    }
]

with open(DATA_DIR / 'institutional-products.json', 'w') as f:
    json.dump(inst_products, f, indent=2)

# ==============================================================================
# 2. MEDICAL SUPPLIES & DEVICES (23 items from Catalog Pages 18–20)
# ==============================================================================
devices_products = [
    {
        "id": "dev-1",
        "description": "ANTI-STATIC SPACE CHAMBERS ADULT 1CT",
        "category": "Spacer Chambers",
        "unit": "BOX",
        "packQty": "1",
        "ndc": "82568-0129-1"
    },
    {
        "id": "dev-2",
        "description": "ANTI-STATIC SPACE CHAMBERS CHILD 1CT",
        "category": "Spacer Chambers",
        "unit": "BOX",
        "packQty": "1",
        "ndc": "82568-0130-1"
    },
    {
        "id": "dev-3",
        "description": "ALCOHOL PREP PADS 100 CT",
        "category": "Alcohol Prep Pads",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0116-1"
    },
    {
        "id": "dev-4",
        "description": "INSULIN PEN NEEDLES 31 G - 4MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0111-4"
    },
    {
        "id": "dev-5",
        "description": "INSULIN PEN NEEDLES 31 G - 5MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0111-5"
    },
    {
        "id": "dev-6",
        "description": "INSULIN PEN NEEDLES 31 G - 6MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0111-6"
    },
    {
        "id": "dev-7",
        "description": "INSULIN PEN NEEDLES 31 G - 8MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0111-8"
    },
    {
        "id": "dev-8",
        "description": "INSULIN PEN NEEDLES 32 G - 4MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0112-4"
    },
    {
        "id": "dev-9",
        "description": "INSULIN PEN NEEDLES 32 G - 5MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0112-5"
    },
    {
        "id": "dev-10",
        "description": "INSULIN PEN NEEDLES 32 G - 6MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0112-6"
    },
    {
        "id": "dev-11",
        "description": "INSULIN PEN NEEDLES 32 G - 8MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0112-8"
    },
    {
        "id": "dev-12",
        "description": "INSULIN PEN NEEDLES 33 G - 4MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0113-4"
    },
    {
        "id": "dev-13",
        "description": "INSULIN PEN NEEDLES 33 G - 5MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0113-5"
    },
    {
        "id": "dev-14",
        "description": "INSULIN PEN NEEDLES 33 G - 6MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0113-6"
    },
    {
        "id": "dev-15",
        "description": "INSULIN PEN NEEDLES 33 G - 8MM 100 CT",
        "category": "Insulin Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0113-8"
    },
    {
        "id": "dev-16",
        "description": "TWIST LANCETS 31G 100 CT",
        "category": "Lancets",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0117-1"
    },
    {
        "id": "dev-17",
        "description": "SAFETY LANCETS 28G 100 CT",
        "category": "Lancets",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0118-1"
    },
    {
        "id": "dev-18",
        "description": "SAFETY LANCETS 30G 100 CT",
        "category": "Lancets",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0119-1"
    },
    {
        "id": "dev-19",
        "description": "INSULIN SAFETY PEN NEEDLES 31 G - 4 MM",
        "category": "Safety Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0114-4"
    },
    {
        "id": "dev-20",
        "description": "INSULIN SAFETY PEN NEEDLES 31 G - 5 MM",
        "category": "Safety Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0114-5"
    },
    {
        "id": "dev-21",
        "description": "INSULIN SAFETY PEN NEEDLES 32 G - 4 MM",
        "category": "Safety Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0115-4"
    },
    {
        "id": "dev-22",
        "description": "INSULIN SAFETY PEN NEEDLES 32 G - 5 MM",
        "category": "Safety Pen Needles",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0115-5"
    },
    {
        "id": "dev-23",
        "description": "ADULT UNDERPADS 4X 25 PACK (100 PACK)",
        "category": "Underpads",
        "unit": "BOX",
        "packQty": "100",
        "ndc": "82568-0125-1"
    }
]

with open(DATA_DIR / 'medical-devices.json', 'w') as f:
    json.dump(devices_products, f, indent=2)

# ==============================================================================
# 3. RETAIL OTC MEDICATIONS (Pages 10–17 + Expanded Product Line)
# ==============================================================================
retail_products_raw = [
    # Page 10: Pain Reliever & Fever Reducer
    ("ACETAMINOPHEN 325 MG 100 CT TABS", "EA", "48", "82568-0001-1", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 325 MG 1000 CT TABS", "EA", "12", "82568-0001-2", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 325 MG 100 CT UD PACK", "EA", "48", "82568-0001-3", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 500 MG 100 CT TABS", "EA", "48", "82568-0002-1", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 500 MG 1000 TABS", "EA", "12", "82568-0002-2", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 500 MG 100 CT UD PACK", "EA", "48", "82568-0002-3", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL LIQUID-BUBBLE GUM FLAVOR-4OZ", "EA", "48", "82568-0008-4", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL LIQUID-BUBBLE GUM FLAVOR-8OZ", "EA", "24", "82568-0008-8", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL LIQUID-BUBBLE GUM FLAVOR-16OZ", "EA", "12", "82568-0008-6", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL LIQUID-CHERRY FLAVOR-4OZ", "EA", "48", "82568-0007-4", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL LIQUID-CHERRY FLAVOR-8 OZ", "EA", "24", "82568-0007-8", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL LIQUID-CHERRY FLAVOR-16OZ", "EA", "12", "82568-0007-6", "Pain Relief & Fever"),

    # Page 11: Pain Reliever & Fever Reducer
    ("ACETAMINOPHEN 160MG PER 5ML ORAL LIQUID-GRAPE FLAVOR-4OZ", "EA", "48", "82568-0009-4", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL LIQUID-GRAPE FLAVOR-8OZ", "EA", "24", "82568-0009-8", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL LIQUID-GRAPE FLAVOR-16OZ", "EA", "12", "82568-0009-6", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL SUSPENSION-CHERRY FLAVOR-4OZ", "EA", "48", "82568-0011-4", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL SUSPENSION-CHERRY FLAVOR-8OZ", "EA", "24", "82568-0011-8", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL SUSPENSION-CHERRY FLAVOR-16OZ", "EA", "12", "82568-0011-6", "Pain Relief & Fever"),
    ("LOW DOSE ASPIRIN 81MG 120 CT TABS", "EA", "48", "82568-0003-1", "Pain Relief & Fever"),
    ("LOW DOSE ASPIRIN 81 MG 1000 TABS", "EA", "24", "82568-0003-2", "Pain Relief & Fever"),

    # Page 12: Allergy Relief
    ("DIPHENHYDRAMINE HCL 25 MG 100 CAPS", "EA", "96", "82568-0004-1", "Allergy Relief"),
    ("DIPHENHYDRAMINE HCL 25 MG 1000 CAPS", "EA", "12", "82568-0004-2", "Allergy Relief"),
    ("DIPHENHYDRAMINE HCL 50 MG 100 CAPS", "EA", "96", "82568-0005-1", "Allergy Relief"),
    ("DIPHENHYDRAMINE HCL 50 MG 1000 CAPS", "EA", "12", "82568-0005-2", "Allergy Relief"),
    ("DIPHENHYDRAMINE HCL ORAL SOLUTION 12.5MG/5ML-4OZ", "EA", "48", "82568-0016-4", "Allergy Relief"),
    ("DIPHENHYDRAMINE HCL ORAL SOLUTION 12.5MG/5ML-8OZ", "EA", "24", "82568-0016-8", "Allergy Relief"),
    ("DIPHENHYDRAMINE HCL ORAL SOLUTION 12.5MG/5ML-16OZ", "EA", "12", "82568-0016-6", "Allergy Relief"),

    # Page 13: Cough & Chest Congestion
    ("TUSSIN GUAIFENESIN REGULAR 4 OZ", "EA", "48", "82568-0013-4", "Cough & Congestion"),
    ("TUSSIN GUAIFENESIN REGULAR 8 OZ", "EA", "24", "82568-0013-8", "Cough & Congestion"),
    ("TUSSIN GUAIFENESIN REGULAR 16OZ", "EA", "12", "82568-0013-6", "Cough & Congestion"),
    ("TUSSIN GUAIFENESIN SUGAR FREE 4 OZ", "EA", "48", "82568-0012-4", "Cough & Congestion"),
    ("TUSSIN GUAIFENESIN SUGAR FREE 8 OZ", "EA", "24", "82568-0012-8", "Cough & Congestion"),
    ("TUSSIN GUAIFENESIN SUGAR FREE 16OZ", "EA", "12", "82568-0012-6", "Cough & Congestion"),
    ("TUSSIN DM (DEXTROMETHORPHAN HBR & GUAIFENESIN) 20-200MG 4OZ", "EA", "48", "82568-0014-4", "Cough & Congestion"),
    ("TUSSIN DM (DEXTROMETHORPHAN HBR & GUAIFENESIN) 20-200MG 8 OZ", "EA", "24", "82568-0014-8", "Cough & Congestion"),
    ("TUSSIN DM (DEXTROMETHORPHAN HBR & GUAIFENESIN) 20-200MG 16OZ", "EA", "12", "82568-0014-6", "Cough & Congestion"),
    ("TUSSIN DM SUGAR FREE (DEXTROMETHORPHAN HBR & GUAIFENESIN) 20-200MG 4OZ", "EA", "48", "82568-0015-4", "Cough & Congestion"),
    ("TUSSIN DM SUGAR FREE (DEXTROMETHORPHAN HBR & GUAIFENESIN) 20-200MG 8 OZ", "EA", "24", "82568-0015-8", "Cough & Congestion"),
    ("TUSSIN DM SUGAR FREE (DEXTROMETHORPHAN HBR & GUAIFENESIN) 20-200MG 16OZ", "EA", "12", "82568-0015-6", "Cough & Congestion"),

    # Page 14: Infants Gas Relief Drops
    ("SIMETHICONE INFANT'S GAS RELIEF DROPS -30 ML", "EA", "48", "82568-0017-3", "Digestive Health"),
    ("SIMETHICONE INFANT'S GAS RELIEF DROPS -4FL.OZ (118 mL)", "EA", "48", "82568-0017-4", "Digestive Health"),

    # Page 15: Constipation Relief
    ("MAGNESIUM CITRATE LIQUID -LEMON FLAVOR -12 X 10 OZ", "EA", "12 PACK", "82568-0051-1", "Digestive Health"),
    ("MAGNESIUM CITRATE LIQUID -CHERRY FLAVOR -12 X 10 OZ", "EA", "12 PACK", "82568-0053-1", "Digestive Health"),
    ("MAGNESIUM CITRATE LIQUID -GRAPE FLAVOR-12 X 10 OZ", "EA", "12 PACK", "82568-0052-1", "Digestive Health"),
    ("SENNA NATRUAL LAXATIVE SYRUP 8.8MG/5ML-8OZ", "EA", "24", "82568-0024-8", "Digestive Health"),
    ("SENNA NATRUAL LAXATIVE SYRUP SUGAR FREE 8.8MG/5ML-8OZ", "EA", "24", "82568-0023-8", "Digestive Health"),
    ("SENNA TABLETS 8.6MG 100 CT", "EA", "96", "82568-0006-1", "Digestive Health"),
    ("SENNA TABLETS 8.6 MG 1000 CT", "EA", "24", "82568-0006-2", "Digestive Health"),
    ("SENNA TABLETS 8.6.MG UD PACK- 100CT", "EA", "48", "82568-0006-3", "Digestive Health"),

    # Pages 16 & 17: Pediatric Drops
    ("PEDIATRIC FE-VITE (IRON) DROPS 50 ML", "EA", "24", "82568-0032-5", "Pediatric Supplements"),
    ("PEDIATRIC POLY-VITE (MULTIVITAMIN) DROPS 50 ML", "EA", "24", "82568-0033-5", "Pediatric Supplements"),
    ("PEDIATRIC POLY-VITE WITH IRON DROPS 50 ML", "EA", "24", "82568-0034-5", "Pediatric Supplements"),
    ("PEDIATRIC TRI-VITE (VITAMIN A, C & D) DROPS 50 ML", "EA", "24", "82568-0035-5", "Pediatric Supplements"),
    ("PEDIATRIC D-VITE (VITAMIN D) DROPS 50 ML", "EA", "24", "82568-0031-5", "Pediatric Supplements"),

    # Suppositories & Specialty
    ("BISACODYL SUPPOSITORIES USP 10MG -12 PACK UD", "EA", "72", "82568-0028-2", "Digestive Health"),
    ("BISACODYL SUPPOSITORIES USP 10MG -50 PACK UD", "EA", "12", "82568-0028-5", "Digestive Health"),

    # Topical & Extended Lines
    ("ANLIDO™ LIDOCAINE 4% PAIN RELIEVING PATCH 24 HOURS 1CT Inner pack", "EA", "—", "82568-0042-1", "Pain Relief & Fever"),
    ("ANLIDO™ LIDOCAINE 4% PAIN RELIEVING PATCH 24 HOURS 5CT", "EA", "48", "82568-0042-2", "Pain Relief & Fever"),
    ("ANLIDO™ LIDOCAINE 4% PAIN RELIEVING PATCH 24 HOURS 15CT", "EA", "24", "82568-0042-3", "Pain Relief & Fever"),
    ("ANLIDO™ LIDOCAINE 4% PAIN RELIEVING PATCH 24 HOURS 30CT", "EA", "10", "82568-0042-4", "Pain Relief & Fever"),
    ("BENZOYL PEROXIDE 5 % TOPICAL WASH 5 OZ", "EA", "24", "82568-0049-5", "Topical & Skin Care"),
    ("BENZOYL PEROXIDE 5% TOPICAL WASH 8 OZ", "EA", "24", "82568-0049-8", "Topical & Skin Care"),
    ("BENZOYL PEROXIDE 10 % TOPICAL WASH 5 OZ", "EA", "24", "82568-0054-5", "Topical & Skin Care"),
    ("BENZOYL PEROXIDE 10 % TOPICAL WASH 8 OZ", "EA", "24", "82568-0054-8", "Topical & Skin Care"),
    ("CLOTRIMAZOLE USP 1% SOLUTION 10ML-OTC", "EA", "24", "82568-0161-1", "Topical & Skin Care"),
    ("CLOTRIMAZOLE USP 1% SOLUTION 30ML-OTC", "EA", "24", "82568-0161-3", "Topical & Skin Care"),
    ("FERROUS SULFATE 220MG/5ML LIQUID-16OZ", "EA", "12", "82568-0019-6", "Vitamins & Iron"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL SUSPENSION-GRAPE FLAVOR-2OZ", "EA", "48", "82568-0010-2", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL SUSPENSION-GRAPE FLAVOR-4OZ", "EA", "48", "82568-0010-4", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL SUSPENSION-GRAPE FLAVOR-8OZ", "EA", "24", "82568-0010-8", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL SUSPENSION-GRAPE FLAVOR-16OZ", "EA", "12", "82568-0010-6", "Pain Relief & Fever"),
    ("ACETAMINOPHEN 160MG PER 5ML ORAL SUSPENSION-CHERRY FLAVOR-2OZ", "EA", "48", "82568-0011-2", "Pain Relief & Fever")
]

retail_products = []
for idx, (desc, unit, qty, ndc, cat) in enumerate(retail_products_raw):
    retail_products.append({
        "id": f"ret-{idx+1}",
        "description": desc,
        "category": cat,
        "unit": unit,
        "caseQty": qty,
        "ndc": ndc
    })

with open(DATA_DIR / 'retail-products.json', 'w') as f:
    json.dump(retail_products, f, indent=2)

# ==============================================================================
# 4. WRITE SCRIPTS/PRODUCTS-DATA.JS (window.AARNA_DATA)
# ==============================================================================
js_content = f"""// AARNA Products Database - Synchronized with Official Catalog
window.AARNA_DATA = {{
  retail: {json.dumps(retail_products, indent=2)},
  devices: {json.dumps(devices_products, indent=2)},
  institutional: {json.dumps(inst_products, indent=2)}
}};
"""

with open(SCRIPTS_DIR / 'products-data.js', 'w') as f:
    f.write(js_content)

print(f"Successfully generated:")
print(f" - {len(inst_products)} Institutional Unit Dose products")
print(f" - {len(devices_products)} Medical Devices & Supplies")
print(f" - {len(retail_products)} Retail Products")
print(f" - scripts/products-data.js successfully written.")
