# Release process

tagpr maintains a release pull request. Merging that pull request creates the version tag and publishes a GitHub Release containing the Chrome Web Store package. Upload to Chrome Web Store and review submission remain manual.

## Branch and version policy

- Keep `main` releasable. Use short-lived `feat/*`, `fix/*`, or `chore/*` branches and squash merge pull requests after CI passes.
- Do not maintain `develop`, release, hotfix, or moving major/minor tag branches. The `tagpr-from-*` branch is created and updated by tagpr for its release pull request.
- Use `X.Y.Z` versions and `vX.Y.Z` tags.
  - Increment minor for a backward-compatible feature.
  - Increment patch for a backward-compatible fix.
  - Increment major for an incompatible behavior change.
- Keep the versions in `manifest.json`, `package.json`, and `package-lock.json` identical.
- Published releases are immutable. Correct a released package with a new version instead of moving its tag or replacing its assets.

## Prepare a release

1. Merge the intended changes to `main`. Do not include unrelated open pull requests.
2. Open the pull request labeled `tagpr`. It is created or updated after each push to `main`.
3. Select exactly one version increment on the release pull request:
   - Patch, such as `v1.1.0` to `v1.1.1`: remove both `tagpr:minor` and `tagpr:major`.
   - Minor, such as `v1.1.0` to `v1.2.0`: add `tagpr:minor` and remove `tagpr:major`.
   - Major, such as `v1.1.0` to `v2.0.0`: add `tagpr:major` and remove `tagpr:minor`.
4. Wait for the Release workflow triggered by the label change to update the release pull request.
5. Confirm the release pull request updates `manifest.json`, `package.json`, `package-lock.json`, and `CHANGELOG.md` as expected.
6. Approve the GitHub Actions workflow when the release pull request shows **Approve workflows to run**, then confirm the `test` check passes.
7. Squash merge the release pull request.

The Release workflow runs `npm test` before tagpr creates a tag. When the merged pull request is the tagpr release pull request, the workflow creates a draft GitHub Release, attaches these files, and then publishes it:

- `web-markdown-renderer-X.Y.Z.zip`
- `web-markdown-renderer-X.Y.Z.zip.sha256`

If validation fails before tagpr runs, no tag or release is created. If the workflow fails after tagpr creates the draft Release, inspect and resolve that draft instead of deleting or moving its tag automatically.

## Verify and submit to Chrome Web Store

1. Download the ZIP and checksum from the GitHub Release and verify the SHA-256 checksum.
2. Extract the ZIP and load it from `chrome://extensions` as an unpacked extension.
3. Verify selection rendering from the context menu and extension action.
4. Verify lists, tables, code blocks, and Mermaid rendering.
5. In Chrome Developer Dashboard, choose **Upload New Package** and upload the same ZIP.
6. Confirm the uploaded version matches the GitHub Release tag.
7. Submit the item for review and select automatic publishing after approval.

Chrome Web Store API credentials, Google Cloud OIDC, personal access tokens, GitHub App credentials, and repository secrets are not used by this release process.
