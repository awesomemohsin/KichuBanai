# KICHUBANAI — ANTIGRAVITY DEVELOPMENT RULES

These are permanent development rules for the KichuBanai project.
You MUST follow these rules for every task unless explicitly overridden by the user.

---

### 1. PROJECT IDENTITY
- **Project Name:** KichuBanai
- **GitHub Username:** awesomemohsin
- **GitHub Email:** mohsindude5@gmail.com
- Use these Git identity details when Git configuration is required.
- Do not change project name, GitHub username, or GitHub email unless explicitly instructed.

---

### 2. COMMAND EXECUTION PERMISSION
- Explicit authorization granted to run normal development commands without asking permission every time.
- Do NOT repeatedly ask: "May I run this command?"
- Execute required commands directly (inspect files, create/edit files, install required packages, run dev tooling, tests, lint, type checks, inspect read-only git status/history, terminal commands, fix code, investigate errors).
- Git write/mutation restrictions remain strictly mandatory.

---

### 3. STRICT GIT RESTRICTIONS
NEVER perform any of these actions unless explicitly instructed:
- `git add`
- `git commit`
- `git push` (or `git push origin main` / `<any-branch>`)
- `git merge`
- `git push --force` / force push
- `git reset --hard`
- deleting branches
- rewriting Git history

**In particular:**
- DO NOT automatically commit after completing a task.
- DO NOT automatically push after completing a task.
- DO NOT assume that "task completed" means "commit and push".
- Only perform Git staging, commit, or push when explicitly instructed.
- Read-only Git commands are permitted: `git status`, `git log`, `git diff`, `git branch`, `git remote -v`.

---

### 4. BUILD RESTRICTION
- DO NOT run production builds automatically (`npm run build`, `pnpm build`, `yarn build`, `next build`).
- Do not assume a task being complete means a production build should be run.
- Lightweight validation commands are allowed when useful: TypeScript checks (`tsc --noEmit`), ESLint, unit tests, targeted tests, static analysis (unless they trigger production builds).
- If a build is genuinely required, request explicit instruction before running it.

---

### 5. NO SCRATCHPAD
- DO NOT use Antigravity's scratchpad for development work (incurs extra credits).
- For temporary scripts, test files, generated intermediate files, migration helpers, or debugging utilities, use:
  - `/scratch`
  - `/scripts`

---

### 6. TEMPORARY FILE RULE
- Any temporary script or one-time development file MUST be placed inside `/scratch` or `/scripts`.
- Never scatter temporary files throughout the project.
- Examples: `/scratch/debug-export.ts`, `/scripts/migrate-data.ts`.
- Ensure temporary directories/files are included in `.gitignore`.

---

### 7. TEMPORARY FILE CLEANUP
- After a temporary script has served its purpose:
  - Remove it if no longer needed.
  - Remove temporary generated files and debugging output.
  - Keep the repository clean.
- Do not leave unnecessary development artifacts in the project.

---

### 8. NEVER PUSH TEMPORARY FILES
- Temporary files must NEVER be committed or pushed.
- Ensure `/scratch` and temporary artifacts are appropriately ignored by Git.
- If a script becomes a permanent project requirement, move it into an appropriate production directory and remove the temporary version.

---

### 9. DO NOT DESTROY EXISTING WORK
- Before modifying an existing feature: inspect it, understand it, identify dependencies, preserve working behavior, and improve incrementally.
- Do NOT rewrite working code simply due to personal preference.
- Do NOT replace existing architecture without a clear technical reason.
- Do NOT delete existing components without checking if they are reused elsewhere.

---

### 10. PRODUCTION-GRADE CODE ONLY
- Every implementation must be written as production-quality code.
- Avoid disposable demo code, fake functionality, unnecessary placeholders, duplicated business logic, giant components, hardcoded rules, or unsafe shortcuts.
- Standard: Works correctly, securely, maintainably, and scales.

---

### 11. CLEAN CODE
- Follow Single Responsibility Principle (SRP), separation of concerns, strong typing, clear naming, predictable data flow, reusable abstractions, and small focused functions/components.
- Avoid giant files/components, deeply nested conditionals, magic numbers/strings, unclear variable names, and unnecessary `any`. Prefer descriptive variable names.

---

### 12. REUSABLE COMPONENTS
- DO NOT repeatedly rewrite the same UI or logic.
- If a UI pattern appears more than once, create a reusable component (e.g., Button, Modal, Dialog, ConfirmDialog, DataTable, EmptyState, LoadingState, ErrorState, FormField, SearchInput, Pagination, StatusBadge, PriceSummary, OrderStatusTimeline, DesignCard, TemplateCard, FileUpload, ImageUpload, ColorPicker, PropertyPanel, LayerItem).
- Standard: **BUILD ONCE → REUSE EVERYWHERE.**

---

### 13. DO NOT OVER-ABSTRACT
- Reusability does not mean creating unnecessary abstractions for everything.
- Create abstractions when they reduce meaningful duplication, improve consistency/maintainability, and represent a real domain concept. Prefer practical reusable architecture.

---

### 14. SHARED BUSINESS LOGIC
- Business logic must not be duplicated across components, API routes, server actions, or pages.
- Centralize pricing logic, subscription entitlements, order status transitions, and production validation into dedicated single-source-of-truth services.

---

### 15. SERVER-SIDE BUSINESS LOGIC
- Security-sensitive and business-critical logic must be server-side.
- Never trust the browser for prices, subscriptions, roles, permissions, ownership, order totals, discounts, or download authorization. The server is the authority.

---

### 16. DATABASE CODE
- Do not access MongoDB directly from React components.
- Use repositories, services, or a centralized data-access layer. Avoid duplicate queries, use appropriate indexes, and use typed data models.

---

### 17. STORAGE CODE
- Storage provider logic must be isolated behind an abstraction (e.g. `StorageProvider`).
- Do not scatter Vercel Blob or S3-specific logic throughout the app.

---

### 18. PROVIDER ABSTRACTION
- Use interfaces/adapters for infrastructure that may change:
  - `StorageProvider`
  - `PaymentProvider`
  - `CourierProvider`
  - `EmailProvider`
- Avoid tightly coupling the application to single vendors.

---

### 19. KICHUBANAI DESIGN SYSTEM
- Use the existing KichuBanai visual language consistently.
- Prefer shadcn/ui, Tailwind, consistent spacing, typography, radius, buttons, cards, form controls, and status colors.
- Do not create random ad-hoc UI styles per page.

---

### 20. UI QUALITY
- Every UI implementation must be beautiful, modern, professional, responsive, accessible, consistent, and intuitive.
- Maintain a high design standard (product designer + UX designer + senior frontend engineer mindset).

---

### 21. BEGINNER-FIRST UX
- Designed for users who may have zero professional design background.
- Prefer plain terminology ("Move", "Resize", "Change Color", "Replace Image") over dense jargon.
- Progressive disclosure: Keep default view simple; expose advanced controls under "Full Edit".

---

### 22. DESIGN EDITOR QUALITY
- Core product reliability: undo, redo, autosave, selection, movement, resize, rotation, alignment, layers, locking, image replacement, text editing, zoom, keyboard shortcuts.
- Must have a clear, robust state architecture (not loose UI buttons).

---

### 23. TEMPLATE ARCHITECTURE
- Templates must use: Structured Design JSON + Assets + Font Metadata + Template Metadata.
- JPG/PNG is only a preview/export format; never use flattened bitmaps as master templates.

---

### 24. DESIGN DATA INTEGRITY
- Never mutate Original Template on user edit: `Template -> User Design Copy`.
- Never mutate Customer Original Design on admin print edit: `Customer Design Snapshot -> Production Revision`.
- Never mutate Approved Production Revision: Create `Production Revision 2`.

---

### 25. PRINT SAFETY
- Never use low-resolution screenshots as primary print sources.
- Production output requires: vector text outlines, high-resolution images, exact dimensions, bleed, safe area, resolved assets, resolved fonts.

---

### 26. TEXT OUTLINE RULE
- Editable Master: text remains editable.
- Production SVG: text converted to vector paths (independent of external font files).
- Validate production SVG has no raw text elements; never silently substitute missing fonts.

---

### 27. NO FAKE FILE FORMATS
- NEVER rename `.svg` to `.ai`, `.pdf` to `.ai`, or image to `.psd`.
- If true AI/PSD generation is unavailable, provide valid alternatives (outlined SVG, print PDF, design JSON, assets). Never misrepresent file formats.

---

### 28. ERROR HANDLING
- Do not stop immediately for routine issues: investigate root cause, fix code, re-run validation, resolve autonomously.
- Never suppress errors with empty catches, fake success, disabling validation, or ungrounded `@ts-ignore` / `@ts-expect-error`.

---

### 29. ROOT-CAUSE FIXING
- Fix underlying causes, not symptoms. If errors recur across areas, build a centralized reusable solution.

---

### 30. TYPE SAFETY
- Strict TypeScript usage: avoid `any`. Use interfaces, types, generics, discriminated unions, type guards, and Zod schemas.

---

### 31. BOUNDARY VALIDATION
- Validate data at all boundaries (form inputs, API payloads, uploaded files, database queries, order configurations, design JSON, production exports) using Zod or equivalent.

---

### 32. SECURITY
- Protect authentication, authorization, private designs/assets, production files, admin routes, and user data.
- Never expose secrets, sanitize uploaded SVGs, validate uploads, and protect against IDOR.

---

### 33. PERFORMANCE
- Avoid unnecessary re-renders, database queries, and repeated API calls.
- Lazy-load heavy editor modules. Use pagination for large datasets.

---

### 34. ACCESSIBILITY
- Build accessible interfaces: semantic HTML, proper labels, keyboard navigation, visible focus states, ARIA attributes, adequate contrast.

---

### 35. RESPONSIVE DESIGN
- All dashboards, template browsing, order management, account pages, and admin tools must work seamlessly across desktop, tablet, and mobile.
- Desktop is primary for the full design editor.

---

### 36. CODE ORGANIZATION
- Keep files focused and modular. Split oversized components, extract business logic into services, centralize types, schemas, and repository queries.

---

### 37. COMMENTS
- Only comment on architectural rationale, complex algorithms, non-obvious business rules, security constraints, or provider limitations. Avoid stating the obvious.

---

### 38. DOCUMENTATION
- Provide concise, practical documentation (README, architecture notes, env documentation) when introducing complex architectures. Avoid clutter for trivial changes.

---

### 39. TESTING
- Prioritize tests around pricing, subscriptions, permissions, serialization/deserialization, order snapshots, state transitions, production exports, SVG text outlining, and validation schemas.

---

### 40. DEPENDENCY MANAGEMENT
- Check existing dependencies first. Avoid dependency bloat and avoid installing packages without clear necessity.

---

### 41. NO HARDCODED BUSINESS LOGIC
- Keep prices, product options, subscription benefits, order statuses, template categories, and quantity tiers configuration- or database-driven.

---

### 42. NO DUPLICATED UI
- Share components with appropriate variants across customer, admin, and order interfaces rather than rebuilding from scratch.

---

### 43. TASK SCOPING
- Small tasks: implement autonomously without unnecessary check-ins.
- Complex tasks (major architecture changes, destructive migrations, breaking UX alterations): consult/confirm before execution.

---

### 44. AUTONOMOUS PROBLEM SOLVING
- Investigate -> identify root cause -> implement fix -> validate -> continue. Use the codebase as the primary source of truth.

---

### 45. CODE FIRST INVESTIGATION
- Inspect existing code, types, models, routes, configs, and examples before asking questions.

---

### 46. TEMPORARY DEBUGGING
- Confine debugging scripts and artifacts to `/scratch` or `/scripts`. Remove all test artifacts and logs upon task completion.

---

### 47. ENVIRONMENT & SECRET SAFETY
- Never commit secrets or expose credentials (database, storage, payment, auth). Document variables in `.env.example` without real values.

---

### 48. GIT SAFETY
- Modify Git staging or history ONLY upon explicit user instruction.
- When instructed to commit: review changes, stage only intended files, use a short one-line commit message, and never push unless separately instructed.

---

### 49. COMMIT MESSAGE RULE
- When instructed to commit, messages MUST be:
  - Short, concise, simple, single-line.
  - NO commit body, NO description, NO bullet points.
  - Example: `"Add print order workflow"` or `"Fix editor autosave"`.

---

### 50. PUSH RULE
- NEVER push automatically. Wait for explicit instruction to push.

---

### 51. NO AUTOMATIC BUILD
- DO NOT run production builds (`npm run build`, `next build`, `pnpm build`, `yarn build`) without explicit instructions. Lightweight validation is preferred.

---

### 52. FINAL TASK REPORT FORMAT
When completing a task, provide a concise report in this format:
```markdown
DONE:
- What changed
- Important files/components changed
- Functionality implemented
- Validation performed
- Any remaining issues
```
*(Clearly distinguish: Implemented, Tested, Not tested, Provider-dependent)*

---

### 53. QUALITY STANDARD
Evaluate all features against:
- Correctness
- Security
- Performance
- Reusability
- Maintainability
- Accessibility
- Responsiveness
- UX Quality
- Scalability

---

### 54. LONG-TERM SCALABILITY
Architect systems to support future growth:
- Templates (thousands of templates)
- Design JSON (future editor tooling)
- Print products & variants
- Dynamic pricing & subscriptions
- Interchangeable providers (Storage, Payment, Courier)
- Advanced admin production workflows

---

### 55. CORE PRINCIPLE
> **Do not build code that only works today. Build code that can be maintained tomorrow.**
> *KichuBanai must be beautiful on the surface and strong underneath.*
