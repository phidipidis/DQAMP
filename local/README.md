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

Sign in as an administrator, open **User Management → Add User**, choose the role and division, and give the temporary password the dialog shows (it is shown only once). The user signs in and can change it with `npm run set-password`.

In **User Management**, every user has a **Division** column. Set it there for Implementers and Planning Admins (QA Assessors and administrators see all divisions). The page warns you when an Implementer or Planning Admin has no division.

The command line does the same thing:

```
npm run set-user -- name@deped.gov.ph --division CID
npm run set-user -- name@deped.gov.ph --role QA_Assessor
```

## Who can do what

| Role | Activities | Planning records (goals, objectives, projects, outputs) | Reviews and publishing | Users and settings |
|---|---|---|---|---|
| **Administrator** | All | All | Can publish and change any status | Full access |
| **Planning Admin** | Read all, no edits | Create and edit in their division | No | No |
| **QA Assessor** | Read all | Read all | Starts review, fills in QAME fields, returns for revision. Cannot publish. | No |
| **Implementer** | Read and edit in their division | Read all; create and edit in their division | Submits activities. No review or publishing. | No |

Rules are enforced by the server, not only by the menus. Records outside a user's division are hidden from them. Implementers can edit an activity only while it is Draft, Submitted or Returned for Revision. Under review, activities are locked for everyone except the reviewing assessor, who may fill in QAME fields.

## Attachments

Files are not uploaded to DQAMP. Upload each file to OneDrive, open its **Share → Copy link**, and paste the link into the Evidence / MOV or QAME report field.

## Backup

Copy the `data` folder to another drive or cloud folder while DQAMP is closed. That folder holds all records and accounts.

## Scope of this version

Core pages only: Dashboard, Organizational Goals, Division Objectives, Projects, Outputs, Activities (including the calendar and import), ARTA client feedback, User Management, System Settings, Report Center and the PIRPA report. Report Center lists only the reports this build includes.
