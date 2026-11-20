# Database Migrations

Kostly uses **golang-migrate** for managing PostgreSQL database schema migrations.

Migration files are stored in `backend/db/migrations/`.

---

## 1. Naming Convention

All migrations follow sequential 6-digit numbering with paired `.up.sql` and `.down.sql` files:

```text
backend/db/migrations/
├── 000001_create_profiles_table.up.sql
├── 000001_create_profiles_table.down.sql
├── 000002_create_properties_table.up.sql
└── 000002_create_properties_table.down.sql
```

- **`*.up.sql`**: Contains schema changes to apply (e.g. `CREATE TABLE`, `ADD COLUMN`).
- **`*.down.sql`**: Contains the reverse operations to roll back changes cleanly (e.g. `DROP TABLE`, `DROP COLUMN`).

---

## 2. Prerequisites & Installation

Ensure the `migrate` CLI is installed with PostgreSQL driver support.

### Install via Go
```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

### Install via Package Manager
- **Windows (Scoop):** `scoop install migrate`
- **macOS (Homebrew):** `brew install golang-migrate`
- **Linux:** Download official prebuilt binaries from [golang-migrate releases](https://github.com/golang-migrate/migrate/releases).

Verify installation:
```bash
migrate -version
```

---

## 3. Environment Variable Configuration

Migrations connect using `DATABASE_URL` configured in `backend/.env`.

> [!WARNING]
> Never hardcode or commit database credentials. Always load `DATABASE_URL` from the local `.env` file or environment.

### Loading `.env` into Your Shell Session

Before running migration commands, load your environment variables from the `backend/` directory:

#### PowerShell (Windows)
```powershell
Get-Content .env | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#')) {
        $key, $value = $line -split '=', 2
        if ($key) {
            $key = $key.Trim()
            $value = $value.Trim()
            if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
}
```

#### Bash / macOS / Linux
```bash
set -a
source .env
set +a
```

> [!NOTE]
> The Bash `source .env` method requires shell-compatible syntax in `.env` (e.g. `KEY=VALUE` or `KEY="VALUE"`, with no unquoted spaces around `=`).

---

## 4. Migration Commands

All commands below assume you are in the `backend/` directory and your environment variables are loaded:

```bash
cd backend
```

### A. Creating a New Migration

Generate a new migration pair with sequential 6-digit numbering:

```bash
migrate create -ext sql -dir db/migrations -seq <migration_name>
```

**Example:**
```bash
migrate create -ext sql -dir db/migrations -seq create_profiles_table
```

This generates:
- `db/migrations/000001_create_profiles_table.up.sql`
- `db/migrations/000001_create_profiles_table.down.sql`

---

### B. Applying Migrations (`up`)

Apply all pending migrations to the database:

#### PowerShell (Windows)
```powershell
migrate -path db/migrations -database "$env:DATABASE_URL" up
```

#### Bash / macOS / Linux
```bash
migrate -path db/migrations -database "$DATABASE_URL" up
```

To apply a specific count `N` of migrations:
```bash
migrate -path db/migrations -database "$DATABASE_URL" up 1
```

---

### C. Rolling Back Migrations (`down`)

Roll back the most recent migration:

#### PowerShell (Windows)
```powershell
migrate -path db/migrations -database "$env:DATABASE_URL" down 1
```

#### Bash / macOS / Linux
```bash
migrate -path db/migrations -database "$DATABASE_URL" down 1
```

---

### D. Checking Migration Version

Check the currently applied migration version and dirty status:

#### PowerShell (Windows)
```powershell
migrate -path db/migrations -database "$env:DATABASE_URL" version
```

#### Bash / macOS / Linux
```bash
migrate -path db/migrations -database "$DATABASE_URL" version
```

---

## 5. Troubleshooting: Dirty State Recovery

If a migration encounters an error while executing (e.g. SQL syntax error, permission error, or constraint violation), PostgreSQL records the state as **`dirty`** in the `schema_migrations` tracking table (`dirty = true`).

When a database is in a dirty state, all subsequent `migrate up` and `migrate down` operations are blocked to prevent schema corruption.

> [!CAUTION]
> **What `migrate force` actually does:**
> Running `migrate force <version>` **only** updates the version number and resets the `dirty` flag to `false` in the `schema_migrations` metadata table.
>
> It **does not**:
> - Execute or roll back any SQL statements.
> - Undo partially created tables, columns, indexes, or types.
> - Repair or restore the database schema.
>
> **Do not blindly force the version.** You must inspect and reconcile the actual database schema first before forcing a version.

### Step-by-Step Recovery Procedure

1. **Diagnose the Failure:**
   Review the CLI error output to identify which migration file and statement caused the failure.

2. **Inspect the Database Schema:**
   Connect to PostgreSQL (using the Supabase SQL Editor, `psql`, or a database client) and inspect what objects were partially created before the migration failed.

3. **Reconcile the Schema Manually:**
   Choose one of the following reconciliation strategies based on your desired state:
   - **Rollback Approach (Recommended):** Manually drop or revert any schema objects created by the failed migration so the database cleanly matches the state of the *previous* clean version `V_previous`.
   - **Forward Fix Approach:** Manually run the remaining SQL statements from the failed script so the database completely matches the *target* version `V_target`.
   - Fix the underlying issue in the migration script file (`*.up.sql` or `*.down.sql`) to prevent future failures.

4. **Reset the Dirty Flag via `migrate force`:**
   Once the database schema has been manually reconciled to match version `<version>`:

   #### PowerShell (Windows)
   ```powershell
   migrate -path db/migrations -database "$env:DATABASE_URL" force <version>
   ```

   #### Bash / macOS / Linux
   ```bash
   migrate -path db/migrations -database "$DATABASE_URL" force <version>
   ```

   - If you rolled back changes, set `<version>` to `V_previous`.
   - If you manually applied the rest of the migration, set `<version>` to `V_target`.

5. **Verify Version Status:**
   ```bash
   migrate -path db/migrations -database "$DATABASE_URL" version
   ```
   Confirm that the output reports the target version without an error or dirty indicator.
