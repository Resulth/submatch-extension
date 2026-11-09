# SubMatch

SubMatch is a Manifest V3 Chrome extension for saving and reviewing vocabulary from video subtitles. The repository also contains the React web dashboard in `web/`.

## Extension package

The extension source is in `extension/`. Every push to `main` runs the workflow in `.github/workflows/publish-extension.yml`, which:

1. Tests and builds the web app and validates the extension scripts.
2. Copies the fresh web dashboard build into the extension, increments the patch version in `extension/manifest.json`, and pushes both to `main`.
3. Creates a GitHub Release with a downloadable extension ZIP and stores the ZIP as a workflow artifact.
4. Uploads and submits the package to the Chrome Web Store for review.

Chrome Web Store submissions still go through Google's review process; an API submission does not make the update immediately live.

## Configure Chrome Web Store publishing

The workflow requires the existing extension's publisher and item IDs, plus OAuth credentials for an account that can publish that item. Add these in **GitHub repository → Settings → Secrets and variables → Actions**:

**Repository variables**

- `CWS_PUBLISHER_ID`: publisher ID from the Chrome Web Store Developer Dashboard.
- `CWS_EXTENSION_ID`: ID of the existing Chrome Web Store item.

**Repository secrets**

- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`

Enable the Chrome Web Store API in Google Cloud and obtain an OAuth refresh token with the `https://www.googleapis.com/auth/chromewebstore` scope. Keep credentials in GitHub Actions secrets; do not commit them or share them in chat. The existing extension must already be published, and its listing/privacy details must be complete.

Once configured, pushing a change to `main` starts publishing automatically. The workflow can also be started manually from the repository's **Actions** tab.

## Web dashboard

```bash
cd web
npm ci
npm run dev
npm test
npm run build
```
