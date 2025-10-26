# 🧮 Hydraulic Cylinder Calculator — v1.3.4
**© Design Hydraulics 2025 — All Rights Reserved**  
🔐 **Password:** `Hydra@2025`

A modern, mobile-friendly calculator that helps design engineers estimate and validate hydraulic cylinder sizing — including bore, rod, pressure, and flow — with integrated safety factor and ISO size recommendations.

---

## 🖼️ Preview Screenshots

| Login Page | Main Dashboard | Find Cylinder Modal |
|-------------|----------------|---------------------|
| ![Login Screen](https://github.com/manifolddesign/hydraulic-cylinder-calculator/blob/main/login-preview.PNG) | ![Main Screen](https://github.com/manifolddesign/hydraulic-cylinder-calculator/blob/main/main-preview.PNG) | ![Find Cylinder Modal](https://github.com/manifolddesign/hydraulic-cylinder-calculator/blob/main/modal-preview.png) |

---

## 🚀 Features
✅ Works seamlessly on **mobile and desktop**  

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

## 📈 Excel Export
Exports all main screen cylinder data (Name, Bore, Rod, Stroke, Time, Pressure, Force, Flow, Power)  
into the **included Excel template: `Hydraulic Cylinder Reports.xlsx`**

---
## 🧠 Technical Summary
- **Language:** HTML, CSS, JavaScript  
- **Excel Export:** Client-side JavaScript (SheetJS compatible)  
- **Safety Factor:** Euler Buckling Formula  
- **Platform:** Runs locally in browser — no installation needed  

---

## 🧑‍💻 Developer Notes
- Password can be changed in `script.js` (`Hydra@2025` line).  
- “Apply” in modal updates selected cylinders in the table.  
- “Reset” clears modal fields; clicking outside does not close modal.  
- Compatible with Chrome, Edge, Firefox.

---

## 🏁 License
This project is proprietary to **Design Hydraulics**.  
Unauthorized reproduction or redistribution is prohibited.  

© 2025 Design Hydraulics — All Rights Reserved.
