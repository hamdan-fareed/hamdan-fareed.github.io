# Fix GitHub Pages Blank Screen & Enable Automated Deployment

Resolve the empty white screen issue on GitHub Pages for project repository hosting (`username.github.io/repo-name`) and configure automated zero-configuration deployment.

### User Review & Critical Decisions

> [!IMPORTANT]
> Diagnosis of the White Screen Issue & The Fix:

- **Root Cause Identified**:
  - The repository is a project repo (`https://hamdan-fareed.github.io/<repo-name>/`).
  - By default, Vite generates absolute asset paths starting with `/` (e.g., `/assets/index-xxx.js`), causing the browser to search the root domain `hamdan-fareed.github.io/assets/...` instead of your repository subfolder `hamdan-fareed.github.io/<repo-name>/assets/...`.
  - The browser receives 404 errors for the JavaScript and CSS bundles, rendering an **empty white screen**.
- **The Solution**:
  1. **Configure Relative Base in Vite**: Update `vite.config.ts` with `base: './'`, ensuring all scripts, styles, and fonts load correctly regardless of repository name or domain subpath.
  2. **Add GitHub Actions Deployment Workflow (`.github/workflows/deploy.yml`)**: An automated deployment pipeline that automatically builds (`npm run build`) and publishes the `dist` folder to GitHub Pages whenever you push changes to your repository.
  3. **Provide Plain-English GitHub Activation Instructions**: Simple 3-step guide to activate GitHub Pages under Settings > Pages (Source: "GitHub Actions") and push your code.

---

### 1. Overview & Core Concept

- **Problem**: Deploying Vite React apps to GitHub Pages results in a blank white screen due to absolute asset path resolution (`/assets/` instead of `./assets/`).
- **Goal**: Make the codebase portable and production-ready for GitHub Pages with automatic continuous deployment on every git commit.

---

### 2. User Experience & Verification

- **Local & Studio Preview**: Stays 100% functional, responsive, and pixel-perfect.
- **GitHub Pages Site**: Loads instantly without 404 asset failures, displaying the full single-screen hub, pixel wordmark, grain overlay, magnetic cursor, and 32-tile transition.

---

### 3. Key Technical Decisions

- **Decision 1: Use `base: './'` (Relative Base) in `vite.config.ts`**:
  - *Why*: Eliminates hardcoding the repository name in configuration. If the repository is ever renamed or moved to a custom domain, the build continues to work without edits.
- **Decision 2: Automated GitHub Actions Workflow**:
  - *Why*: The user indicated "idk" on deployment setup. Providing an official `.github/workflows/deploy.yml` with `actions/deploy-pages@v4` handles Node.js setup, caching, dependencies, build, and deployment automatically without requiring manual `gh-pages` branch maintenance.

---

### 4. Technical Architecture & File Changes

```
┌───────────────────────────────────────────────────────────────┐
│                     Changes for GitHub Pages                  │
│                                                               │
│   ┌───────────────────────────────────────────────────────┐   │
│   │                   vite.config.ts                      │   │
│   │   - Add: base: './'                                   │   │
│   │   - Preserves all React and Tailwind plugin configs   │   │
│   └───────────────────────────────────────────────────────┘   │
│                               │                               │
│                               ▼                               │
│   ┌───────────────────────────────────────────────────────┐   │
│   │             .github/workflows/deploy.yml              │   │
│   │   - Triggers on push to main branch                   │   │
│   │   - Runs: npm ci && npm run build                     │   │
│   │   - Deploys: dist directory to GitHub Pages           │   │
│   └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```
