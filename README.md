# Aarna Pharmaceuticals & Healthcare

> Enterprise Web Platform & High-Precision Healthcare Product Catalog

Aarna Pharmaceuticals is a premier healthcare manufacturer and institutional supplier, specializing in pre-filled unit-dose oral liquid cups, 71+ high-efficacy OTC formulas, hospital-grade medical supplies, and private-label contract manufacturing.

---

## 🌟 Key Features

- **Editorial UI / UX**: Modern, responsive healthcare visual identity built with high typographic hierarchy (`Outfit` font family) and curated color tokens.
- **Dynamic Product Catalog**: Real-time client-side search, filtering, and NDC lookups across 104+ products:
  - **Institutional Products**: 10 unit-dose oral liquid medications for hospital facilities.
  - **Retail OTC Line**: 71+ high-efficacy OTC formulas across pain relief, cough/cold, allergy, and digestive care.
  - **Medical Devices & Clinical Supplies**: 23 sterile clinical instruments, aerosol spacers, pen needles, and diagnostic equipment.
- **Institutional Wholesale RFPs**: Direct procurement and sample inquiry pipelines with wholesale pricing calculations.
- **Catalog Portal / Dashboard**: Internal product catalog browser and management interface with live NDC validation.

---

## 📁 Repository Architecture

```text
├── assets/                     # Static media and product data
│   ├── data/                   # Structured JSON product catalogs
│   ├── downloads/              # Official PDF product catalogs
│   ├── images/                 # Optimized product photos & hero visuals
│   └── logos/                  # High-resolution partner & brand logos
├── css/                        # Stylesheets & CSS design tokens
│   ├── styles.css              # Master stylesheet (global tokens, layouts, cards)
│   └── dashboard.css           # Catalog portal & data tables styling
├── docs/                       # Architecture & governance contracts
│   ├── architecture.md         # Full technical system architecture
│   ├── security-standards.md   # Secure development & delivery standards
│   └── airo-skills-reference.txt # Agentic UI/UX skills reference directory
├── scripts/                    # Application JavaScript modules & automation scripts
│   ├── app.js                  # Navigation, mobile menus, sticky header
│   ├── store.js                # Search, filtering, NDC matching, and pagination
│   ├── dashboard.js            # Internal catalog viewer & admin utilities
│   ├── firebase-config.js      # Firebase authentication & Firestore sync
│   ├── products-data.js        # Offline product dataset fallback
│   ├── admin.js                # Staff portal login handler
│   ├── contact.js              # Inquiry type switcher
│   └── make_json_data.py       # JSON catalog generator & validator
├── RESOURCES/                  # High-resolution design & project assets
│   ├── AARNA_Website_All_Pages.pdf
│   ├── AIRO_Project_Skills_Directory.pdf
│   └── Secure_Development_and_Delivery_Standards.docx
├── index.html                  # Landing page with primary divisions
├── about.html                  # Company profile, compliance & manufacturing
├── institutional-products.html # Pre-filled unit-dose liquid cups
├── retail-products.html        # 71+ OTC pharmaceuticals catalog
├── medical-devices.html        # Medical devices & sterile supplies
├── contact.html                # Inquiry & institutional sample request form
├── dashboard.html              # Catalog dashboard viewer
├── admin.html                  # Admin portal authentication gate
├── AGENTS.md                   # AI agent coding boundaries & quality rules
├── README.md                   # Project documentation
└── .gitignore                  # Git exclusion rules
```

---

## 🚀 Quick Start & Local Preview

This project is built with vanilla HTML5, CSS3, and modern JavaScript. No build step or package manager is required.

### Run with Python (Recommended)
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

### Run with Node / npx
```bash
npx serve .
```

---

## 🛠️ Data Maintenance

To regenerate or update the structured JSON catalog files from source specifications:
```bash
python3 scripts/make_json_data.py
```
This updates:
- `assets/data/institutional-products.json`
- `assets/data/retail-products.json`
- `assets/data/medical-devices.json`

---

## 🔒 Governance & Security

Development on this repository follows the [Secure Development and Delivery Standards](docs/security-standards.md) and [Agentic Coding Rules](AGENTS.md).
