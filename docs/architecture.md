# System Architecture Specification

## 1. Overview
The Aarna Pharmaceuticals web platform is a responsive multi-page web application providing product exploration, sample ordering, institutional procurement RFPs, and an administrative catalog dashboard.

## 2. Directory Hierarchy
- **`assets/`**: Static binary assets.
  - `data/`: Structured JSON catalog files (`institutional-products.json`, `retail-products.json`, `medical-devices.json`).
  - `images/`: High-resolution product photos, dosage forms, hero backgrounds.
  - `logos/`: Partner wholesale distributor logos (McKesson, Cardinal Health, Medline, Cencora).
  - `downloads/`: Downloadable product catalog PDFs.
- **`css/`**: Design tokens and styles.
  - `styles.css`: Global CSS custom properties, navigation, responsive grids, product cards, footer.
  - `dashboard.css`: Internal catalog viewer and table styling.
- **`scripts/`**: Unified application modules & automation scripts.
  - `app.js`: Header behaviors, mobile navigation drawer, smooth scroll triggers.
  - `store.js`: Product search engine, category pills filtering, pagination, and NDC quick copy.
  - `dashboard.js`: Interactive product table, live category filters, search debounce.
  - `firebase-config.js`: Cloud Firestore & Firebase Auth configuration.
  - `products-data.js`: Offline fallback dataset.
  - `admin.js`: Staff portal login handler & authentication redirection.
  - `contact.js`: Interactive inquiry type selection.
  - `make_json_data.py`: Central data script generating structured JSON catalogs with NDC verification.
- **`docs/`**: Engineering, architecture, and security documentation contracts.

## 3. Design System & CSS Tokens
- **Font**: `Outfit`, sans-serif (Google Fonts).
- **Primary Brand**: `#0b1523` (Midnight Dark Navy).
- **Brand Accents**: `#0284c7` (Clinical Sky Cyan), `#059669` (Healthcare Emerald).
- **Surfaces**: `#ffffff` (Card surface), `#f8fafc` (Body background), `#f1f5f9` (Subtle tint).
- **Radius Tokens**: 8px (small), 12px (medium), 16px (large), 24px (cards), 9999px (pills).

## 4. Product Catalog Schema
Each product record adheres to the following JSON structure:
```json
{
  "id": "inst-1",
  "description": "TUSSIN DM SF 20-200MG SYR 40X5ML UD PACK",
  "category": "Cough & Chest Congestion",
  "unit": "EA",
  "packQty": "1",
  "ndc": "82568-0015-1",
  "caseSize": "40 cups"
}
```
