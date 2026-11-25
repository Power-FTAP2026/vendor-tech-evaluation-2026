# 2026 Vendor's Technicians Evaluation — Web App

| Page | Who | How they get there |
|---|---|---|
| `index.html`: **Dashboard** with KPI cards and a live participant list | Organizers | Main link |
| `register.html`: Registration (attendance + ID picture) | Participants | **QR code** |
| `exam.html`: Theoretical Exam (60 items) | Participants | **QR code** |
| `practical.html`: Practical Evaluation | Evaluators (pick **name** + PIN) | Link / QR |
| `admin.html`: QR codes, links to the Sheet and Drive, connection test | Organizer | Link |

## How it works

```
Phones / laptops ──► Website (GitHub Pages) ──► Apps Script web app ──► Google Sheet  "Vendors Technician Evaluation 2026"
                                                                   └──► Drive folder  "Vendors Technician Evaluation 2026" (ID pictures)
```

- The **website** only shows pages. All data goes to the **Apps Script** backend ([`apps-script/Code.gs`](apps-script/Code.gs)).
  Apps Script runs under your Google account and writes to your Sheet and Drive folder.
- The **questions, the 4 exam sets and the correct answers stay in the Google Sheet**. The website receives the
  questions without answers, and grading happens on the server. Scores are never shown to examinees.
- Until the backend is connected, the website runs in **demo mode**: data is saved only in the browser, so the app
  can be tried out locally.

### Google Sheet tabs
| Tab | What's in it |
|---|---|
| **Summary** | One row per participant, filled automatically by formulas: name, company, role, region, Unique ID, employment, AM/PM schedule, theoretical status / score / %, practical status / total / % |
| **Questions** | Your 172 questions (No., Category, Question, Options A–D, Correct Answer, Section, Difficulty) |
| **Registration** | Unique ID (`VTE26-0001`…), Company, Employment, Surname, First Name, M.I., Role, Region, ID Picture (link to the photo in Drive), Registered At |
| **Theoretical Evaluations Status** | One column per question with the letter each person chose (blank if the question wasn't in their set), then Total Score, Score %, Result, Set, Status, Started At, Submitted At |
| **Practical Evaluation Status** | One column per scenario with the score, then Total Score, Max Score, Score %, Status, Stations Done, Evaluators, Remarks, Last Updated |
| **Exam Sets** *(created by setup)* | Question numbers in Set A, B, C, D (50 each) and Static (10 Legal) |
| **Practical Setup** *(created by setup / `resetPracticalSetup`)* | Station, Scenario, **Max Score**, **Scoring** ("0 to 5" or "5 and 0 only" = pass/fail) and **Part** (4.1. Rectifier System / 4.2. Battery). Official setup: 4 stations: AC (4), ACU (3), DG (7), RS + Battery System (10), max 5 each, total 120. |

### Exam sets
- 4 sets of 50 built from the 147 Technical/Process questions. Every set has the **same mix**: Generator 9,
  Rectifier 8, Battery 10, AC Power 7, Earthing 5, Safety 6 and Site Facilities 5, with about 19 Easy / 19–20 Medium /
  11–12 Hard and 34 Technical / 16 Process.
- 10 static Legal questions, the same for everyone. They are whole cases, so a scenario's parts (e.g. 3.1–3.2) stay together.
- Each device gets one set at random, and the order of the 50 questions is shuffled.
- To change the sets, edit the **Exam Sets** tab (or run `rebuildExamSets`), then run `clearCache`.

### Morning / afternoon sessions
- The split follows registration order: the 1st, 3rd, 5th… person does **Practical in the morning** and the 2nd,
  4th… does **Theoretical in the morning**. With an odd attendance, the extra person goes to Practical. In the
  afternoon the groups swap.
- The switch time is `SESSION.pmStartsAt` in `js/config.js` (default 12:00). To preview, add `?session=AM` or
  `?session=PM` to any address.

---

## One-time setup

> **Going live?** Follow **[GO-LIVE-CHECKLIST.md](GO-LIVE-CHECKLIST.md)**: Drive, Sheet and Apps Script steps in order, plus a rehearsal.

### 1. Secure the Google Sheet ⚠
The Sheet holds the **correct answers** and personal data. In the Sheet, go to **Share → General access** and set it
to **Restricted**. Do the same for the Drive folder. The app keeps working because Apps Script runs under your
account.

### 2. Install the backend (Apps Script)
1. Open the Apps Script project **Vendors Technician Evaluation 2026**.
2. Open `Code.gs`, delete everything in it, paste the full contents of [`apps-script/Code.gs`](apps-script/Code.gs), and click **Save**.
3. In the toolbar, choose the function **`setup`** and click **Run**. Allow the permissions it asks for
   (Sheets and Drive). When it finishes, the log shows something like
   `Setup complete. Questions: 172. Sets: A=50 B=50 C=50 D=50. Static: 10. Stations: …`.
   Setup is safe to run again: it never deletes registrations, answers or scores.
4. Go to **Project Settings (⚙) → Script properties → Add**: `EVALUATOR_PIN` = your evaluator PIN.
5. Go to **Deploy → New deployment → ⚙ Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy** and copy the **Web app URL**.
6. Paste that URL into [`js/config.js`](js/config.js) as `SCRIPT_URL`.
7. Run **`resetPracticalSetup`** (writes the official stations and scoring), then **`setup`** again and **`clearCache`**.
   Events, evaluator names and their stations are set in `EVENTS` in `js/config.js`.

**After changing `Code.gs` later:** go to **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**.
The URL stays the same.
**After editing Questions, Exam Sets or Practical Setup:** run the **`clearCache`** function. The app caches these
for speed.

### 3. Publish the website on GitHub Pages
1. Create a repository and upload all the files. `js/demo-questions.js` is git-ignored on purpose (it holds the
   exam questions); do not upload it.
2. Go to **Settings → Pages → Deploy from a branch → `main` / root**.
3. Open `…/admin.html` → **Test connection** → **Print QR codes**.

### 4. Test before the event
Register 2–3 test people, take the exam with one of them, and score one station. Check the Sheet, then delete the
test rows from **Registration**, **Theoretical Evaluations Status** and **Practical Evaluation Status**, and delete
their photos from the Drive folder.

---

## Capacity (100 people at once)
Apps Script handles about **30 requests at the same moment**. The app is built to work within that limit:
- Every write waits its turn (a lock), so two people never write over each other.
- If Google is busy, the browser **automatically retries** with short waits, and the person sees
  "Submitting… please wait".
- Exam answers stay on the phone until **Submit**, so a person makes only about 4 requests during the whole exam.
- Questions, sets and the dashboard data are cached on the server.

Registration and exam submission still involve 100 people. If possible, start the exam in **waves** of 20–30
people a few minutes apart, so submissions don't all arrive in the same second.

## Security notes
- The Sheet and Drive folder are only accessible to you (once set to Restricted). The public website can only call
  the specific actions in `Code.gs`. It **cannot** read the answers, the Unique IDs, the photos or anyone's scores.
- The dashboard shows participant names, companies, roles, regions and statuses (no scores).
- The evaluator PIN is checked on the server. Change it in Script properties for each event.
