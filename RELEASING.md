# Release process

GitHub Actions creates the version tag and GitHub Release. Upload to Chrome Web Store and review submission remain manual.

## Branch and version policy

- Keep `main` releasable. Use short-lived `feat/*`, `fix/*`, or `chore/*` branches and squash merge pull requests after CI passes.
- Do not create `develop`, release, hotfix, or moving major/minor tag branches.
- Use `X.Y.Z` versions and `vX.Y.Z` tags.
  - Increment minor for a backward-compatible feature.
  - Increment patch for a backward-compatible fix.
  - Increment major for an incompatible behavior change.
- Keep the versions in `manifest.json`, `package.json`, and `package-lock.json` identical.
- Published releases are immutable. Correct a released package with a new version instead of moving its tag or replacing its assets.

## Prepare a release

1. Merge the intended changes to `main`. Do not include unrelated open pull requests.
2. For a new version, update `manifest.json`, `package.json`, and `package-lock.json` in a release preparation pull request.
3. Confirm the `test` check passes on the merged commit.
4. Open **Actions > Release > Run workflow**, select `main`, and run it.

The workflow derives the tag and package name from `package.json`, runs `npm test`, and publishes:

- `web-markdown-renderer-X.Y.Z.zip`
- `web-markdown-renderer-X.Y.Z.zip.sha256`

If validation fails, no release is created. If the workflow fails after creating the draft Release, inspect and resolve that draft instead of deleting or moving its tag automatically.

## Verify and submit to Chrome Web Store

1. Download the ZIP and checksum from the GitHub Release and verify the SHA-256 checksum.
2. Extract the ZIP and load it from `chrome://extensions` as an unpacked extension.
3. Verify selection rendering from the context menu and extension action.
4. Verify lists, tables, code blocks, and Mermaid rendering.
5. In Chrome Developer Dashboard, choose **Upload New Package** and upload the same ZIP.
6. Confirm the uploaded version matches the GitHub Release tag.
7. Submit the item for review and select automatic publishing after approval.

Chrome Web Store API credentials, Google Cloud OIDC, and GitHub Secrets are not used by this release process.
