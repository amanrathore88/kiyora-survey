# KIYORA Customer Research Survey System

A web-based survey engine and research administration platform designed specifically for the **KIYORA India Air Purifier Concept & Price Validation** study, developed for **Kiyoki Private Limited**.

---

## 🌟 Architecture & Features

1. **One-Question-At-A-Time Experience**:
   - Progressive, focused flow with smooth transitions (Framer Motion).
   - Animated progress bar showing progress across all 25 questions.
   - Distinct Concept cards shown before Section D (Blind Concept 1), Section E (Japanese Technology Concept 2), and Section F (Final Proposition).

2. **Full Research Sequence & Bias Protection**:
   - Q16 (Blind Concept Purchase Intent) occurs strictly **before** any Japanese technology/design positioning is revealed.
   - Section E introduces and measures the Japanese association (Q19-Q22).
   - Q23 measures final purchase consideration to evaluate whether the Japanese association increases intent.
   - Research sequence engine validates that Q16 has been recorded before serving Q19+.

3. **Strict Validation & Selection Constraints**:
   - **Q10**: Select up to 3 (`maxSelections = 3`) with "Other" text support.
   - **Q12**: Select **exactly 3** (`minSelections = 3, maxSelections = 3`).
   - **Q18**: Select up to 3 (`maxSelections = 3`) with "Other" text support.
   - **Q20**: Select up to 2 (`maxSelections = 2`).
   - **Q6 & Q15**: Multi-select without artificial limits.
   - **Q25**: Open-ended text response.
   - **"Other: ____"**: Dynamically renders free-text input when selected.

4. **Conditional Logic Engine**:
   - **Q11** dynamically appears only if respondent selected *"I do not see a need"* in Q10, preventing respondents from being forced into irrelevant purchase-intent questions.

5. **Post-Survey Participation Reward (₹2,000 Coupon)**:
   - Respondent Name & Mobile/Email contact details collected **strictly after** full questionnaire completion.
   - Explicitly clarified as a **research participation reward**, never as an air purifier discount.

6. **Normalized 10-Table Database (Drizzle ORM + SQLite/Turso)**:
   - `surveys`: Survey metadata and participation reward description.
   - `sections`: 6 Sections (A-F) with concept copy.
   - `questions`: Question metadata, selection limits, conditional logic, notes.
   - `question_options`: Normalized individual options (no JSON blobs).
   - `question_revisions`: Version history — edits create new revisions without altering historical data.
   - `survey_sessions`: Tracks `in_progress`, `completed`, and `abandoned` sessions.
   - `responses`: Responses linked to specific question revisions.
   - `response_answers`: Normalized answer selections, other text, and free text.
   - `respondent_contacts`: Contact details stored post-completion.
   - `admin_users`: PBKDF2 password-hashed administrative users.

7. **Admin Dashboard & Analytics**:
   - **Purchase Intent Shift Analysis (Q16 vs Q23)**: Side-by-side distribution charts and net shift metrics (% upgraded, % same, % downgraded).
   - **Session Monitoring**: Live status tracking of in-progress and abandoned sessions.
   - **Response Management**: Full response audit trail, detail view with question-by-question breakdown, and non-destructive soft-delete / archiving.
   - **Question Management**: Live editing with automatic revisioning when questions have responses, reordering, and deactivation.
   - **Flattened CSV Export**: Download one row per completed respondent formatted for Excel and Power BI.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18.17+ or 20+
- npm

### 2. Setup Environment Variables
Ensure `.env.local` contains:
```env
DATABASE_URL=file:./kiyora-survey.db
ADMIN_INITIAL_PASSWORD=admin123
JWT_SECRET=kiyora-dev-secret-change-in-production-32chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Initialize & Seed Database
```bash
# Push the Drizzle schema to your local SQLite file
npm run db:push

# Seed all 6 sections, 25 questions, normalized options, and admin user
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the survey.  
Access the Admin Portal at [http://localhost:3000/admin/login](http://localhost:3000/admin/login).
- **Username**: `admin`
- **Password**: `admin123`

### 5. Run Verification Test Suite
```bash
npm test
```
Executes all 41 end-to-end integration tests verifying question constraints, conditional branching, sequence enforcement, admin auth, archiving, and CSV generation.

---

## 🌐 Deploying to Vercel with Turso (Cloud SQLite)

Because Vercel runs on a serverless architecture with ephemeral filesystems, production data must be stored in a cloud-hosted SQLite database. **Turso (libSQL)** is 100% SQLite-compatible and has a generous free tier.

### Step 1: Create a Turso Database
1. Install the Turso CLI or log into [turso.tech](https://turso.tech).
2. Run:
   ```bash
   turso db create kiyora-survey-db
   turso db show kiyora-survey-db --url
   turso db tokens create kiyora-survey-db
   ```

### Step 2: Push Schema & Seed Turso
In your terminal:
```bash
# Set your Turso credentials temporarily in environment:
$env:TURSO_DATABASE_URL="libsql://kiyora-survey-db-[your-org].turso.io"
$env:TURSO_AUTH_TOKEN="[your-turso-auth-token]"
$env:NODE_ENV="production"

# Push schema and seed production database:
npm run db:push
npm run db:seed
```

### Step 3: Deploy to Vercel
1. Import the project repository into [Vercel](https://vercel.com).
2. Under **Project Settings > Environment Variables**, add:
   - `TURSO_DATABASE_URL`: `libsql://kiyora-survey-db-[your-org].turso.io`
   - `TURSO_AUTH_TOKEN`: `[your-auth-token]`
   - `ADMIN_INITIAL_PASSWORD`: `[your-secure-admin-password]`
   - `JWT_SECRET`: `[random-32-char-secret]`
   - `NEXT_PUBLIC_APP_URL`: `https://your-project.vercel.app`
   - `NODE_ENV`: `production`
3. Click **Deploy**.
