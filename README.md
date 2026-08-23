# E-Attendance

A daily student attendance PWA backed by Google Sheets (no database, no server to run).

- `apps-script/` — the backend: a Google Apps Script bound to your Google Sheet, exposed as a Web App API.
- `web/` — the frontend: a React + Vite Progressive Web App, installable on phones.

## 1. Create the Google Sheet

1. Create a new Google Sheet (e.g. "School Attendance").
2. Extensions → Apps Script.
3. Delete the default `Code.gs` content and paste in the contents of `apps-script/Code.gs`.
4. In the Apps Script editor, open `appsscript.json` (Project Settings → "Show appsscript.json") and replace it with `apps-script/appsscript.json`.
5. From the function dropdown, select `setupSheets` and click Run once. This creates the `Teachers`, `Students`, `Attendance`, `Holidays` tabs with headers. Grant the permissions it asks for.
6. Go back to the Sheet and fill in the `Teachers` tab:
   | Email | Name | ClassesAssigned |
   |---|---|---|
   | teacher1@gmail.com | Mrs. Sharma | 6 |
   | teacher2@gmail.com | Mr. Rao | 11-A,11-B |

   `ClassesAssigned` is comma-separated `Class` or `Class-Section` (section only matters for 11/12).

## 2. Deploy the Apps Script as a Web App

1. In the Apps Script editor: Deploy → New deployment → type "Web app".
2. Execute as: **Me**. Who has access: **Anyone**. (Auth is enforced inside the script by verifying the signed-in Google user against the `Teachers` tab — no one else can read/write even though the endpoint itself is public.)
3. Deploy, authorize, and copy the Web App URL (ends in `/exec`).

## 3. Set up Google Sign-In (OAuth client)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create an OAuth 2.0 Client ID, type "Web application".
3. Add your eventual hosting URL (e.g. `https://your-app.web.app`) and `http://localhost:5173` (for local dev) under "Authorized JavaScript origins".
4. Copy the generated Client ID.

## 4. Configure and build the frontend

```bash
cd web
cp .env.example .env
# edit .env:
#   VITE_APPS_SCRIPT_URL=<web app URL from step 2>
#   VITE_GOOGLE_CLIENT_ID=<client ID from step 3>
npm install
npm run dev      # local testing at http://localhost:5173
npm run build    # production build in web/dist
```

## 5. Host it (Firebase Hosting, free)

```bash
npm install -g firebase-tools
firebase login
cd web
firebase init hosting
#   - use an existing/new Firebase project
#   - public directory: dist
#   - configure as single-page app: Yes
#   - set up automatic builds with GitHub: optional, No is fine
firebase deploy
```

Firebase gives you a URL like `https://your-app.web.app`. Open it on a phone browser and use "Add to Home Screen" to install it like a native app.

Remember to add that final URL to the OAuth client's Authorized JavaScript origins (step 3) and redeploy if it changed.

## Notes

- **Offline support**: attendance marked while offline is saved to the browser's local storage (IndexedDB) and automatically synced to the Sheet once back online.
- **Reports**: daily/weekly/monthly views and category-wise counts are computed by the Apps Script backend from the raw `Attendance` sheet — no manual spreadsheet formulas needed.
- **Sundays**: automatically shown as a holiday; you can also add ad-hoc holiday remarks (e.g. public holidays) from the Holidays tab in the app.
- **Roster**: the `Students` sheet stores DOB, Scholar No., and Category, but daily/weekly/monthly report views only ever display Name + Surname.
