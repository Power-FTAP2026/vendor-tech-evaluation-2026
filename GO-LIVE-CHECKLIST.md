# Go-live checklist — Google Sheet, Apps Script, Google Drive

Do these **in order**. It takes about 30 minutes. Tick each box as you go.
Everything here happens in your Google account. Nothing in the website needs to change for these steps.

---

## A. Google Drive: the ID pictures folder (2 min)

- [ ] **A1. Make it private.** Open the folder **Vendors Technician Evaluation 2026** → **Share** →
      General access: **Restricted** → Done. The app still saves photos because it runs as you.
- [ ] **A2. Delete the test photos.** Delete the file named like `VTE26-0001 - SORREDA, REBECCA R.jpg` and any
      files whose names start with `pending - `.

## B. Google Sheet (5 min)

- [ ] **B1. Make it private.** Open the Sheet **Vendors Technician Evaluation 2026** → **Share** →
      General access: **Restricted**. ⚠ The Sheet contains the **correct answers**.
- [ ] **B2. Set the time zone.** Go to **File → Settings → Time zone: (GMT+08:00) Manila** and Locale: **Philippines** → Save.
- [ ] **B3. Delete the test data.** In **Registration**, **Theoretical Evaluations Status** and
      **Practical Evaluation Status**, select **row 3 down to the last row with data** → right-click →
      **Delete rows**. Never delete row 2 (the headers).
- [ ] **B4. Leave the Questions tab as it is.** If you ever edit questions, run `rebuildExamSets` and `clearCache`
      in Apps Script afterwards (see C).

## C. Apps Script: install the latest backend (10 min)

All of these are in the project **Vendors Technician Evaluation 2026** at script.google.com.

- [ ] **C1. Paste the new code.** In VS Code, open `apps-script/Code.gs` → **Ctrl+A**, **Ctrl+C**.
      In Apps Script, open **Code.gs** → **Ctrl+A**, **Ctrl+V** → **Ctrl+S** (Save).
- [ ] **C2. Set the project time zone.** Go to **⚙ Project Settings** → **Time zone: (GMT+08:00) Manila**.
- [ ] **C3. Write the official practical stations.** In the toolbar function list choose **`resetPracticalSetup`** → **Run**.
      This rewrites the **Practical Setup** tab with the 4 stations (AC, ACU, DG, RS + Battery System with
      4.1. Rectifier System / 4.2. Battery), max 5 per scenario, and "0 to 5" / "5 and 0 only" scoring.
- [ ] **C4. Run setup.** Choose **`setup`** → **Run**. The log must end with something like:
      `Setup complete. Questions: 172. Sets: A=50 B=50 C=50 D=50. Static: 10. Stations: AC (4), ACU (3), DG (7), RS + Battery System (10).`
      This also adds the **Area** column, the **Scoring/Part** columns, and refreshes the **Summary** formulas.
- [ ] **C5. Clear the cache.** Choose **`clearCache`** → **Run**.
- [ ] **C6. Script properties.** Go to **⚙ Project Settings → Script properties → Edit script properties**:
  - `EVALUATOR_PIN` = *the evaluator PIN you chose* (never write the real PIN in any file of this website: it is public)
  - **Add** `EXAM_TEST_MODE` = `on`. This is only for the rehearsal in D; it lets the exam open outside the event days.
  - Click **Save script properties**. Unsaved changes are the most common reason a new PIN "doesn't work".
- [ ] **C7. Publish the new version.** Go to **Deploy → Manage deployments → ✏ Edit** (pencil) → Version: **New version** → **Deploy**.
      The Web app URL stays the same, so the website doesn't change.
- [ ] **C8. Check it.** Open the app's **Admin** page → **Test connection**. It should show
      **"Connected to the Google Sheet · … registered · 4 practical stations"**.

## D. Rehearsal (15 min)

Use **Live** mode (no `?demo=1`). If needed, open any page with `?demo=0` to switch back to Live.

- [ ] **D1.** Register **2 test people** on 2 phones, each with a photo. Check that **Registration** gets rows
      `VTE26-0001`, `VTE26-0002` with **Area** and **View ID** links, and that both photos are in the Drive folder.
- [ ] **D2.** With test person 2 (the "Theoretical in the morning" person, i.e. the **2nd** registration), take the
      **Theoretical exam** and submit. The phone shows **Your score: xx / 60**, and **Theoretical Evaluations Status**
      shows their letters, Total Score, % and **Done**.
- [ ] **D3.** Log in to **Practical** with the new PIN. Score test person 1 at **one station** → Review & Submit.
      Check **Practical Evaluation Status** and that the same station can't be scored again (🔒 Submitted).
- [ ] **D4.** Check the **Summary** tab and the **Dashboard**. Both test people should appear with the right statuses.
- [ ] **D5. Clean up:**
  - repeat **A2** and **B3** to delete the test photos and rows
  - delete the `EXAM_TEST_MODE` script property, or set it to `off`
  - on each test phone, open `register.html?reset` and `exam.html?reset` (PIN needed)

## E. Before / during each event day

- [ ] **E1. Check the dates.** `EXAM_DAYS` in `apps-script/Code.gs` and `EVENTS` in `js/config.js` must list the real
      event days. Confirmed: Mindanao (Davao WH) **27–28 Nov**, Visayas (Cebu WH) **30 Nov – 1 Dec**,
      Luzon (Bulacan WH) **2–3 Dec 2026**. If the exam days change: edit `EXAM_DAYS`, then repeat **C1** and **C7**.
- [ ] **E2. Confirm `EXAM_TEST_MODE` is removed.** Otherwise the exam would be open outside the event days.
- [ ] **E3. Print the QR codes.** Go to Admin → **Print QR codes**. Post the Registration QR at the entrance and the
      Theoretical Exam QR in the exam room.
- [ ] **E4. Don't delete or re-order rows in Registration during the event.** The AM/PM groups follow the row order.
- [ ] **E5.** Start the exam in **waves of 20–30 people**. Apps Script handles about 30 requests at the same moment
      (the app retries automatically, but waves keep it fast).
- [ ] **E6.** After each event day, download a copy for safekeeping: **File → Download → Microsoft Excel**.

---

### What the update in C turns on (for reference)
| Change | Before the update (live now) | After C1–C7 |
|---|---|---|
| Area column | not saved | saved in Registration + Summary |
| Names / remarks | "Dela Cruz" | **UPPER CASE** |
| Practical stations | 5 temporary, max 10 | **4 official, max 5, pass/fail rules** |
| Re-scoring a submitted station | allowed by the server | **blocked** (final) |
| Exam score on the phone | not shown | **xx / 60** |
| Morning rule for the exam | page only | **also enforced by the server** |
| Exam open | any day | **event days only** (unless `EXAM_TEST_MODE` = on) |
| Evaluator PIN | old PIN | **new PIN** (kept only in Script properties) |
