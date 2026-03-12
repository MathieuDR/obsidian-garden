# Obsidian Garden
## Quartz v4

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

Quartz is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought) and notes as a website for free.
Quartz v4 features a from-the-ground rewrite focusing on end-user extensibility and ease-of-use.

🔗 Read the documentation and get started: https://quartz.jzhao.xyz/

[Join the Discord Community](https://discord.gg/cRFFHYye7t)

## Setting up your local content folder

The `content` folder is configured as a git submodule pointing to an example
vault. For local development, you probably want to point it at your own notes
instead. The instructions below cover the most common starting points.

> After setup, `git pull` will never touch your content folder again.

---

### Case 1: Fresh clone (submodule not yet initialized)

You just cloned the repo and haven't done anything with `content` yet.
```bash
# Skip initializing the submodule entirely, we don't need it
# Then symlink your notes in
ln -s /path/to/your/notes content

# Tell git to ignore changes to this path
git update-index --skip-worktree content

# Prevent git from ever recursing into submodules on pull/fetch
git config submodule.recurse false
git config fetch.recurseSubmodules false
```

---

### Case 2: Submodule is initialized (content folder has the example vault)

You ran `git submodule init` or cloned with `--recurse-submodules`.
```bash
# Unregister the submodule from .git/config and clear the content folder
git submodule deinit -f content

# Remove the content folder that was checked out
rm -rf content

# Symlink your notes in
ln -s /path/to/your/notes content

# Remove the submodule from git's index, then immediately mark it ignored
# (order matters: skip-worktree needs the entry to exist, so do it before git rm)
git update-index --skip-worktree content
git rm --cached content

# Prevent git from ever recursing into submodules on pull/fetch
git config submodule.recurse false
git config fetch.recurseSubmodules false
```

---

### Case 3: Content folder exists but is in an unknown state

You've been experimenting and aren't sure what state things are in.
```bash
# Reset any staged changes to content so git isn't blocking anything
git restore --staged content 2>/dev/null || true

# Blow away whatever is there and start clean
rm -rf content

# Unregister the submodule in case it was initialized at some point
git submodule deinit -f content 2>/dev/null || true

# Symlink your notes in
ln -s /path/to/your/notes content

# Mark it ignored before removing from index
git update-index --skip-worktree content
git rm --cached content 2>/dev/null || true

# Prevent git from ever recursing into submodules on pull/fetch
git config submodule.recurse false
git config fetch.recurseSubmodules false
```

---

> **Note:** All of these changes are local only. `.gitmodules` is left intact
> so other contributors and CI/CD pipelines can still use the submodule
> normally.
