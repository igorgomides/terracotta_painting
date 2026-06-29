# Changelog - Terracotta Painting Website Development

This log summarizes the features, design changes, and assets completed for **Terracotta Painting**.

---

## 🚀 Completed Milestones - June 28, 2026

### 1. Git Repository Setup
- Configured Git to track the remote repository `git@github.com:igorgomides/terracotta_painting.git` (via HTTPS authenticated with Personal Access Token).
- Pushed the codebase to the remote repository.

### 2. Admin Dashboard Expense Breakdown
- **New Small Cards**: Added small cards showing separate cost breakdowns:
  - **Total Expenses** (Despesas Totais)
  - **Material Cost** (Gastos com Material)
  - **Labor / Subcontractor Cost** (Mão de Obra)
- **Global & Project Views**: Added these cards to the global summary stats (top of the page) and the project-specific dashboard (active project view).
- **Refund Attribution**: Updated `app.py` to calculate net expenses by subtracting refund/return entries (`Devolução`) from their corresponding categories (Material vs Subcontractor/Labor) depending on the subtype.
- **Frontend Binding**: Updated `templates/admin.html` and `static/admin.js` to query, calculate, and populate these stats dynamically.

### 3. Integrated Invoice Generator (Escala Solutions)
- **Shared Invoice Generator**: Integrated the FPDF invoice generator (`generate_invoice.py`) from the Telegram bot repository directly into the Flask application.
- **Invoices Admin Tab**: Created an "Invoices" tab in the admin panel where users can review and generate invoices for selected projects.
- **Dynamic Line Items & Pre-population**: Pre-populates client name, client address, HST rate, and a default item for the project's Job Charge. Allows adding, editing, or deleting line items dynamically on the UI.
- **Downloadable PDFs**: Generates and moves PDFs to `/static/invoices/`, listing them for easy download or print directly in the browser.

### 4. TeleGravity Bot Sync / Upload Integration
- **Database Tracking**: Created a `telegram_invoices` table to store records (invoice number, client, amount, filename) of invoices created via Telegram.
- **Secure Upload API**: Implemented a POST API endpoint `/api/invoices/telegram_upload` in `app.py` secured with Bearer token authentication, enabling the Telegram bot to upload generated PDFs.
- **UI List Panel**: Added a section under the Invoices tab in the admin panel to fetch and display the history of invoices generated via Telegram.
- **Bot-Side Integration**: Modified `TeleGravity/bot.py` to calculate total amounts, extract invoice numbers, and send the generated PDFs directly to the website API before local deletion.

### 5. TeleGravity Bot Server Deployment
- **Local Git Repository**: Cloned the `TeleGravity` bot repository directly into the website's server directory (ignored in main website git repository to prevent nested conflicts).
- **Python 3.11 Setup**: Configured a Python 3.11 environment to run the bot, avoiding compatibility limitations of the server's default Python 3.6.
- **Production Credentials**: Created and filled the `.env` configuration file with the bot's credentials, database settings, and secure token for the website API integration.
- **Background Daemon Process**: Created the `start_bot.sh` script to stop any running bot instances and run the bot persistently in the background using `nohup`.

---

## 🚀 Completed Milestones - June 27, 2026

### 1. Codebase Structure & Runtimes
- **Files Created**:
  - `index.html`: Semantic HTML5 layout featuring header navigation, hero, packages, showcase gallery, estimate form, and footer.
  - `styles.css`: Full stylesheet implementing the layout consultant's refined design tokens.
  - `main.js`: Interaction script handling mobile navigation toggles, header scroll states, intersection scroll fade-ins, package pre-selection, and contact form validation.
- **Local Dev Server**: Started a background Python test server (`python3 -m http.server 8080`) serving the project at `http://localhost:8080/`.

### 2. Logo & Brand Assets Integration
- **Custom Logo**: Saved the remodeled logo image to `assets/images/logo.png`.
- **Navbar & Hero Integration**:
  - Replaced inline SVGs with the `logo.png` image.
  - Removed duplicate logo from the hero section to keep the entrance clean.
  - Used CSS `mix-blend-mode: multiply` on the navbar logo for transparency on light backgrounds.
  - Applied `filter: brightness(0) invert(1)` in the footer to render the logo in solid white on the dark slate background.
- **Logo Size Increase (+60%)**:
  - Standard Navbar Logo Height: `110px` (with header height at `140px` for breathing room).
  - Scrolled Navbar Logo Height: `88px` (with header height at `115px` for compact scrolling).

### 3. Modern Curvy Minimalist Styling (Wheeler & Watkins Method)
- **Asymmetric Curves**: Embedded the rounded details of the *Binary ITC* logo monogram into components using custom border-radii:
  - Buttons & CTAs: `border-radius: 20px 4px 20px 4px` (pill-like curves).
  - Service Tiers: `border-radius: 40px 8px 40px 8px` (organic card shape).
  - Showcase Items: `border-radius: 24px 6px 24px 6px` (soft gallery framing).
  - Estimate Panel: `border-radius: 40px 8px 40px 8px`.
  - Form Fields: `border-radius: 12px 4px 12px 4px`.
- **Typography Configuration**:
  - **Montserrat Regular**: Adopted for body prose, features, and form elements.
  - **Comfortaa**: Loaded as the primary web-fallback font for **Binary ITC Std** headings to preserve curvy, modern brand styling for visitors who do not have the custom font installed locally.
- **Hero Background**: Added `painted_living_room.png` as the hero background photo, softened with a semi-transparent sand overlay (`rgba(244, 241, 234, 0.88)`) to maintain perfect text contrast.

### 4. Portfolio Asset Generation
Generated 4 high-end photographic assets for the showcase gallery and saved them to `assets/images/`:
1. `painter_precision.png`: Close-up of painter taping baseboard.
2. `painted_living_room.png`: Open-concept living room with a terracotta feature wall.
3. `painted_bedroom.png`: Luxury master bedroom with slate grey/sand tones.
4. `paint_detail.png`: Close-up of sharp paint lines on wood trim.

### 5. Benefit-Oriented Copywriting
- Rewrote the stratified service tiers to focus on visual and emotional benefits rather than actions:
  - **Tier I**: *The Earthy Collection* (illuminating local spaces).
  - **Tier II**: *The Sculpted Tier* + *Fine Artistry* subtitle (sculpting architectural features).
  - **Tier III**: *Fine Terracotta Finish* + *Masterpiece Tier* subtitle (composition for custom modern estates).
- Modified service CTAs to *"Request an Estimate"* for a premium client feel.
- Updated the contact email to `contact@terracottapainting.com`.

---

## 📌 Next Steps / Where to Resume
1. **Visual Testing**: Open the local server at `http://localhost:8080/` in a browser to review logo alignment, header scrolling transitions, and overall mobile responsiveness.
2. **Form Integration**: Connect the client-side estimate form handler to an actual backend or form service (e.g., Formspree, email API, etc.).
3. **Deployment**: Configure hosting options for the domain `terracottapainting.com`.
