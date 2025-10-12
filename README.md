# Manifold — Cylinder Calculator (GitHub Pages)

Files in this package:
- `index.html` — main calculator page (password-protected client-side)
- `style.css` — styling
- `script.js` — calculation logic and password handling
- `README.md` — this file

## Quick setup (upload to GitHub)
1. Sign in to GitHub and create a **new public repository** named `manifold`.
2. Upload the files in this folder (`index.html`, `style.css`, `script.js`, `README.md`) to the repository root.
3. Commit changes.
4. Go to **Settings → Pages**, select **Deploy from a branch**, branch **main** and folder **/(root)**, then Save.
5. Wait 1–2 minutes. Your site will be live at:
   ```
   https://manifolddesign.github.io/manifold/
   ```

## Password
- Default password (preconfigured) is: `Manifold@2025`
- Password is stored locally inside your browser (client-side). To change password:
  - Click **Set/Change Password** on the page and follow prompts.

## Notes & Limitations
- Client-side password is suitable for casual privacy but **not** for strong security.
- For stronger protection, deploy behind server auth (nginx basic auth, Netlify Identity, or GitHub Pages with third-party proxy).
- Regeneration is implemented as an approximation: when enabled, the rod return flow is added to the bore flow to compute effective extension flow.

If you want, I can:
- Guide you step-by-step with screenshots to upload these files.
- Create the repository & push files for you if you add me as a collaborator (or provide a temporary token).