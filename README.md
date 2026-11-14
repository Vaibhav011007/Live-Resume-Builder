# Folio – Live Resume Builder

Plain HTML, CSS and JavaScript. No build step, no frameworks.

## Run
1. Keep `index.html`, `style.css` and `app.js` in one folder.
2. Open `index.html` in Chrome, Edge or Firefox. (Or use the VS Code "Live Server" extension.)
3. Edit on the left, watch the A4 resume update on the right. Data autosaves in your browser.

## Download PDF
Click **Download PDF**, choose **Save as PDF** in the print window, and set margins to **None**.

## Add a new template
1. In `app.js`, add a name to the `TPL` array, e.g. `'compact'`.
2. In `style.css`, add rules under the `/* Templates */` comment using `[data-tpl=compact] ...`
   (style `.hd`, `.sec h3`, `.chip`, `.it` and so on).

## Files
- `index.html` – page structure
- `style.css` – themes, layout, templates, animation, print
- `app.js` – state, rendering, autosave, import/export
