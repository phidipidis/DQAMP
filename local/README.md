# DQAMP 2026 — local version

Runs on your own Windows PC at http://127.0.0.1:3002. Data stays in `data\dqamp.db` on this computer.

## One-time setup

1. Install **Node.js 24 LTS** from https://nodejs.org.
2. Put the DepEd Lucena logo in `public\deped-lucena-logo.jpg` (see `public\PUT-LOGO-HERE.txt`).
3. Double-click **start-dqamp.cmd**. The first run installs components and builds the app (a few minutes).
4. Create the first administrator, in a second window opened in this folder:

   ```
   npm run create-admin -- you@deped.gov.ph "Your Name"
   ```

   Copy the temporary password it prints.
5. Sign in at http://127.0.0.1:3002 with that email and password.
6. Change the password:

   ```
   npm run set-password -- you@deped.gov.ph "a-new-password-8-or-more-characters"
   ```

## Daily use

Double-click **start-dqamp.cmd**. It opens http://127.0.0.1:3002 in your browser. To stop DQAMP, press Ctrl+C in its window or double-click **stop-dqamp.cmd**.

## Adding users

Sign in as an administrator, open **User Management → Add User**, choose the role, and give the temporary password the dialog shows (it is shown only once). The new user signs in and can change it with `npm run set-password`.

Roles: Implementer, Planning Admin, QA Assessor, Administrator.

## Attachments

Files are not uploaded to DQAMP. Upload each file to OneDrive, open its **Share → Copy link**, and paste the link into the Evidence / MOV or QAME report field.

## Backup

Copy the `data` folder to another drive or cloud folder while DQAMP is closed. That folder holds all records and accounts.

## Scope of this version

Core pages only: Dashboard, Organizational Goals, Division Objectives, Projects, Outputs, Activities (including the calendar and import), User Management, System Settings, Report Center and the PIRPA report.
