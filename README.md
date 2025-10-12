
# Manifold — Cylinder Calculator (v2)

This package contains a web version of your Excel Cylinder Calculation that reproduces the same formulas and behaviors.

Files:
- index.html
- style.css
- script.js
- README.md (this file)

## How to use
1. Create a public GitHub repo named `manifold` under your `manifolddesign` account.
2. Upload these four files to the repository root and commit.
3. In the repo: Settings → Pages → Deploy from a branch → main / (root) → Save.
4. Wait ~1–2 minutes. Your site will be live at:
   https://manifolddesign.github.io/manifold/

## Features implemented (matches Excel):
- Time input options: `sec`, `mm/sec`, `m/sec`, `m/min`.
- Pressure ↔ Force bidirectional: entering one computes the other (same formulas as Excel).
- Regeneration checkbox (default off). Regeneration affects **power only**:
  - If **enabled**, power uses bore flow (Qb).
  - If **disabled**, power uses (Qb − Qa) for power calculation.
- Multi-cylinder scaling (Number of cylinders multiplies flows and power where appropriate).
- All outputs show units and formatted values.

## Notes and limitations
- Password protection is client-side (stored locally). For stronger security, use server auth.
- The site runs fully in the browser — no backend required.
