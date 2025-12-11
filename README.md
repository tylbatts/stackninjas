# Stackninjas Marketing Site

A single-page, responsive marketing site for Stackninjas, LLC built with semantic HTML, modern CSS (Flexbox + Grid), and a small amount of vanilla JavaScript for interactions.

## Running locally

Because this is a static site, you can view it directly in a browser or serve it with any static file server.

### Option 1: Open directly
1. Clone or download this repository.
2. Open `index.html` in your browser.

### Option 2: Use a local HTTP server
Serving over HTTP ensures assets load consistently and enables features like smooth scrolling in some browsers.

1. Clone or download this repository and open a terminal in the project root.
2. Start a simple server (choose one):
   - Python 3: `python -m http.server 8000`
   - Node (if installed): `npx serve .`
3. Visit [http://localhost:8000](http://localhost:8000) in your browser (or the URL printed by your server tool).

## Project structure
- `index.html` – Page markup and section structure.
- `styles.css` – Global styles, layout, and responsive design.
- `main.js` – Mobile navigation toggle, smooth scrolling, and contact form validation.

## Notes
- No external build tools or dependencies are required.
- Remember to keep `index.html`, `styles.css`, and `main.js` in the same directory when serving the site.
