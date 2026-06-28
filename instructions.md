# UI/UX Website Generation Prompt: Terracotta Painting

You are a master front-end developer and elite UI/UX designer. You are going to build a high-conversion, responsive single-page marketing website for **Terracotta Painting**, a premium boutique residential painting service based in Kitchener, Ontario.

Analyze the attached brand presentation image (`watermarked_img_1366453765583040389.png`) to extract the exact typographic alignment, minimalist monogram "TP" architecture, layout breathing room, and color palette tokens.

---

## 🎨 1. BRAND IDENTITY & DESIGN SPECIFICATIONS

*   **Brand Name:** Terracotta Painting
*   **Core Slogan / Tagline:** "Fine finishes for living spaces."
*   **Secondary Value Proposition:** "Your space, in its best light."
*   **Design Aesthetic:** High-end, prestigious, architectural, and ultra-minimalist. Heavy reliance on asymmetric balance, generous white space (breathing room), and upscale typography. No generic or cartoonish clip-art of house shapes, paint rollers, or leaking buckets.

### Color Palette Tokens (Extract from Image):
1.  **Primary Accent:** Refined Terra Cotta (`#C05A3E` or exact match from swatches) — Used for the "T" monogram stroke, main brand text anchor, and focal interactive elements.
2.  **Dark Base:** Architectural Slate / Charcoal Grey (`#3A3F41`) — Used for the "P" monogram stroke, primary headers, body prose text, and luxury industrial dark sections.
3.  **Background Base:** Subtle Sand / Soft Off-White (`#F4F1EA`) — Universal page background to simulate a clean, professional, unblemished wall canvas.

---

## 📐 2. WEBSITE STRUCTURE & CONTENT BLOCKS

The website must be a premium single-page application (SPA) with smooth scroll navigation anchors:

### 📥 Block 1: Hero Section (The First Impression)
*   **Layout:** split-screen or large centered canvas with absolute clean white space.
*   **Visual Focus:** Show the minimalist "TP" monogram icon at the top center. Below it, render the main typography layout: **Terracotta** in refined terra cotta text tone, and **Painting** in architectural slate text tone, using wide, tracking-optimized letter spacing.
*   **Main Copy:** 
    *   H1: *Your space, in its best light.*
    *   H2 (Subtitle): *Fine finishes for living spaces.*
*   **CTA (Call to Action):** A sleek, clean button outline reading: `Request an Estimate`.

### 📊 Block 2: The Stratified Service Packages (Legs & Value)
Create a clean 3-column layout organizing our tiers, allowing us to serve both accessible residential clients and high-end elite properties seamlessly:
1.  **Column 1: The Earthy Selection** — Essential interior painting, precise wall application, clean workspace protection, and multi-room refreshes. Perfect for local class families.
2.  **Column 2: The Sculpted Tier** — Comprehensive room transformation, detailed trim, baseboard and casing execution, accent wall styling, and premium coat precision.
3.  **Column 3: Fine Terracotta Finish** — Our elite tier. High-fidelity surface preparation, expert custom color consulting, luxury residential trim work, and flawless custom geometric accents for modern homes.

### 🖼️ Block 3: Visual Work Showcase (Grounded Imagery)
*   A clean, horizontal masonry gallery grid simulating the architectural photography slides shown in the presentation. 
*   Include subtle overlay cards showing professional painter execution, crisp edge masking lines, and sophisticated neutral-toned painted interiors.
*   **Section Banner Text:** *"Another space transformed by Terracotta."*

### 📩 Block 4: The Clean Estimate Request Form (Conversion)
*   A minimalist input contact section embedded in a beautiful subtle sand background container. 
*   **Fields Required:** `Full Name`, `Email Address`, `Project Suburb (Kitchener / Waterloo / Cambridge)`, `Package Selection Dropdown`.
*   **Footer Signature:** Minimalist corporate type reading: `Terracotta Painting © 2026 — Built on Warmth & Precision.`

---

## 💻 3. TECHNICAL & UI REQUIREMENT OUTPUT

*   **Framework Style:** Clean HTML5/Tailwind CSS or modern React components.
*   **Typography:** Import an architectural geometric sans-serif typeface (like Montserrat, Inter, or a high-end clean serif alternative for headers) to replicate the luxury print aesthetic of the mockup cards.
*   **Responsiveness:** Perfect mobile auto-scaling layouts. Ensure all wide letter spacing tokens scale cleanly on mobile viewports without text clipping.