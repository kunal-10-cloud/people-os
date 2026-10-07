# People OS

A hardcoded HRMS template: HR admin, manager and employee portals for deskless workforces, with payroll, attendance, rosters, leave, compliance and hiring. It ships with three demo companies (India, US, UK) whose numbers agree across every screen.

## Run it

It's a static site with no build step and no backend. Serve the folder and open `index.html`:

```
python3 -m http.server 8765
# open http://localhost:8765/#/portals
```

Any static host works (Emergent, Netlify, GitHub Pages, S3).

## Structure

- `index.html` loads everything in order.
- `core/` holds the data packs (`data.js`, `data-extra.js`), the runtime (`lib.js`), components (`ui.js`), charts, maps and the app shell.
- `modules/` has one file per area (home, people, payroll, roster, leave, self-service and so on); each registers its routes.
- `PRD.md` lists every feature, portal and demo flow as built.
- `DESIGN.md` is the visual identity and UX rules; `CONTRIBUTING.md` is the module API and data model.

## Demo switches

Add these to any URL:

- `?co=in|us|uk` switches the company.
- `?role=admin|manager|employee` switches the portal.
- `?theme=dark` turns on dark mode.

`#/portals` is the portal sign-in page.
