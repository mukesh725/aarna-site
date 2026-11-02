# AGENTS.md — AI Agent Guidance & Coding Standards

> Operating rules, architecture contracts, and engineering standards for AI-assisted development on the Aarna Pharmaceuticals repository.

---

## 🎯 Project Mission & Quality Expectations

Aarna Pharmaceuticals is a pharmaceutical and medical devices platform. Visual elegance, high precision, rock-solid accessibility, and performance are paramount.

- **Design Tone**: Editorial, high-precision healthcare aesthetics. Curated midnight navy (`#0b1523`), clean whites, subtle grey elevations, and cohesive typography (`Outfit`).
- **Zero AI Slop**: Avoid generic AI-generated artifacts (such as jagged cutouts, mismatched border radiuses, unstyled placeholders, and non-semantic divs).
- **Preserve Documentation Integrity**: Retain all established comments, docstrings, and architectural explanations unless explicitly directed to modify them.

---

## 🏗️ Architecture & Technology Contracts

1. **Stack**: Vanilla HTML5, Vanilla CSS3 (custom properties / CSS variables), Vanilla ES6+ JavaScript.
2. **Typography**: Always use Google Fonts `Outfit` (weights 300, 400, 500, 600, 700, 800) for all headings, body text, and interactive elements.
3. **Data Integrity**: Product datasets reside in `assets/data/*.json`. Regenerate datasets using `scripts/make_json_data.py`.
4. **Responsive Guardrails**: Every component must be fully responsive across mobile (375px+), tablet (768px+), laptop (1024px+), and ultra-wide screens.
5. **Accessibility**: All interactive elements must have semantic tags (`<button>`, `<a>`), clear focus indicators, descriptive `aria-label` attributes, and minimum 44px tap targets.

---

## 🛡️ Security & Safe Coding Rules

Derived from `RESOURCES/Secure_Development_and_Delivery_Standards.docx`:

1. **No Embedded Secrets**: Never commit API keys, private tokens, passwords, or production credentials.
2. **Input Validation**: Validate all client-side inputs (lengths, email formats, required fields) and prepare for server-side verification.
3. **Safe Error Handling**: Never expose internal filesystem paths, stack traces, or raw exceptions in user-facing UI.
4. **File Structure Rules**: Keep scripts in `scripts/`, documentation in `docs/`, datasets in `assets/data/`, and media in `assets/images/` and `assets/logos/`.

---

## 🔄 Change Verification Checklist

Before considering any task complete:
- [ ] No regression in other sections or pages.
- [ ] Responsive behavior verified across breakpoints.
- [ ] No broken file references or 404 links.
- [ ] Interactive states (hover, focus, active) tested with smooth transitions.
- [ ] Files correctly placed according to repository architecture.
