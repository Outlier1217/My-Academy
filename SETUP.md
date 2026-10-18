# Outlier Academy — setup guide

This is an overlay for your existing `Outlier1217/Outlier-Academy` repository. It keeps the existing mathematics routes and simulator components, while adding a publishing system, a PostgreSQL data model, an admin panel, content pages, light/dark mode and scroll-triggered animation.

## 1. Apply the overlay in Codespaces

1. Open your existing repository in GitHub Codespaces.
2. Extract/copy the files from this ZIP into the repository root, allowing the new files to merge with existing folders. Replace `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/Navbar.tsx`, `tailwind.config.ts`, `package.json`, and `.gitignore` when asked. Do not delete your existing `app/math` or `components/complex`, `components/quadratic`, or simulator files.
3. In the Codespaces terminal, run:

   ```bash
   corepack enable
   pnpm install
   cp .env.example .env
   ```

   If the `pnpm` command is not found after enabling Corepack, use `corepack pnpm install` and `corepack pnpm <script>` for the commands below.

4. Create the local development database. Docker is available in most Codespaces environments:

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

5. Generate a bcrypt hash for a strong admin password (run after `pnpm install`):

   ```bash
   node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" 'REPLACE_WITH_A_LONG_UNIQUE_PASSWORD'
   ```

   Copy the printed hash into `ADMIN_PASSWORD_HASH` in `.env`. Set `ADMIN_EMAIL` to your admin email. Generate a session secret:

   ```bash
   openssl rand -base64 32
   ```

   Put its output in `SESSION_SECRET`. Never commit `.env` or share the password/hash/session secret.

6. Your local `.env` can use this connection URL (change the password if you changed it in `docker-compose.dev.yml`):

   ```dotenv
   DATABASE_URL="postgresql://outlier:change_this_password@localhost:5432/outlier_academy?schema=public"
   ```

7. Create the database tables and start the website:

   ```bash
   pnpm db:migrate --name init_content_platform
   pnpm dev
   ```

   Open port `3000` in the Codespaces Ports tab. Visit `/admin/login` to sign in.

> If you see an error that the Prisma client cannot be found, run `pnpm db:generate`. After schema edits, use `pnpm db:migrate --name describe_your_change` in development. Because the repository previously tracked generated `.next` output, stop tracking it once (after applying the overlay): `git rm -r --cached .next` if that directory is in Git. The updated `.gitignore` prevents new generated output from being added.

## 2. Admin content workflow

- Go to `/admin/login` and sign in with the credentials configured in `.env`.
- The Content Studio can create, edit, publish, archive and delete Articles, Blogs, Stories and Mock Tests.
- Select a subject: NISM, NCFM, Finance, AI / Machine Learning, Blockchain Technology, DeFi, Mathematics or General.
- Article/blog/story bodies accept Markdown. Text, tags, metadata and mock-test questions are stored in PostgreSQL.
- Cover art currently uses a hosted image URL. Store images and PDFs in object/file storage (rather than putting large binary files in PostgreSQL) if you later want direct media uploads.
- For a mock test, set Content type to **Mock Test** and paste a JSON array into the questions box. `answer` is a zero-based option index (`0` = first option, `1` = second). Example:

  ```json
  [
    {
      "question": "Which measure represents the sensitivity of a portfolio to market movements?",
      "options": ["Beta", "Alpha", "Face value", "Coupon rate"],
      "answer": 0,
      "explanation": "Beta measures sensitivity to movements in the broader market."
    },
    {
      "question": "If a simple return is 10% on an investment of ₹1,000, what is the profit?",
      "options": ["₹10", "₹100", "₹900", "₹1,100"],
      "answer": 1,
      "explanation": "10% × ₹1,000 = ₹100."
    }
  ]
  ```

  Those are generic demonstration questions, not official NISM/NCFM questions. Replace them with your own reviewed material. Correct answers are checked by the server and are not sent to the browser before submission.

## 3. PostgreSQL on your Hostinger VPS (production)

The deployed website should use your **VPS PostgreSQL database**. For production, prefer running the Next.js application and PostgreSQL on the same VPS, with PostgreSQL listening only on localhost/private networking. Do **not** expose port `5432` to the whole internet. Use a dedicated PostgreSQL role with access only to the academy database, not the PostgreSQL superuser.

Example PostgreSQL commands on Ubuntu (execute as a PostgreSQL administrator, and choose your own strong password):

```bash
sudo -u postgres psql
```

Then in `psql`:

```sql
CREATE USER outlier_app WITH ENCRYPTED PASSWORD 'REPLACE_WITH_A_LONG_RANDOM_DB_PASSWORD';
CREATE DATABASE outlier_academy OWNER outlier_app;
\q
```

If PostgreSQL and Next.js run on the same VPS, set the production environment variable in your private deployment environment (not in Git):

```dotenv
DATABASE_URL="postgresql://outlier_app:YOUR_DB_PASSWORD@127.0.0.1:5432/outlier_academy?schema=public"
ADMIN_EMAIL="your-admin-email@example.com"
ADMIN_PASSWORD_HASH="your-generated-bcrypt-hash"
SESSION_SECRET="a-new-random-secret-of-at-least-32-characters"
NEXT_PUBLIC_SITE_URL="https://your-domain.example"
NODE_ENV="production"
```

Upload `.env` values using a secure server method, then run from the project directory on your VPS:

```bash
pnpm install --frozen-lockfile # only after you have generated and committed the matching pnpm-lock.yaml
pnpm db:generate
pnpm db:deploy
pnpm build
pnpm start
```

During first setup (before a lockfile exists for the new dependency list), run `pnpm install`, which creates/updates `pnpm-lock.yaml`, then commit the lockfile. For subsequent deployments use `pnpm install --frozen-lockfile`.

Configure Nginx with HTTPS in front of the Next.js app and keep the app under a process manager such as systemd or PM2. Back up PostgreSQL before schema changes and on a regular schedule. Restrict SSH, update Ubuntu packages, and avoid running the web app as root.

### Development database vs production database

The included Compose file is a **local development database** so you do not need to expose production Postgres to Codespaces. Content created in local development is stored in that local database; content entered on the deployed website is stored in the VPS database.

**To have Codespaces save directly into your VPS PostgreSQL during development**, use an SSH tunnel instead of opening Postgres port `5432` to the internet:

1. Set up a non-root SSH user on your VPS and add a dedicated SSH public key for the Codespace. Store the private key in a Codespaces secret, not in Git. Keep SSH access restricted and verify the VPS SSH host fingerprint before trusting it.
2. Confirm the database is reachable on `127.0.0.1:5432` from the VPS itself, and that the `outlier_app` role/database have already been created as above.
3. In one Codespaces terminal, start the tunnel (replace the username and host with your own):

   ```bash
   ssh -N -L 5433:127.0.0.1:5432 outlier-deploy@YOUR_VPS_HOST
   ```

4. In `.env`, use port `5433` so Prisma travels through that tunnel:

   ```dotenv
   DATABASE_URL="postgresql://outlier_app:URL_ENCODED_DB_PASSWORD@127.0.0.1:5433/outlier_academy?schema=public"
   ```

5. In a second terminal, run migrations/dev server. Keep the tunnel terminal alive while the app is running. Stop it with `Ctrl+C` when finished.

This tunnel sends database traffic through SSH while PostgreSQL stays private. Remember: because this connects to production data, migrations and deletes from Codespaces affect the live VPS database. Take a backup first and use the local Compose database when testing destructive changes.

## 6. Next.js security version

This overlay uses the Next.js 14.2 compatibility line because the existing repository is built around React 18 and React Three Fiber 8. It updates the Next.js dependency from the repo's old `14.2.15` pin to `14.2.35`, which includes a published 2025 security fix. Do not assume that this compatibility pin is the latest maintained release: before putting the site on the public internet, review the current [official Next.js security advisories](https://nextjs.org/blog) and plan an upgrade to a currently maintained line. Major-version upgrades should be tested with the 3D math simulator dependencies before deployment.

## 4. Useful routes

- `/` — animated academy home, light/dark switch, profile links and recent published items.
- `/articles`, `/blogs`, `/stories` — public content library.
- `/mock-tests` — subject-wise practice library.
- `/content/<slug>` — individual article/blog/story or interactive mock test.
- `/math` — your existing mathematics area remains available.
- `/admin/login` and `/admin` — password-protected content studio.
- `/api/content` — public API for published content.

## 5. Before going live

- Set strong unique credentials and make sure `.env` is not committed.
- Use HTTPS; the admin session cookie is HttpOnly and SameSite=Strict.
- Run migrations against the intended database before deploying.
- Test login, publishing, editing, deleting, mock-test scoring and both themes.
- Keep regular PostgreSQL backups, monitor logs, and add a rate-limit/WAF rule to the admin login endpoint at the reverse proxy before public production use.
- The starter has a single administrator configured by environment variables. For a multi-admin setup, use a full authentication provider/role model rather than sharing one password.
