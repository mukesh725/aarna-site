# Secure Development and Delivery Standards

> Adapted from `RESOURCES/Secure_Development_and_Delivery_Standards.docx` for the Aarna Pharmaceuticals Web Platform.

## 1. Purpose and Scope
This document sets the engineering, review, and verification standards for the Aarna platform to ensure reliable delivery, maintainable architecture, and defense against common web vulnerabilities.

## 2. Core Security & Delivery Rules

### Rule 1: Validate on the Server (Client-Side = UX, Server-Side = Security)
- All contact forms, sample request payloads, and inquiries must have rigorous type, length, and content checks.
- Prevent script injection by sanitizing all text outputs before injecting into DOM elements.

### Rule 2: Least Privilege & No Embedded Secrets
- No API keys, database credentials, or secret tokens may be committed to source control.
- Git repositories must use a strictly enforced `.gitignore` to prevent credential leaks.

### Rule 3: Error Message Hardening
- Do not expose server paths, software versions, or database traces in client-facing modals or alerts.
- Use friendly, generic error messages for end users while logging detailed diagnostic information in protected runtime environments.

### Rule 4: Release Gate Matrix
Before merging or deploying any update:
1. **Verification**: Validate all HTML markup for valid nesting and clean tags.
2. **Link Integrity**: Ensure no broken links or missing image assets.
3. **Responsive QA**: Check layout across 375px mobile, 768px tablet, 1024px desktop, and 1440px wide screens.
4. **Performance**: Confirm images are compressed and lazy-loaded where below the fold.
