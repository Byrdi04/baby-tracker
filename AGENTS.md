# DSH Agent Instructions

## Git Workflow

You are working on the baby-tracker web app. Follow these rules for every session:

### Branching
- Always work on the `dsh/dev` branch unless told otherwise
- Never commit directly to `main`
- Check you are on the right branch before starting: `git checkout dsh/dev`

### Committing
- Commit early and often — after each logical change, not only at the end
- Use conventional commit messages: `feat:`, `fix:`, `chore:`, `refactor:`
- Always run `git status` before committing to confirm what you are staging
- Never commit the `data/` directory
- Never commit `.env` files or secrets

### Pushing
- Push to GitHub after every commit: `git push origin <branch-name>`
- If the branch does not exist on remote yet, use: `git push -u origin <branch-name>`

### When you are finished
- Confirm the final push was successful by running: `git log --oneline origin/<branch-name> -n 3`
- Tell the user: "Changes pushed to GitHub on branch `<branch-name>`. The dev container will pick them up within 30 seconds. Check http://baby-tracker-dev.yourlocaladdress to review."

## Dev Container
- The dev container polls GitHub every 30 seconds for changes on its current branch
- It automatically reinstalls dependencies if `package.json` changes
- It restarts the Next.js dev server after every pull

## Project Details
- Framework: Next.js 24
- Database: SQLite via better-sqlite3
- Data directory: `/app/data` (never modify this via git)
- Dev command: `npm run dev`
- Port: 3000
