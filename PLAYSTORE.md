# Publish Pidaka on Google Play

App ID: `in.pidaka.app`  
Website: https://pidaka.in  
Privacy: https://pidaka.in/privacy  
Delete account: https://pidaka.in/delete-account  
Child safety (CSAE): https://pidaka.in/child-safety

---

## Part A — Build the AAB (on your Mac)

### 1. One-time: upload keystore

```bash
keytool -genkey -v \
  -keystore ~/pidaka-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias pidaka
```

Save the **keystore file**, **keystore password**, **alias**, and **key password**.  
Losing them means you cannot update the app later.

### 2. Bump version

Edit `android/app/build.gradle`:

```gradle
versionCode 1        // raise by 1 every Play upload (2, 3, 4…)
versionName "1.0"    // human version, e.g. "1.0.1"
```

### 3. Sync web into Android

```bash
cd /path/to/pidaka
npm run cap:sync
```

### 4. Make a signed App Bundle

```bash
npm run cap:open
```

In Android Studio:

1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle**
3. Pick `~/pidaka-upload.jks`, alias `pidaka`
4. Choose **release**
5. Finish

File to upload:

`android/app/build/outputs/bundle/release/app-release.aab`

---

## Part B — Play Console (first publish)

Open [Google Play Console](https://play.google.com/console).

### 1. Create the app

1. **Create app**
2. Name: **Pidaka**
3. Default language: English (or your choice)
4. Type: **App**
5. Free / paid: **Free**
6. Accept declarations → **Create app**

### 2. Dashboard checklist (do these in order)

Play shows a list. Fill each item until the store listing can go live.

#### App access
- All features available without special login for review, or provide a test account if needed.

#### Ads
- Usually **No** (Pidaka has no ads).

#### Content rating
- Start questionnaire → answer honestly (user-generated content / messaging) → save.

#### Target audience
- Set age group (typically 18+ if the wall can hold adult themes; choose what matches your policy).

#### News app
- No.

#### Data safety
- Declare what you collect (e.g. email / phone / location for guests / approximate device info).
- Link privacy policy: `https://pidaka.in/privacy`
- Say if data is encrypted in transit (yes for HTTPS).

#### Government apps
- No (unless it is).

#### Financial features
- None.

#### Health
- None.

### 3. Store listing

**Main store listing → Create**

| Field | Suggestion |
|--------|------------|
| App name | Pidaka |
| Short description | Speak freely. Anonymously. |
| Full description | A quiet anonymous wall. Paste without a public profile. Burns are anonymous replies. Reading is free. |
| App icon | 512×512 PNG |
| Feature graphic | 1024×500 PNG |
| Phone screenshots | At least 2 (from a real device or emulator) |
| Privacy policy | `https://pidaka.in/privacy` |
| Category | Social / Lifestyle (pick closest) |
| Contact email | your support email |

### 4. Countries

**Production → Countries/regions** → select where you want it available (e.g. India only, or all).

### 5. Upload the AAB

1. **Testing → Internal testing** (recommended first) **or** **Production**
2. **Create new release**
3. Upload `app-release.aab`
4. Release name: e.g. `1.0 (1)`
5. **Release notes** (keep under ~500 characters — not the full app description). Example for first release:

   ```
   First release of Pidaka.
   An anonymous wall to paste, listen, and burn — with no public profiles.
   ```

   Put the long copy in **Store listing → Full description**, not here.
6. **Next → Save → Review / Start rollout**

Internal testing: add your Gmail as a tester, install from the opt-in link, confirm it works, then promote to Production.

### 6. Send for review

When checklist is green and a release is ready:

1. **Publishing overview → Send for review** (or start Production rollout)
2. Wait for Google review (hours to a few days)

---

## Part C — Later updates

Every new Play upload:

1. Raise `versionCode` (+1) and optionally `versionName`
2. `npm run cap:sync`
3. Build a new signed AAB
4. Play Console → Production (or testing) → **Create new release** → upload AAB → roll out

Same keystore forever.

---

## Hearth (optional second app)

Package: `in.pidaka.hearth`  
Build with `npm run cap:sync:hearth` then open `android-hearth` in Android Studio.  
Create a **separate** Play app and a **separate** keystore if you publish Hearth publicly.

---

## Do not

- Commit `*.jks`, keystore passwords, or `google-services.json` secrets to git if they are private
- Reuse an old `versionCode`
- Lose the upload keystore
