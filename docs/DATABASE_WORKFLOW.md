# Database Migration Workflow

This project uses Cloudflare D1 for the database. To ensure stability and AI autonomy, we have "squashed" previous migrations into a single baseline.

## Current State (Post-Synchronization)
- **Baseline**: `migrations/0001_schema_sync.sql` contains the complete schema as of Dec 22, 2025.
- **History Reset**: The database considers this baseline "applied".

## How to Make Database Changes
**DO NOT** modify the database manually via Cloudflare dashboard or temporary SQL commands if you want to keep the project maintainable.

### Step 1: Create a Migration File
Create a new `.sql` file in the `migrations` folder with the next sequential number.
Example: `migrations/0002_add_new_table.sql`

```sql
-- Migration: Add new users table
CREATE TABLE new_users (
  id INTEGER PRIMARY KEY,
  name TEXT
);
```

### Step 2: Apply Locally (For Testing)
```bash
npx wrangler d1 migrations apply ooh-db --local
```

### Step 3: Apply to Production
```bash
npx wrangler d1 migrations apply ooh-db --remote
```

## Useful Commands
- **List Migrations**: `npx wrangler d1 migrations list ooh-db --remote`
- **Backup Schema**: `npx wrangler d1 execute ooh-db --remote --command ".schema" > backup.sql`
