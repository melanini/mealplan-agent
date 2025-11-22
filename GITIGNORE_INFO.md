# .gitignore Configuration

## Overview

The `.gitignore` file is configured to prevent committing sensitive, temporary, or unnecessary files to version control.

## What's Ignored

### 📦 Dependencies
- `node_modules/` - NPM packages
- `package-lock.json` - Lock file (optional, can be tracked)
- Python packages and virtual environments

### 🔐 Sensitive Data
- `.env` files - Environment variables
- API keys and credentials
- Private keys and certificates
- Secrets and tokens

### 💾 User-Generated Data
- `data/plans/*.json` - User meal plans
- `data/metrics/*.json` - Usage metrics
- `tools/userProfileTool/db.json` - User profiles (optional)

### 📝 Logs
- All `*.log` files
- `data/logs/` directory contents
- Debug logs

### 🖥️ IDE & OS Files
- `.vscode/`, `.idea/` - IDE settings
- `.DS_Store` - macOS files
- `Thumbs.db` - Windows thumbnails
- Vim/Emacs temporary files

### 🏗️ Build Artifacts
- `dist/`, `build/` - Build outputs
- `ui/dist/` - Frontend builds
- Python `__pycache__/`

## What's Tracked

### ✅ Source Code
- All `.js`, `.py`, `.jsx`, `.css` files
- Configuration files
- Documentation (`.md` files)

### ✅ Sample Data
- `data/recipes/recipes.json` - Recipe database
- Empty directories via `.gitkeep` files

### ✅ Configuration
- `package.json` - Dependencies list
- `.gitignore` itself
- Environment templates (if created)

## Directory Structure

```
mealprep-agent/
├── .gitignore                    ✅ Tracked
├── data/
│   ├── recipes/
│   │   └── recipes.json          ✅ Tracked (sample data)
│   ├── plans/
│   │   ├── .gitkeep              ✅ Tracked (keeps dir)
│   │   └── *.json                ❌ Ignored (user data)
│   ├── metrics/
│   │   ├── .gitkeep              ✅ Tracked
│   │   └── *.json                ❌ Ignored
│   └── logs/
│       ├── .gitkeep              ✅ Tracked
│       └── *.json                ❌ Ignored
├── node_modules/                 ❌ Ignored (dependencies)
├── .env                          ❌ Ignored (secrets)
└── *.log                         ❌ Ignored (logs)
```

## Customization

### Track User Profiles

If you want to track example user profiles:

```bash
# Remove from .gitignore:
# tools/userProfileTool/db.json
```

### Track Package Lock

If your team wants consistent dependencies:

```bash
# Remove from .gitignore:
# package-lock.json
```

### Ignore All Recipes

If recipes are user-generated:

```gitignore
# Add to .gitignore:
data/recipes/*.json
!data/recipes/.gitkeep
```

## Best Practices

### ✅ DO Track
- Source code
- Documentation
- Configuration templates
- Sample/seed data
- Schema definitions
- Test fixtures

### ❌ DON'T Track
- Secrets and credentials
- User-generated data
- Dependencies (node_modules)
- Build artifacts
- IDE-specific settings
- OS-specific files
- Log files

## Security Checklist

Before committing, verify:

- [ ] No `.env` files
- [ ] No API keys
- [ ] No credentials
- [ ] No private keys
- [ ] No user data
- [ ] No secrets

## Common Mistakes

### ❌ Committed Secrets

If you accidentally commit secrets:

```bash
# Remove from history (dangerous!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/secret" \
  --prune-empty --tag-name-filter cat -- --all

# Or use BFG Repo-Cleaner
bfg --delete-files secret_file.txt
```

### ❌ Large User Data

If you commit large user-generated files:

```bash
# Add to .gitignore first
echo "data/plans/*.json" >> .gitignore

# Then remove from git
git rm --cached data/plans/*.json
git commit -m "Remove user data from tracking"
```

## Environment Variables

Create a `.env.example` template:

```bash
# .env.example (tracked)
GEMINI_API_KEY=your_api_key_here
TOOLS_BASE_URL=http://localhost
AGENT_BASE_URL=http://localhost:4000
```

Users copy to `.env` (not tracked):

```bash
cp .env.example .env
# Edit .env with real values
```

## Git Commands

### Check What's Ignored

```bash
# See ignored files
git status --ignored

# Check if specific file is ignored
git check-ignore -v data/plans/plan_123.json
```

### Force Add Ignored File

```bash
# If you really need to track an ignored file
git add -f path/to/file
```

### Clean Ignored Files

```bash
# Remove all ignored files (careful!)
git clean -fdX
```

## MCP Integration

The MCP server directory has its own `node_modules`:

```
mcp/
├── node_modules/        ❌ Ignored
├── package.json         ✅ Tracked
└── mcp_server.js        ✅ Tracked
```

## Collaborative Development

When working with a team:

1. **Always** check `.gitignore` before first commit
2. **Never** commit secrets
3. **Document** any .gitignore changes
4. **Review** what files are staged before committing
5. **Use** `.env.example` for environment templates

## Maintenance

### Review Periodically

Every few months:

1. Check for unnecessary ignored files
2. Update patterns as project grows
3. Add new file types as needed
4. Remove obsolete patterns

### Update for New Tools

When adding new tools or services:

```bash
# Example: Adding MongoDB
echo "*.mongodb" >> .gitignore
echo "dump/" >> .gitignore
```

## Resources

- [Git Documentation](https://git-scm.com/docs/gitignore)
- [GitHub .gitignore Templates](https://github.com/github/gitignore)
- [gitignore.io](https://www.toptal.com/developers/gitignore)

## Questions?

If unsure whether to track a file:

1. Is it sensitive? → **Don't track**
2. Is it user-generated? → **Don't track**
3. Is it reproducible? → **Don't track**
4. Is it source code? → **Track**
5. Is it configuration? → **Track (without secrets)**

---

**Last Updated**: November 22, 2025  
**Version**: 1.0.0

