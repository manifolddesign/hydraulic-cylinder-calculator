# 🧮 Hydraulic Cylinder Calculator — v1.3.2
**© Design Hydraulics 2025 — All Rights Reserved**  
🔐 **Password:** `Hydra@2025`

A modern, mobile-friendly calculator that helps design engineers estimate and validate hydraulic cylinder sizing — including bore, rod, pressure, and flow — with integrated safety factor and ISO size recommendations.

---

## 🖼️ Preview Screenshots

| Login Page | Main Dashboard | Find Cylinder Modal |
|-------------|----------------|---------------------|
| ![Login Screen](https://github.com/yourusername/hydraulic-calculator/assets/login-preview.png) | ![Main Screen](https://github.com/yourusername/hydraulic-calculator/assets/main-preview.png) | ![Find Cylinder Modal](https://github.com/yourusername/hydraulic-calculator/assets/modal-preview.png) |

> 💡 Replace these image links with your actual uploaded GitHub image paths once screenshots are available.

---

## 🚀 Features
✅ **Merged final version** (v1.2.2 + v1.3.2)  
✅ Works seamlessly on **mobile and desktop**  
✅ **No UI change** from the stable original layout  

| Module | Description |
|--------|--------------|
| 🔑 Login | Secure access using password `Hydra@2025` |
| ➕ Add Cylinder | Dynamically add, edit, or delete cylinders |
| ⚙️ Find Cylinder Size | Calculate bore and rod sizes automatically |
| ⚗️ Load Distribution | Divide total load per cylinder intelligently |
| 🧱 ISO Standards | Nearest ISO sizes for bore and rod |
| 🧩 Rod Safety Factor | Euler buckling-based check (Red/Orange/Green) |
| 📊 Excel Export | Exports all cylinder data using included template |
| 🖥 Responsive Layout | Works smoothly on desktop & mobile devices |

---

## 🧮 Find Cylinder Size Module

**Inputs Supported**
- Weight (Tonne or Kg)
- Capacity (kN or N)
- Pressure (bar)
- Stroke Length (mm)
- Number of Cylinders
- Checkbox: “All Cylinders Hold Entered Weight”

**Outputs**
- Calculated Bore Dia  
- Recommended Rod Dia  
- ISO Bore & Rod (nearest)  
- Safety Factor (with color status)

**Safety Factor Colors**
| Color | Meaning | Range |
|--------|----------|--------|
| 🔴 Red | Rod may buckle | SF < 2.0 |
| 🟠 Orange | Borderline safe | 2.0 ≤ SF < 3.0 |
| 🟢 Green | Safe | SF ≥ 3.0 |

---

## 📈 Excel Export
Exports all main screen cylinder data (Name, Bore, Rod, Stroke, Time, Pressure, Force, Flow, Power)  
into the **included Excel template: `Hydraulic Cylinder Reports.xlsx`**

> ⚠️ Safety factor results are *not exported* — shown only in the modal.

---

## 🧩 File Structure
---

## 🧠 Technical Summary
- **Language:** HTML, CSS, JavaScript  
- **Excel Export:** Client-side JavaScript (SheetJS compatible)  
- **Safety Factor:** Euler Buckling Formula  
- **Platform:** Runs locally in browser — no installation needed  

---

## 🛠 Version History
| Version | Date | Changes |
|----------|------|----------|
| v1.2.2 | 2025-09 | Original stable release |
| v1.3.2 | 2025-10 | Added Find Cylinder Size, ISO logic, safety check, fixed weight division, improved mobile layout |

---

## 🧑‍💻 Developer Notes
- Password can be changed in `script.js` (`Hydra@2025` line).  
- “Apply” in modal updates selected cylinders in the table.  
- “Reset” clears modal fields; clicking outside does not close modal.  
- No Clear button is present (as requested).  
- Compatible with Chrome, Edge, Firefox.

---

## 🏁 License
This project is proprietary to **Design Hydraulics**.  
Unauthorized reproduction or redistribution is prohibited.  

© 2025 Design Hydraulics — All Rights Reserved.
