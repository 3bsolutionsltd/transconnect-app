# Troubleshooting Guide: Digital Marketing & Support Specialist

**Last Updated:** July 3, 2026  
**Version:** 1.0  
**Target Role:** Digital Marketing & Support Specialist ("The Amplifier")

## Overview

This guide helps you quickly diagnose and resolve common issues in your daily operations. Use the problem-solution matrix to find answers fast, and know when to escalate.

---

## Quick Reference: Issue Priority Matrix

| Priority | Response Time | Examples | Escalation |
|----------|--------------|----------|------------|
| 🔴 **CRITICAL** | Immediate | App down, payment system failure, PR crisis | Technical Lead (call + message) |
| 🟡 **HIGH** | <30 min | Multiple users same issue, CPI spike, negative viral | Technical Lead (WhatsApp) |
| 🟢 **MEDIUM** | <2 hours | Single-user technical issues, campaign underperforming | Self-resolve or daily update |
| ⚪ **LOW** | <24 hours | Feature requests, minor optimizations | Weekly report |

---

## 1. Customer Support Issues

### 1.1 App Installation Problems

#### Issue: "Can't find TransConnect on Play Store"

**Symptoms:**
- Customer searches but doesn't see app
- Says "No results found"

**Common Causes:**
1. Spelling error in search
2. Wrong app store (iOS vs Android)
3. Region restrictions
4. Outdated Play Store app

**Solutions:**

**Step 1:** Verify spelling
```
Ask customer to search: "TransConnect Uganda" 
(not "Trans Connect" or "Transport Connect")
```

**Step 2:** Confirm device
```
Question: "Are you using Android or iPhone?"
- If iPhone: "TransConnect is currently Android-only. 
  iOS version launching [Date]. Can you access via web at transconnect.app?"
```

**Step 3:** Provide direct link
```
Send: https://play.google.com/store/apps/details?id=com.transconnect.app
Ask them to tap link directly
```

**Step 4:** Check Play Store updates
```
If still not working:
1. Open Google Play Store app
2. Tap profile icon (top right)
3. Tap "Settings"
4. Tap "Play Store version" to update
5. Search again
```

**Escalate if:** Still can't find after all steps → Technical Lead (possible regional publishing issue)

---

#### Issue: "App won't install" / "Installation failed"

**Symptoms:**
- Download starts but fails
- Error messages: "Can't install", "Insufficient storage", "Package invalid"

**Common Causes:**
1. Low storage space
2. Unstable internet
3. Corrupted download
4. Device compatibility

**Solutions:**

**For "Insufficient storage":**
```
Guide customer:
1. Settings → Storage → Check available space
2. Need 50MB+ free
3. Clear cache: Settings → Apps → Play Store → Clear Cache
4. Delete unused apps or photos
5. Try install again
```

**For "Installation failed" / "Can't install":**
```
Steps:
1. Cancel current download
2. Play Store → Menu → My apps & games
3. Find TransConnect (if started) → Remove
4. Restart phone
5. Open Play Store with strong WiFi connection
6. Search and install again
```

**For "Package invalid":**
```
This is rare - possible app signing issue
→ ESCALATE to Technical Lead immediately
(Include screenshot of exact error)
```

**Escalate if:** 
- Error persists after troubleshooting
- Multiple users reporting same issue
- Error message unrecognized

---

#### Issue: "App crashes immediately after opening"

**Symptoms:**
- App opens then closes within seconds
- Black screen then return to home
- "TransConnect keeps stopping" message

**Common Causes:**
1. Outdated app version
2. Android OS too old
3. Corrupted installation
4. Server connectivity issue

**Solutions:**

**Step 1:** Check for updates
```
1. Play Store → Search "TransConnect"
2. If "Update" button visible → Tap it
3. Wait for update to complete
4. Try opening app
```

**Step 2:** Clear app data
```
1. Settings → Apps → TransConnect
2. Tap "Storage"
3. Tap "Clear Cache" (NOT Clear Data yet)
4. Try opening app
5. If still crashes: Tap "Clear Data" (warn: will need to log in again)
```

**Step 3:** Reinstall
```
1. Settings → Apps → TransConnect → Uninstall
2. Play Store → Reinstall TransConnect
3. Open and test
```

**Step 4:** Check Android version
```
Settings → About Phone → Android version
Minimum required: Android 6.0
If older: "Your phone's Android version is too old. 
TransConnect requires Android 6.0 or newer."
```

**Escalate if:** 
- Still crashing after reinstall
- Multiple users reporting (indicates server/app issue)
- Crashes happen on specific action (e.g., opening bookings)

---

### 1.2 Account & Login Issues

#### Issue: "Not receiving SMS verification code"

**Symptoms:**
- Customer enters phone number
- Waits but no SMS arrives
- Can't complete registration

**Common Causes:**
1. Wrong phone number entered
2. SMS delay (network congestion)
3. Phone number belongs to different network than selected
4. SMS blocked/filtered

**Solutions:**

**Step 1:** Verify number accuracy
```
"Let's confirm your number: +256 [X X X] [X X X] [X X X]
Is this correct? Double-check the area code and digits."
```

**Step 2:** Check SMS messages
```
"Please check:
- SMS inbox
- Spam/junk SMS folder
- Blocked messages
- Messages from unknown numbers

SMS sender will show: [TransConnect or shortcode]"
```

**Step 3:** Wait and retry
```
"SMS can take 1-5 minutes during peak times.
Wait 3 minutes, then:
1. Go back to verification screen
2. Tap 'Resend Code'
3. Check SMS again"
```

**Step 4:** Try alternative
```
If still no SMS:
"Let's try a different verification method:
→ [If available: Email verification]
→ [If available: WhatsApp verification]
→ Or I can manually verify your account - it takes 10 minutes"
```

**Escalate if:**
- Multiple resend attempts fail
- Customer confirms number is correct
- Need manual account creation

---

#### Issue: "Forgot password" / "Can't log in"

**Symptoms:**
- Customer has account but can't access
- Password not accepted
- Account locked

**Solutions:**

**Step 1:** Password reset
```
Guide through app:
1. Open TransConnect app
2. Tap "Forgot Password?"
3. Enter your phone number: [Verify it with customer]
4. Check SMS for reset code
5. Enter code and create new password

Password requirements:
- At least 8 characters
- Mix of letters and numbers (recommended)
```

**Step 2:** Account verification
```
If "Account not found":
"Let me verify your account exists.
What phone number did you register with?"

Check internal database (if accessible)
If no account: "I don't see an account with that number. 
Let's create a new one - takes 2 minutes."
```

**Step 3:** Too many failed attempts
```
If account locked:
"For security, accounts lock after 5 failed login attempts.
Wait 30 minutes, then try password reset.
Or I can unlock it now - I'll need to verify your identity."

Verification questions:
- Phone number
- Email address (if provided during signup)
- Recent booking details
```

**Escalate if:**
- Account locked and customer needs immediate access
- Password reset not working
- Suspect account security issue

---

### 1.3 Booking Problems

#### Issue: "Can't find buses for my route"

**Symptoms:**
- Customer searches route
- "No buses available" or empty results
- Sees other routes but not the one needed

**Common Causes:**
1. Route not yet available on TransConnect
2. Selected date too far in future (bookings open 14 days ahead)
3. All buses fully booked
4. Wrong date selected (past date, typo)

**Solutions:**

**Step 1:** Verify route availability
```
Check current TransConnect routes:
✅ Kampala → Jinja
✅ Kampala → Mbarara
✅ Kampala → Gulu
✅ Kampala → Fort Portal
[Add others as launched]

If customer's route NOT listed:
"That route isn't available on TransConnect yet, but we're 
adding new routes weekly. Try:
- [Suggest nearby alternative]
- Check back in [timeframe]
- I'll add your request to our waitlist!"

Log route request for Product team.
```

**Step 2:** Check booking window
```
"When are you planning to travel?"

If more than 14 days away:
"Bookings open 14 days in advance. Your travel date is 
[X] days away. Check back on [Date] to book!"
```

**Step 3:** Check date selection
```
"Let's verify the date you selected in the app:
1. Home screen → Travel date field
2. Is it showing [Customer's intended date]?
3. Make sure you didn't accidentally select tomorrow/yesterday"
```

**Step 4:** Verify full vs. no buses
```
If customer sees "Fully Booked" on all times:
"All buses on [Date] are full! Peak travel days book out fast.
Options:
- Travel day before/after?
- Different departure time?
- I can notify you if a seat opens (cancellation)?"

If shows "No buses available" (different from fully booked):
→ ESCALATE: Possible technical issue
```

**Escalate if:**
- Route should be available but isn't showing
- Multiple users reporting same route missing
- System shows "No buses" on date that should have buses

---

#### Issue: "Payment failed" / "Transaction not going through"

**Symptoms:**
- Customer selects seat and tries to pay
- Payment fails with error
- Money deducted but no ticket received

**Common Causes:**
1. Insufficient balance
2. Daily transaction limit exceeded
3. USSD prompt not approved in time
4. Network timeout
5. Payment gateway issue

**Solutions:**

**For MTN Mobile Money:**

```
Checklist:
1. Balance check: "Dial *165# → My Account → Balance"
   Needed: [Ticket price] + 500 UGX (fees)

2. Transaction limit: "Dial *165# → My Account → My Approvals"
   Default daily limit: 1,000,000 UGX
   If exceeded: "Wait until tomorrow or request limit increase"

3. USSD approval: 
   "After clicking 'Pay' in app, you'll see:
   USSD prompt: *165# → Approve payment
   YOU MUST approve within 2 minutes or it times out"

4. Retry process:
   "Let's try again step-by-step:
   - App: Select seat → Tap 'Proceed to Payment'
   - Choose 'MTN Mobile Money'
   - Enter number: [Verify it's correct]
   - Tap 'Pay Now'
   - WAIT for USSD prompt (*165#)
   - Enter PIN to approve
   - Wait for confirmation"
```

**For Airtel Money:**

```
Similar checklist:
1. Balance: Dial *185#
2. Transaction limit: Check with *185# → My Account
3. Approval process: Dial *185# when prompted after payment
4. Confirm phone number matches Airtel Money account
```

**For "Money deducted but no ticket":**

```
PRIORITY: Check payment status first

Ask customer:
1. "Did you receive SMS from MTN/Airtel confirming payment?"
2. "What amount was deducted?"
3. "Can you screenshot the payment confirmation?"

Then:
1. Check TransConnect app → "My Bookings"
   Ticket might already be there!

2. If not in bookings after 5 minutes:
   "Your payment is processing. Tickets arrive within 5 minutes.
   I'm monitoring your transaction [Reference: X]
   I'll WhatsApp you the moment it's confirmed."

3. After 5 minutes still nothing:
   → ESCALATE IMMEDIATELY to Technical Lead
   Include: Payment confirmation screenshot, amount, time, customer phone
```

**Escalate if:**
- Payment confirmed but no ticket after 5 minutes
- Customer charged twice
- Payment gateway error (not user balance/limit issue)
- Multiple users reporting payment failures

---

### 1.4 QR Code & Boarding Issues

#### Issue: "QR code not scanning at terminal"

**Symptoms:**
- Customer at terminal, shows QR code
- Bus attendant's scanner not reading it
- Boarding delayed

**Common Causes:**
1. Screen brightness too low
2. Cracked/dirty screen
3. Scanner device issue
4. Wrong QR code shown
5. Booking cancelled/expired

**Solutions:**

**Immediate fixes (customer at terminal now):**

```
1. Brighten screen:
   "Swipe down from top → Drag brightness slider to MAX"

2. Clean screen:
   "Wipe your screen with cloth to remove smudges"

3. Hold steady:
   "Hold phone still about 6 inches from scanner
   Don't move until attendant says OK"

4. Try screenshot:
   "Take screenshot of QR code, then open the screenshot
   Sometimes works better than live app"

5. Verify correct booking:
   "Check your ticket shows:
   - Route: [Correct route]
   - Date: [Today's date]
   - Time: [Current departure]
   - Status: 'Active' or 'Confirmed'"
```

**If still not scanning:**

```
ALTERNATIVE VERIFICATION methods:

1. Booking reference:
   "Tell the attendant your booking reference number:
   [Find in app → My Bookings → Booking Ref: XXXXXX]"

2. Manual verification:
   "Give attendant your phone number: [Customer's number]
   They can verify in their system"

3. Emergency escalation:
   "If attendant can't verify, put them on WhatsApp with me.
   I'll confirm your booking directly with them."

At same time → ESCALATE to Technical Lead:
"QR scanning failure at [Terminal], [Bus Company], [Time]
Customer: [Phone], Booking: [Ref]
Attendant cannot scan. Investigating if scanner or app issue."
```

**Escalate if:**
- Multiple users reporting QR issues same terminal/time
- Booking confirmed valid but absolutely won't scan
- Need to coordinate with bus crew immediately

---

## 2. Campaign Management Issues

### 2.1 Meta Ads Problems

#### Issue: "CPI suddenly increased significantly"

**Symptoms:**
- Yesterday: CPI $0.45
- Today: CPI $0.75+
- No campaign changes made

**Common Causes:**
1. Audience fatigue (same people seeing ads repeatedly)
2. Increased competition (competitors bidding same audience)
3. Budget too low (losing auctions)
4. Poor creative performance
5. Peak cost period (holidays, events)

**Solutions:**

**Step 1:** Check frequency metric
```
Ads Manager → Campaign → Delivery tab → Frequency

If frequency > 3.0:
ACTION: Audience is seeing ads too much (fatigue)
→ Expand audience size
→ Exclude people who already installed
→ Rotate to fresh creative
```

**Step 2:** Review competition
```
Check if competitors launched campaigns:
- Monitor competitor Facebook pages
- Ad Library: facebook.com/ads/library
- Search your target keywords

If new competitor ads detected:
ACTION: May need to increase bid or find new audience angles
```

**Step 3:** Analyze delivery insights
```
Ads Manager → Campaign → Delivery Insights

Check for:
- "Audience too small" → Expand targeting
- "Bid too low" → Increase bid 10-20%
- "Budget limited" → Increase daily budget
```

**Step 4:** A/B test creative
```
If above checks OK but CPI still high:
ACTION: Creative may be worn out
→ Launch test with new image/video
→ Try different value proposition
→ Change headline/call-to-action
```

**Escalate if:**
- CPI > $0.75 for 2+ consecutive days despite optimization
- Need budget increase beyond your approval limit
- Suspect Meta platform issue

---

#### Issue: "Campaign not delivering" / "Zero impressions"

**Symptoms:**
- Campaign status: "Active"
- But no spend, zero impressions
- Several hours elapsed

**Common Causes:**
1. Ad under review
2. Payment method failed
3. Audience too narrow
4. Bid too low
5. Campaign violated policy

**Solutions:**

**Step 1:** Check ad status
```
Ads Manager → Ads tab → Status column

"In Review": 
- Normal for new ads (can take 24 hours)
- Usually clears within 2-6 hours
- ACTION: Wait, monitor

"Rejected":
- Violated Meta ad policy
- Check rejection reason (click status)
- Common issues: Too much text in image, prohibited content, misleading claim
- ACTION: Edit ad to comply, resubmit

"Active" but not delivering:
- Go to Step 2
```

**Step 2:** Check payment method
```
Ads Manager → Billing

Look for:
- "Payment method failed"
- "Account spending limit reached"

ACTION:
- Update payment method
- Request increased spending limit
→ May need Technical Lead approval
```

**Step 3:** Check audience size
```
Campaign → Ad Set → Audience Definition

See "Potential Reach" estimate

If <10,000:
- "Audience Too Specific" warning will show
- ACTION: Broaden targeting (add interests, expand age range, add locations)

If 0:
- Impossible targeting combo (e.g., Age 18-24 AND Age 45-55)
- ACTION: Fix logical error in targeting
```

**Step 4:** Check budget and bid
```
Ad Set → Budget & Schedule

If daily budget < $5:
- Too low for Meta to optimize
- ACTION: Increase to minimum $10/day

If using lowest cost bid with CPI cap:
- Cap might be unrealistically low
- ACTION: Remove cap temporarily to test
```

**Escalate if:**
- Ad rejected for policy reason you disagree with
- Payment issue you can't resolve
- Campaign still not delivering after 24 hours (all checks OK)

---

### 2.2 Google Ads Problems

#### Issue: "Universal App Campaign not delivering"

**Symptoms:**
- UAC campaign active but no installs
- Low impression volume
- Status warnings in Google Ads

**Common Causes:**
1. Learning phase (first 7 days)
2. Budget too low
3. Poor ad assets
4. Billing issue

**Solutions:**

**Step 1:** Check campaign age
```
If campaign < 7 days old:
"Google UAC needs 7-10 days learning phase.
During this time performance is unstable.
ACTION: Wait, don't make changes yet"

If > 10 days and still poor:
Go to Step 2
```

**Step 2:** Review budget
```
Google Ads → Campaigns → Budget

Minimum for UAC: $50/day recommended

If < $50/day:
"Budget too low for Google to optimize effectively"
ACTION: Increase to $50+ if possible
(Need Technical Lead approval if beyond limit)
```

**Step 3:** Check asset quality
```
Assets → See "Ad Strength"

If "Poor" or "Average":
ACTION: Add more assets
- Need: 4+ headlines, 4+ descriptions, 4+ images, 1+ videos
- Replace low-performing assets
- Use diverse messaging
```

**Step 4:** Check targeting
```
Settings → Locations, Languages

Make sure:
- Location: Uganda (not "All countries")
- Language: English (or appropriate)
- OS: Android

Common mistake: Leaving iOS checked (we don't have iOS app yet)
```

**Escalate if:**
- After learning phase and optimizations, still zero installs
- Need budget increase beyond approval limit
- Suspect Google Ads technical issue

---

### 2.3 Analytics & Tracking Issues

#### Issue: "Install numbers don't match between platforms"

**Symptoms:**
- Meta Ads Manager: 50 installs
- Google Analytics: 35 installs
- Play Store Console: 60 installs
- Numbers don't add up

**Understanding the discrepancy:**

```
This is NORMAL. Each platform measures differently:

Meta Ads Manager:
- Counts "attributed installs" (user saw ad, then installed)
- Uses 28-day click window, 1-day view window
- May include incomplete installs

Google Analytics:
- Counts users who opened app AND sent data
- Requires: Install + Open + Internet connection
- Delayed if user installs but doesn't open immediately

Play Store Console:
- Counts all installs from any source
- Includes: Paid ads, organic search, referrals, reinstalls
- Most accurate for TOTAL installs
```

**Which to use when:**

```
For campaign performance (CPI):
→ Use Meta Ads Manager or Google Ads numbers
(They track who installed from your ads specifically)

For total app growth:
→ Use Play Store Console
(Shows all installs regardless of source)

For user behavior analysis:
→ Use Google Analytics
(Shows active users, conversion rates, retention)
```

**When to escalate:**

```
ESCALATE if:
- Meta reports 50 installs but Play Store shows 5 (Huge discrepancy = tracking broken)
- Google Analytics shows ZERO installs despite ads running (Tracking not set up)
- Numbers suddenly dropped to zero across all platforms (Technical issue)
```

**Solutions for tracking issues:**

```
1. Verify tracking setup:
   - Google Analytics SDK in app?
   - Meta SDK installed?
   - Firebase Analytics connected?

2. Check date ranges match:
   - Compare same time periods across platforms
   - Account for timezone differences

3. Test attribution:
   - Click your own ad
   - Install app on test device
   - Check if install attributes to campaign
   → If not, tracking misconfigured → ESCALATE
```

---

## 3. Tools & Systems Issues

### 3.1 WhatsApp Business Problems

#### Issue: "WhatsApp not sending/receiving messages"

**Quick diagnostic:**

```
Test:
1. Can you receive messages from regular WhatsApp contacts? YES/NO
2. Can you send to regular contacts? YES/NO
3. Is WhatsApp Business number verified? YES/NO
4. Are you connected to Internet? YES/NO

If ALL NO:
→ Internet/phone issue, not WhatsApp Business specific

If only Business account affected:
→ See solutions below
```

**Solutions:**

```
1. Check phone number status:
   Settings → Business settings → Phone number
   Status should be: "Verified"
   
   If "Unverified" or "Banned":
   → ESCALATE IMMEDIATELY to Technical Lead
   (Business account suspended)

2. Check message limits:
   WhatsApp Business has sending limits:
   - New accounts: Limited messages to new contacts
   - After 30 days: Limits lift
   
   If hitting limits:
   "You're messaging more people than WhatsApp allows for new accounts.
   Wait 24 hours for limit reset."

3. Check storage/cache:
   Settings → Storage and data → Manage storage
   If full: Delete old chats/media
   
   Then: Settings → Apps → WhatsApp Business → Clear Cache

4. Update app:
   Play Store → WhatsApp Business → Update
   
5. Restart app:
   Force stop → Reopen
```

**Escalate if:**
- Account banned or restricted
- Messages not delivering after all troubleshooting
- Affects ability to provide customer support

---

### 3.2 Dashboard & Analytics Access

#### Issue: "Can't log into [Platform]"

**Meta Ads Manager, Google Ads, Google Analytics, etc.**

**Solutions:**

```
1. Verify credentials:
   - Correct email address?
   - Correct password?
   - Try password reset

2. Check account permissions:
   "You may not have been granted access yet"
   → Contact Technical Lead: "I need access to [Platform] for [Reason]"

3. Two-factor authentication issues:
   - Check phone for verification code
   - Use backup codes if available
   - Reset 2FA with recovery email

4. Browser issues:
   - Clear browser cache/cookies
   - Try incognito/private mode
   - Try different browser (Chrome vs Firefox vs Edge)
   - Disable ad blockers temporarily

5. Account suspended/disabled:
   If see message: "Account suspended" or "Access denied"
   → ESCALATE IMMEDIATELY
   (Possible policy violation or billing issue)
```

---

## 4. When to Escalate

### Escalation Decision Tree

```
Is someone's safety at risk? 
YES → CALL Technical Lead immediately

Is customer losing money/business?
YES → ESCALATE within 15 minutes

Are multiple customers affected?
YES → ESCALATE within 30 minutes

Is it blocking your core work?
YES → ESCALATE within 1 hour

Can you work around it for now?
YES → Mention in daily update or weekly report

Is it a "nice to have" improvement?
YES → Log in ideas doc, mention in weekly 1:1
```

### How to Escalate Effectively

**Bad escalation (don't do this):**
```
"The campaigns aren't working. Help!"
```

**Good escalation (do this):**
```
🚨 ESCALATION: CPI Spike

SUMMARY: CPI increased from $0.42 to $0.89 (112% increase) since yesterday

IMPACT: 
- Burning budget at 2x expected rate
- Will hit daily limit by noon
- Risk going over weekly budget

ATTEMPTED SOLUTIONS:
1. Checked frequency (2.1 - OK)
2. Reviewed audience size (85K - OK)
3. Paused poorest performing ad set
4. Launched new creative test 30 min ago

NEEDED:
- Approval to increase daily budget to $80 (from $50)
- OR: Guidance on what else to optimize
- OR: Pause campaigns until resolved

URGENCY: High - budget implications

Screenshots attached
```

---

## 5. Emergency Contact Info

### Technical Lead / Founder
- **WhatsApp:** [Primary Number] ⚡️ FASTEST
- **Phone:** [Backup Number] (Emergencies only)
- **Email:** [Email] (Non-urgent)
- **Availability:** 7 AM - 10 PM daily

### Escalation Guidelines

| Priority | Method | Response SLA |
|----------|--------|--------------|
| 🔴 Critical | Call + WhatsApp | 5 minutes |
| 🟡 Urgent | WhatsApp | 30 minutes |
| 🟢 Normal | WhatsApp or daily update | 2 hours |
| ⚪ Low | Email or weekly report | 24-48 hours |

---

## 6. Common Error Messages Dictionary

| Error Message | What It Means | What To Do |
|---------------|---------------|------------|
| "Network error" | App can't reach server | Check Internet, retry, wait 5 min |
| "Payment pending" | Waiting for mobile money confirmation | Wait 5 min, check SMS |
| "Seat unavailable" | Someone else booked seat | Choose different seat |
| "Booking expired" | Took too long to complete | Start new booking |
| "Invalid credentials" | Wrong login info | Reset password |
| "Server timeout" | Server overloaded or down | Wait 10 min, ESCALATE if persists |
| "Your account is restricted" | Account flagged/banned | ESCALATE immediately |

---

## Resources

- **Daily Workflow:** [amplifier-daily-workflow.md](amplifier-daily-workflow.md)
- **WhatsApp Templates:** [amplifier-whatsapp-templates.md](amplifier-whatsapp-templates.md)
- **FAQ Document:** [amplifier-support-faq.md](amplifier-support-faq.md)
- **Onboarding Guide:** [amplifier-onboarding-guide.md](amplifier-onboarding-guide.md)

---

*Part of TransConnect MVP1 Training System*  
*Update this guide as new issues arise and solutions are discovered*
