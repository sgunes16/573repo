# The Hive - Demo Use Case Scenarios

This document presents four real-world scenarios demonstrating how The Hive platform works. Each scenario walks through the complete user journey and explains what happens in the system at every step.

---

## Scenario 1: One-to-One Offer Exchange

### "Harun's Birthday Gift Journey"

**Characters:**
- **Harun** - A software developer who wants to make a special handmade gift for his mother's birthday
- **Hülya** - An experienced ceramic artist who offers pottery lessons

**The Story:**

Harun's mother's birthday is approaching, and he wants to give her something truly special this year—not something bought from a store, but a handmade gift with personal meaning. He decides that a handmade ceramic vase would be perfect, but there's one problem: Harun has never worked with clay in his life.

While searching online for pottery classes, Harun discovers The Hive—a community platform where people exchange skills using time as currency. Intrigued by the concept, he decides to sign up.

---

### System Flow - Step by Step

**Step 1: Harun Creates an Account**

Harun visits The Hive website and clicks "Join The Hive." He fills out the registration form with his email (harun.yildiz@email.com), creates a password, and enters his name. After clicking "Sign Up," the system:

1. Creates a new `User` record in the database with `is_verified=False`
2. Creates an associated `UserProfile` record
3. Creates a `TimeBank` record with initial balance of 3 credits
4. Generates an `EmailVerificationToken` and sends a verification email
5. Returns authentication tokens (access_token, refresh_token)

Harun checks his email and clicks the verification link. The system marks his account as `is_verified=True`.

**Step 2: Harun Completes Onboarding**

After his first login, Harun is directed to the onboarding flow. He uploads a profile photo, enters his location as "Kadıköy, Istanbul," writes a brief bio about being a software developer interested in learning crafts, and adds "Programming" and "Guitar" as his skills. The system updates his `UserProfile` record and sets `is_onboarded=True`.

**Step 3: Harun Searches for Ceramic Art Lessons**

Harun navigates to the Dashboard. The page loads with a map showing his location and nearby offers. He types "ceramic" in the search bar. The system queries the `Offer` model, filtering by:
- `type='offer'`
- `status='ACTIVE'`
- Title or tags containing "ceramic"
- Location within his selected radius (default 10km)

Several results appear. One catches his eye: "Ceramic Art Workshop - Learn Pottery Basics" by Hülya.

**Step 4: Harun Views Hülya's Offer**

Harun clicks on the offer card. The offer detail page loads, showing:

| Field | Value |
|-------|-------|
| Title | Ceramic Art Workshop - Learn Pottery Basics |
| Provider | Hülya Demir (⭐ 4.8 rating) |
| Duration | 2 hours |
| Type | 1-to-1 |
| Location | Moda, Kadıköy |
| Description | "Learn the fundamentals of pottery in a relaxed, friendly environment. We'll cover clay preparation, basic shaping techniques, and glazing. Perfect for beginners!" |
| Tags | ceramic, pottery, art, handmade, crafts |

Harun checks his TimeBank balance: 3 credits available. The workshop requires 2 credits—he has enough!

**Step 5: Harun Starts the Handshake**

Harun clicks "Start Handshake." Behind the scenes, the system:

1. Creates a new `Exchange` record:
   - `offer_id` = Hülya's offer ID
   - `provider_id` = Hülya's user ID
   - `requester_id` = Harun's user ID
   - `status` = 'PENDING'
   - `time_spent` = 2 (from offer's time_required)

2. Blocks Harun's time credits:
   - His `TimeBank.available_amount` decreases from 3 to 1
   - His `TimeBank.blocked_amount` increases from 0 to 2

3. Creates a `Notification` for Hülya: "Harun Yıldız wants to join your Ceramic Art Workshop"

4. Sends a WebSocket message to Hülya if she's online

5. Redirects Harun to the Handshake page

**Step 6: Harun Proposes a Date**

On the Handshake page, Harun sees the progress steps: [Requested ✓] → [Date Set] → [Accepted] → [Done]

Since this is a 1-to-1 offer, Harun needs to propose when he'd like to meet. He clicks "Propose Date" and selects Saturday at 2:00 PM. The system:

1. Updates the `Exchange` record: `proposed_at` = '2024-12-21 14:00:00+03:00'
2. Creates a `Notification` for Hülya: "Harun proposed Saturday, Dec 21 at 2:00 PM for your Ceramic Art Workshop"
3. Sends a WebSocket update to refresh Hülya's page

The progress updates: [Requested ✓] → [Date Set ✓] → [Accepted] → [Done]

**Step 7: Harun and Hülya Chat**

While waiting for Hülya's response, Harun uses the chat feature to introduce himself. He types: "Hi Hülya! I'm excited to learn pottery. I want to make a vase for my mother's birthday. Is that achievable in one session?"

The system creates a `Chat` record linked to the exchange and a `Message` record with Harun's content. The message is broadcast via WebSocket to Hülya's browser.

Hülya responds: "Hi Harun! That's a lovely idea. A simple vase is definitely doable for a beginner. We'll make it happen! 🎨"

**Step 8: Hülya Accepts the Exchange**

Hülya receives the notification and reviews the request. She's happy with the proposed time and clicks "Accept." The system:

1. Updates `Exchange.status` from 'PENDING' to 'ACCEPTED'
2. Creates a `Notification` for Harun: "Hülya accepted your request for Ceramic Art Workshop!"
3. Sends WebSocket updates to both users

The progress updates: [Requested ✓] → [Date Set ✓] → [Accepted ✓] → [Done]

**Step 9: The Workshop Happens (Real World)**

On Saturday, Harun meets Hülya at her studio in Moda. Over the next two hours, Hülya teaches him how to center clay on the wheel, shape a basic vase form, and apply a simple glaze. Harun successfully creates a beautiful small vase for his mother.

**Step 10: Both Parties Confirm Completion**

After the workshop, Harun opens The Hive and clicks "Mark Complete" on the Handshake page. The system:

1. Updates `Exchange.requester_confirmed` = True
2. Creates a `Notification` for Hülya: "Harun confirmed completion. Please confirm to finalize."
3. The status remains 'ACCEPTED' until both confirm

Hülya also clicks "Mark Complete." Now the system:

1. Updates `Exchange.provider_confirmed` = True
2. Since both confirmed, updates `Exchange.status` = 'COMPLETED'
3. Updates `Exchange.completed_at` = current timestamp

4. **Processes the time credit transfer:**
   - Harun's `TimeBank.blocked_amount` decreases from 2 to 0
   - Harun's `TimeBank.amount` decreases from 3 to 1
   - Hülya's `TimeBank.amount` increases from X to X+2
   - Hülya's `TimeBank.available_amount` increases by 2

5. Creates `TimeBankTransaction` records:
   - From: Harun, To: Hülya, Amount: 2, Type: 'SPEND' (Harun's perspective)
   - From: Harun, To: Hülya, Amount: 2, Type: 'EARN' (Hülya's perspective)

6. Opens the Rating modal for both users

**Step 11: Rating Each Other**

Harun rates Hülya:
- Communication: 5/5
- Punctuality: 5/5
- Would Recommend: Yes
- Comment: "Hülya was an amazing teacher! Patient, knowledgeable, and made the whole experience fun. My mom is going to love the vase!"

The system creates an `ExchangeRating` record and recalculates Hülya's average rating in her `UserProfile`.

Hülya rates Harun:
- Communication: 5/5
- Punctuality: 5/5
- Would Recommend: Yes
- Comment: "Harun was a great student—enthusiastic and followed instructions well. The vase turned out beautiful!"

**Final State:**

| User | Time Credits Before | Time Credits After |
|------|--------------------|--------------------|
| Harun | 3 | 1 |
| Hülya | (her balance) | +2 |

Harun's mother receives a beautiful handmade ceramic vase for her birthday, and both Harun and Hülya have positive ratings on their profiles.

---
## Scenario 2: Group Offer Exchange

### "Deniz's Photography Walk"

**Characters:**
- **Deniz** - A professional photographer offering a group workshop
- **Ayşe** - An amateur photographer wanting to improve her skills
- **Mert** - A tourist who wants to capture Istanbul's beauty
- **Ceren** - A social media manager looking to create better content

**The Story:**

Deniz is a professional photographer who loves sharing his knowledge. Instead of teaching one person at a time, he decides to organize a group photography walk through the historic streets of Balat. He can teach up to 5 people at once, making it efficient for everyone—participants pay fewer credits (since the time is shared), and Deniz earns more in total.

---

### System Flow - Step by Step

**Step 1: Deniz Creates a Group Offer**

Deniz creates a new offer with these details:

| Field | Value |
|-------|-------|
| Title | Photography Walk in Balat - Capture Istanbul's Colors |
| Description | "Join me for a 3-hour photography walk through colorful Balat streets. I'll teach composition, lighting, and street photography techniques. All skill levels welcome! Bring your camera or smartphone." |
| Duration | 3 hours |
| Type | **Group** |
| Group Size | **5 people** |
| Location | Balat, Istanbul |
| Date | Sunday, Dec 22 at 10:00 AM |
| Tags | photography, workshop, balat, istanbul, street |

The system creates the `Offer` record:
- `activity_type` = 'group'
- `person_count` = 5
- `provider_paid` = False (Deniz hasn't received payment yet)

**Step 2: Participants Join**

**Ayşe Joins (Participant 1):**
Ayşe sees the offer and clicks "Start Handshake." The system:
1. Creates `Exchange #1`:
   - provider = Deniz
   - requester = Ayşe
   - status = 'PENDING'
2. Blocks 3 credits from Ayşe's TimeBank
3. Notifies Deniz: "Ayşe wants to join your Photography Walk (1/5 slots)"

Deniz reviews and clicks "Accept." Exchange #1 status → 'ACCEPTED'

**Mert Joins (Participant 2):**
Same process. Exchange #2 created. Deniz accepts.

**Ceren Joins (Participant 3):**
Same process. Exchange #3 created. Deniz accepts.

**Current State:**
```
Photography Walk Group Offer
├── Total Slots: 5
├── Filled Slots: 3
├── Available Slots: 2
│
├── Exchange #1: Ayşe (ACCEPTED)
├── Exchange #2: Mert (ACCEPTED)
└── Exchange #3: Ceren (ACCEPTED)
```

**Step 3: The Workshop Happens**

On Sunday, Deniz meets Ayşe, Mert, and Ceren at the Balat waterfront. Over three hours, they walk through colorful streets, Deniz teaches techniques, and everyone captures amazing photos.

**Step 4: Completion Process for Group Offers**

Group offers have a special completion flow—each participant confirms individually:

**Ayşe marks complete:**
1. `Exchange #1.requester_confirmed` = True
2. She's prompted to rate Deniz
3. The system waits for Deniz to confirm her specifically

**Deniz confirms Ayşe:**
1. `Exchange #1.provider_confirmed` = True
2. Both confirmed → `Exchange #1.status` = 'COMPLETED'
3. 3 credits transfer from Ayşe to Deniz
4. `TimeBankTransaction` created

**Mert marks complete and Deniz confirms:**
Same process. Exchange #2 completed. +3 credits to Deniz.

**Ceren marks complete and Deniz confirms:**
Same process. Exchange #3 completed. +3 credits to Deniz.

**Step 5: Provider Payment Tracking**

The system tracks `Offer.provider_paid`:
- After first completion: Deniz earned 3 credits, `provider_paid` = True
- Subsequent completions continue adding credits

**Final State:**

| Participant | Role | Credits Change |
|-------------|------|----------------|
| Deniz | Provider | +9 (3 × 3 participants) |
| Ayşe | Requester | -3 |
| Mert | Requester | -3 |
| Ceren | Requester | -3 |

**Note:** Two slots remained unfilled. If more people had joined before the event, they could have participated too. The offer remains 'ACTIVE' if Deniz plans to run the workshop again.

---

## Scenario 4: Report and Admin Resolution

### "The Problematic Guitar Lesson"

**Characters:**
- **Zeynep** - A college student wanting to learn guitar
- **Kaan** - A user who claims to be a guitar teacher
- **Admin Selin** - A Hive administrator

**The Story:**

Zeynep has always wanted to learn guitar. She finds an offer on The Hive from someone named Kaan: "Guitar Lessons for Beginners - Rock, Pop, Classical." The offer looks professional with nice photos and a detailed description. Zeynep decides to give it a try.

Unfortunately, the experience doesn't go as expected...

---

### System Flow - Step by Step

**Step 1: The Exchange Begins**

Zeynep starts a handshake with Kaan's guitar lesson offer:
1. `Exchange` created, status = 'PENDING'
2. Zeynep's 2 credits blocked
3. She proposes Thursday at 6 PM
4. Kaan accepts

**Step 2: Problems During the Exchange**

Zeynep arrives at the agreed location, but:
- Kaan is 30 minutes late
- He doesn't have a teaching plan
- He spends most of the time on his phone
- He claims he needs to leave after only 45 minutes (not the agreed 2 hours)
- The "lesson" was essentially Kaan playing songs while Zeynep watched

Zeynep is frustrated. She tries to discuss this with Kaan via chat:

"Hi Kaan, I'm disappointed with today's lesson. You were late, distracted, and left early. This wasn't what your offer described."

Kaan responds dismissively: "Whatever, you got a free lesson. Just confirm completion."

**Step 3: Zeynep Reports the Exchange**

Zeynep decides not to confirm completion and instead reports the exchange. On the Handshake page, she clicks "Report Exchange."

A modal appears asking:
- **Target Type:** Exchange (auto-filled)
- **Reason:** She selects "FRAUD" from the dropdown
- **Description:** "The provider was 30 minutes late, spent most of the time on his phone, and left after only 45 minutes instead of the agreed 2 hours. He made no effort to actually teach guitar. This feels like a scam to get time credits without providing real value."

She clicks "Submit Report."

**System Actions:**

1. Creates a `Report` record:
   ```
   Report {
     reporter_id: Zeynep's ID
     reported_user_id: Kaan's ID
     target_type: 'exchange'
     target_id: Exchange ID
     reason: 'FRAUD'
     description: "The provider was 30 minutes late..."
     status: 'PENDING'
     created_at: timestamp
   }
   ```

2. Creates a `Notification` for admins: "New report submitted: FRAUD on Exchange #XXX"

3. The exchange remains in 'ACCEPTED' status (not completed)

**Step 4: Admin Reviews the Report**

Admin Selin logs into The Hive and accesses the Admin Panel. She sees:

```
KPI Dashboard:
├── Total Users: 1,247
├── Active Offers: 342
├── Active Wants: 89
├── Total Time Credits: 5,621H
└── Pending Reports: 3  ← New report here
```

Selin clicks on the Reports section and sees Zeynep's report. She clicks "View" on the Exchange to see details:

**Exchange Detail Modal:**
```
Exchange #1847
├── Status: ACCEPTED
├── Offer: "Guitar Lessons for Beginners"
├── Provider: Kaan Arslan (kaan.arslan@email.com)
├── Requester: Zeynep Kaya (zeynep.kaya@email.com)
├── Proposed Time: Dec 19, 2024, 6:00 PM
├── Time Required: 2 hours
│
└── Chat Messages (4):
    [Zeynep]: "Looking forward to the lesson!"
    [Kaan]: "See you there"
    [Zeynep]: "Hi Kaan, I'm disappointed with today's lesson..."
    [Kaan]: "Whatever, you got a free lesson. Just confirm completion."
```

Selin also checks Kaan's profile and sees:
- 2 previous exchanges with mixed ratings
- One other user left a similar complaint in a review
- Account created 2 weeks ago

**Step 5: Admin Resolves the Report**

Selin clicks "Resolve" on the report. The resolution modal appears:

**Resolution Options:**

☑️ **Remove Content**
   - Delete the reported content and cancel related exchanges

**User Action:**
- ○ No action
- ○ Warn User
- ● **Suspend User** ← Selected

**Admin Notes:**
"Investigation confirmed fraudulent behavior. Provider did not deliver promised service, showed pattern of similar complaints. Account suspended. Exchange cancelled and credits returned to requester."

Selin clicks "Resolve Report."

**System Actions:**

1. **Report Updated:**
   ```
   Report {
     status: 'RESOLVED'
     admin_notes: "Investigation confirmed..."
     resolved_by_id: Selin's admin ID
     updated_at: timestamp
   }
   ```

2. **User Banned:**
   ```
   User (Kaan) {
     is_banned: True
     is_active: False
   }
   ```

3. **Exchange Cancelled:**
   ```
   Exchange {
     status: 'CANCELLED'
   }
   ```

4. **Credits Returned to Zeynep:**
   ```
   Zeynep's TimeBank {
     blocked_amount: -2 (returns to 0)
     available_amount: +2 (restored)
   }
   ```

5. **All Kaan's Active Exchanges Cancelled:**
   - Any pending or accepted exchanges with other users are cancelled
   - All blocked credits returned to respective requesters

6. **Notifications Created:**
   - To Zeynep: "Your report on Exchange #1847 has been resolved. The exchange has been cancelled and your time credits have been returned. Thank you for helping keep our community safe."
   - To Kaan: "Your account has been suspended due to violation of community guidelines. If you believe this is an error, please contact support."

7. **Kaan's Offer Flagged:**
   ```
   Offer {
     is_flagged: True
     flagged_reason: "Provider account suspended for fraud"
     status: 'INACTIVE'
   }
   ```

**Step 6: Aftermath**

**For Zeynep:**
- She receives a notification that her report was resolved
- Her 2 time credits are back in her available balance
- She can continue using The Hive safely
- She leaves a forum post thanking the admins for quick action

**For Kaan:**
- His account is suspended
- He cannot log in or access The Hive
- All his offers are hidden from search
- His profile shows "Account Suspended" if visited directly

**For the Community:**
- The fraudulent user is removed
- Other potential victims are protected
- Trust in the platform is maintained

**Final State:**

| Entity | Before Report | After Resolution |
|--------|--------------|------------------|
| Zeynep's Credits | 2 blocked | 2 available (returned) |
| Exchange Status | ACCEPTED | CANCELLED |
| Report Status | PENDING | RESOLVED |
| Kaan's Account | Active | Suspended (is_banned=True) |
| Kaan's Offers | Active | Flagged & Inactive |

---


*These scenarios demonstrate the complete lifecycle of different exchange types in The Hive, from creation to completion (or resolution), showing how the system supports community-based skill sharing while maintaining safety through moderation.*
