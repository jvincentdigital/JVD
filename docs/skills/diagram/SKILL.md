---
name: diagram
description: Draw a clean flow or architecture diagram in JVD colours as one offline HTML file. Use when asked for a diagram, flowchart, architecture picture or "draw how X works", for docs or a case study.
---

# diagram

Turns a small JSON spec into `docs/diagrams/<name>.html`: one self-contained file with an inline SVG that opens in any browser with no internet.

House rules come from diagram-design (MIT, github.com/cathrynlavery/diagram-design), in our own words and code: a 4px grid, one accent colour, 1px lines, no shadows, small radius, checked contrast, and restraint.

## First ask: does this need a diagram?

If two sentences say it, write two sentences. Draw only when the shape (branches, joins, order) is the point.

## Steps

1. Say which flow you will draw and list its boxes before writing anything.
2. Write `docs/diagrams/<name>.json`:

   ```json
   {
     "title": "How a page request flows",
     "subtitle": "Optional one-liner",
     "nodes": [
       { "id": "a", "label": "Browser request", "sub": "GET /" },
       { "id": "b", "label": "Locale routing", "sub": "middleware.ts", "focus": true }
     ],
     "edges": [{ "from": "a", "to": "b", "label": "optional" }]
   }
   ```

3. Run `node scripts/design/diagram.mjs` (or `make diagrams`). It renders every spec in `docs/diagrams/`.
4. Run `node scripts/design/selftest.mjs`. Keep the committed HTML in sync with its JSON.
5. Link the `.html` from the doc it explains.

## Limits (the renderer refuses otherwise)

- At most 12 boxes. More than that means split it, or write it as a paragraph.
- At most 2 `focus` boxes; they get the accent (`accent-dark`). Use it for the 1-2 things to look at first.
- Flows run top-down in layers. An edge may only go to the next layer, and there are no cycles. Add a step or split the diagram if needed.
- Labels are short: about 24 characters, sublabels about 28 (file paths, examples).

## Style (built in, do not override)

- Cream page, white boxes, warm-gray 1px borders and arrows, charcoal labels, mono sublabels.
- Fraunces title, Plus Jakarta Sans labels. Falls back to system fonts offline.
- Every colour pair is checked against WCAG at render time.
- `<title>` and `<desc>` describe the flow in words for screen readers.
