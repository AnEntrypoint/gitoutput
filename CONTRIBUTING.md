# Contributing to Gitingest

Thanks for your interest in contributing to **Gitingest** 🚀 Our goal is to keep the codebase friendly to first-time
contributors.

---

## How to Contribute (non-technical)

- **Create an Issue** – found a bug or have a feature idea?
  [Open an issue](https://github.com/AnEntrypoint/gitingest/issues/new).
- **Spread the Word** – tweet, blog, or tell a friend.
- **Use Gitingest** – real-world usage gives the best feedback. File issues with anything you notice.

---

## How to submit a Pull Request

> **Prerequisites**: The project uses **Node.js 18+** and `pre-commit` for development.

1. **Fork** the repository.

2. **Clone** your fork:

   ```bash
   git clone https://github.com/AnEntrypoint/gitingest.git
   cd gitingest
   ```

3. **Set up the dev environment**:

   ```bash
   npm install
   pre-commit install
   ```

4. **Create a branch** for your changes:

   ```bash
   git checkout -b your-branch
   ```

5. **Make your changes.**

6. **Stage** the changes:

   ```bash
   git add .
   ```

7. **Run the CLI** against a real directory or repo to manually verify your changes:

    ```bash
    gitingest .
    gitingest https://github.com/some/repo
    ```

8. *(Optional)* **Run `pre-commit` on all files** to check hooks without committing:

   ```bash
   pre-commit run --all-files
   ```

9. **Commit** (signed):

    ```bash
    git commit -S -m "Your commit message"
    ```

    If *pre-commit* complains, fix the problems and repeat **5 – 8**.

10. **Push** your branch:

    ```bash
    git push origin your-branch
    ```

11. **Open a pull request** on GitHub with a clear description.

    > **Important:** Pull request titles **must follow
    the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification**. This helps with
    changelogs and automated releases.

12. **Iterate** on any review feedback—update your branch and repeat **6 – 10** as needed.

*(Optional) Invite a maintainer to your branch for easier collaboration.*
