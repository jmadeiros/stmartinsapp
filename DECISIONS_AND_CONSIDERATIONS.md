# The Village Hub - Key Decisions & Considerations
## Critical Questions and Edge Cases to Address v1.0

---

## 🎯 Purpose of This Document

This document outlines **critical questions**, **edge cases**, and **important decisions** that should be validated with stakeholders before starting development. These items could significantly impact the implementation approach.

---

## 1. Authentication & User Management

### 1.1 Initial Admin Account Creation

**Question:** How will the first admin account be created?

**Options:**
- **A) Manual SQL Insert:** Directly insert first admin into Supabase database
- **B) Special Registration Link:** Secret URL with admin registration (expires after first use)
- **C) Supabase Dashboard:** Create user via Supabase Auth UI, then update role manually

**Recommendation:** Option A (manual SQL insert) - most secure

**Decision Needed:** ⬜ Confirm approach

---

### 1.2 User Email Domain Restrictions

**Question:** Should registration be restricted to specific email domains?

**Scenarios:**
- Should only `@charityname.org` emails be allowed?
- Or allow any email (Gmail, personal) with manual approval?
- What about volunteers with personal emails?

**Options:**
- **A) Open Registration:** Anyone can sign up, admin approves
- **B) Domain Whitelist:** Only specific domains allowed (e.g., known charity domains)
- **C) Invite-Only:** Admin must send invite link to each user

**Recommendation:** Option A with admin approval for Phase 1 (most flexible)

**Decision Needed:** ⬜ Confirm registration policy

---

### 1.3 Multi-Organization Users

**Question:** Can a user belong to multiple organizations?

**Scenario:** A consultant works with 3 different charities in the building. Should they have one account with multi-org access or 3 separate accounts?

**Current Design:** One user = one organization (or no organization)

**Impact if Changed:**
- Database schema change (many-to-many relationship)
- UI for switching organizations
- Permissions become more complex

**Decision Needed:** ⬜ Confirm single-org design is acceptable

---

### 1.4 User Deactivation vs Deletion

**Question:** When a user leaves, should their account be:
- **Deactivated** (can't log in, content remains attributed to them)
- **Deleted** (account removed, content either deleted or anonymized)

**Content Handling Options:**
1. Keep all content, attribute to "Former User"
2. Delete all content when user deleted (may break conversations)
3. Transfer content ownership to an admin
4. Keep content, show user as "Deleted User" but retain history

**Recommendation:** Deactivate user + show as "Former Member" + keep content

**Decision Needed:** ⬜ Confirm user deletion policy

---

## 2. Content Moderation & Policies

### 2.1 Inappropriate Content Response Time

**Question:** What's the expected response time for moderation?

**Options:**
- Real-time monitoring (requires active moderators during business hours)
- Daily review (check flagged content once per day)
- Ad-hoc (respond when reported)

**Current Design:** Ad-hoc with email notifications to St Martins staff

**Decision Needed:** ⬜ Confirm moderation SLA

---

### 2.2 Content Retention Policy

**Question:** How long should old content be retained?

**Scenarios:**
- Posts from 2 years ago - still relevant?
- Chat messages - keep forever or auto-delete after X months?
- Expired job postings - archive or delete?

**Options:**
| Content Type | Retention Policy |
|--------------|------------------|
| Posts | Keep indefinitely, allow manual archive |
| Events (past) | Keep for 1 year, then auto-archive |
| Chat messages | Keep for 2 years, then archive |
| Job postings | Auto-archive 30 days after closing date |
| Meeting notes | Keep indefinitely (historical record) |

**Decision Needed:** ⬜ Confirm retention policies per content type

---

### 2.3 Edit History Tracking

**Question:** Should we track edit history for posts/events?

**Scenarios:**
- User edits post to remove controversial statement
- Admin edits someone's post - should original be visible?
- Event details change significantly - should users see what changed?

**Options:**
- **No history:** Simple, current design
- **Full history:** Every edit saved, viewable by admins
- **Last edited timestamp:** Show when edited, but not what changed

**Recommendation:** Last edited timestamp only (Phase 1), full history (Phase 2)

**Decision Needed:** ⬜ Confirm edit tracking approach

---

## 3. Events & Calendar

### 3.1 Event Cancellation

**Question:** How should event cancellations be handled?

**Options:**
- **A) Delete event:** Removes from calendar (but breaks links)
- **B) Mark as cancelled:** Event stays visible but clearly marked "CANCELLED"
- **C) Archive:** Move to "Past Events" with cancelled status

**Recommendation:** Option B - mark as cancelled, keep visible

**Additional Feature:** Send notification to all who viewed/bookmarked event?

**Decision Needed:** ⬜ Confirm cancellation workflow

---

### 3.2 Recurring Event Exceptions

**Question:** For recurring events, what if one instance needs to change?

**Scenarios:**
- Monday Partner Meeting is weekly, but one week it moves to Tuesday
- Or one instance needs to be cancelled

**Options:**
- **Edit entire series:** All future instances change
- **Edit single instance:** Creates exception to recurrence rule
- **Delete single instance:** Skip this occurrence

**Current Design:** Supports exceptions (per DATABASE_SCHEMA.md)

**Decision Needed:** ⬜ Confirm this is needed for Phase 1 or defer to Phase 2

---

### 3.3 Event Privacy

**Question:** Should some events be private to specific organizations?

**Scenario:** Charity Alpha has an internal team meeting. Should it appear on the building-wide calendar?

**Current Design:** All events are public

**Options:**
- **A) All public:** Transparency, everyone sees everything
- **B) Org-only events:** Events can be marked as private to organization
- **C) Invite-only events:** Events visible only to invited users

**Recommendation:** Start with all public (Phase 1), add privacy in Phase 2 if needed

**Decision Needed:** ⬜ Confirm all-public approach is acceptable

---

## 4. Chat & Messaging

### 4.1 Chat Message Deletion

**Question:** Can users delete chat messages? What's the time window?

**Options:**
- **No deletion:** Messages are permanent (like Slack free tier)
- **5-minute window:** Can delete immediately after sending
- **Author can always delete:** Full control
- **Only admins can delete:** Prevent abuse

**Recommendation:** 5-minute edit/delete window + admin can always delete

**Decision Needed:** ⬜ Confirm chat deletion policy

---

### 4.2 Direct Messages (DMs)

**Question:** Should users be able to send private DMs to each other?

**Current Design:** Only public channels (Phase 1)

**Considerations:**
- **Pros:** Useful for one-on-one coordination
- **Cons:** Moderation harder, privacy concerns, abuse potential

**Recommendation:** Defer to Phase 2, encourage public channels for transparency

**Decision Needed:** ⬜ Confirm no DMs in Phase 1

---

### 4.3 Chat Read Receipts

**Question:** Should users see who has read their messages?

**Options:**
- **No read receipts:** Privacy-focused
- **Read counts:** "Seen by 5 people" (anonymous)
- **Full read receipts:** "Seen by John, Jane, Bob"

**Recommendation:** No read receipts in Phase 1 (simpler, less creepy)

**Decision Needed:** ⬜ Confirm read receipt approach

---

## 5. Files & Uploads

### 5.1 File Upload Virus Scanning

**Question:** Should uploaded files be scanned for viruses?

**Options:**
- **A) No scanning:** Trust users (risky)
- **B) ClamAV:** Open-source virus scanner (requires server setup)
- **C) CloudFlare Worker:** Scan on CDN edge (requires paid plan)
- **D) Client-side type validation only:** Block executables

**Recommendation:** Option D for Phase 1 (block .exe, .bat, .sh), add scanning in Phase 2

**Decision Needed:** ⬜ Confirm file security approach

---

### 5.2 File Storage Quotas

**Question:** Should there be storage limits per user or organization?

**Scenarios:**
- User uploads 50 high-res photos to posts
- Organization posts dozens of PDF meeting notes

**Options:**
- **No limits:** Use Supabase storage as needed (risky)
- **Per-user quota:** e.g., 100 MB per user
- **Per-org quota:** e.g., 1 GB per organization
- **Total quota:** e.g., 10 GB for entire platform

**Recommendation:** Start with 10 MB per file limit, 10 GB total storage (Phase 1)

**Decision Needed:** ⬜ Confirm storage limits

---

### 5.3 Image Processing

**Question:** Should uploaded images be automatically optimized?

**Benefits:**
- Smaller file sizes
- Faster page loads
- WebP conversion

**Options:**
- **A) Supabase Image Transformations:** Built-in, but may cost extra
- **B) Next.js Image Component:** Optimizes on-the-fly
- **C) Client-side compression:** Compress before upload
- **D) No optimization:** Store as-is

**Recommendation:** Option B (Next.js Image component) - free and automatic

**Decision Needed:** ⬜ Confirm image handling approach

---

## 6. Notifications

### 6.1 Notification Frequency

**Question:** How often should users receive notification emails?

**Options:**
- **Instant:** Email for every mention/reply (annoying)
- **Daily digest:** One email per day with summary
- **Weekly digest:** One email per week
- **User configurable:** Let users choose

**Recommendation:** User configurable with smart defaults (daily digest)

**Decision Needed:** ⬜ Confirm notification preferences

---

### 6.2 Critical Notification Channels

**Question:** For urgent building-wide announcements (fire drill, emergency), how to ensure users see them?

**Options:**
- **Email:** Sent immediately
- **SMS:** Requires phone numbers (and cost)
- **Push notifications:** Requires PWA or native app
- **In-app banner:** Visible when user logs in

**Recommendation:** Email + in-app banner (Phase 1)

**Decision Needed:** ⬜ Confirm urgent notification strategy

---

## 7. Search & Discovery

### 7.1 Search Privacy

**Question:** Should users see what others are searching for?

**Options:**
- **Private:** Search queries not logged or visible to admins
- **Analytics only:** Aggregate search terms for insights
- **Public:** "Trending searches" feature

**Recommendation:** Private (Phase 1), consider analytics in Phase 2

**Decision Needed:** ⬜ Confirm search privacy

---

### 7.2 Content Discovery Algorithm

**Question:** How should content be surfaced on the dashboard?

**Current Design:** Pinned posts + recent posts + upcoming events

**Alternative Approaches:**
- **Personalized:** Show content from user's organization first
- **Trending:** Show most-engaged content
- **Algorithmic:** ML-based recommendations

**Recommendation:** Stick with simple chronological + pinned (Phase 1)

**Decision Needed:** ⬜ Confirm content ranking approach

---

## 8. Accessibility & Localization

### 8.1 Multi-Language Support

**Question:** Do you need the platform in multiple languages?

**Scenario:** Some volunteers speak languages other than English

**Options:**
- **English only:** Simplest (Phase 1)
- **Multi-language:** i18n support from day one
- **Auto-translate:** Use browser translation

**Recommendation:** English only (Phase 1), assess need in Phase 2

**Decision Needed:** ⬜ Confirm language requirements

---

### 8.2 Accessibility Compliance Level

**Question:** What level of WCAG compliance is required?

**Options:**
- **WCAG 2.1 Level A:** Basic (minimum)
- **WCAG 2.1 Level AA:** Recommended (standard for public sector)
- **WCAG 2.1 Level AAA:** Maximum (very difficult to achieve)

**Recommendation:** Target Level AA (matches PROJECT_SPECS.md)

**Decision Needed:** ⬜ Confirm accessibility target

---

## 9. Analytics & Privacy

### 9.1 User Activity Tracking

**Question:** What user activity should be tracked?

**Options:**
| Activity | Track? | Purpose |
|----------|--------|---------|
| Page views | ✅ Yes | Understand usage patterns |
| Post views | ✅ Yes | Show view counts |
| Time spent | ❌ No | Privacy concern |
| Click tracking | ⚠️ Limited | Only major actions (create post, etc.) |
| Search queries | ❌ No | Privacy concern |
| IP addresses | ❌ No | GDPR concern |

**Recommendation:** Minimal tracking, privacy-focused (Plausible Analytics)

**Decision Needed:** ⬜ Confirm what analytics to collect

---

### 9.2 GDPR Compliance

**Question:** Is GDPR compliance required? (Are users in EU?)

**If Yes, Must Implement:**
- [ ] Cookie consent banner
- [ ] Privacy policy page
- [ ] Data export functionality (user can download their data)
- [ ] Data deletion functionality (right to be forgotten)
- [ ] Data processing agreement with Supabase

**Decision Needed:** ⬜ Confirm GDPR requirements

---

## 10. Billing & Scaling

### 10.1 Cost Projections

**Question:** What happens when you exceed Supabase free tier?

**Supabase Free Tier Limits:**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth/month
- 50,000 monthly active users

**Expected Usage (100 users):**
- Database: ~50 MB (well within limit)
- Storage: ~5 GB files (need paid plan: $25/mo)
- Bandwidth: ~10 GB/mo (need paid plan)

**Recommendation:** Budget for Supabase Pro plan ($25/mo) by Month 2

**Decision Needed:** ⬜ Confirm budget for hosting costs

---

### 10.2 Scaling Plan

**Question:** What if the platform is successful and grows to 500+ users?

**Considerations:**
- Supabase scales easily (just upgrade plan)
- Vercel scales automatically
- May need Redis caching (Phase 2+)
- May need CDN for file storage (Cloudflare R2)

**Recommendation:** Cross this bridge when you get there, architecture supports scale

**Decision Needed:** ⬜ Note expected growth trajectory

---

## 11. Integration Considerations

### 11.1 Calendar Data Import

**Question:** You mentioned importing calendar data from another Supabase DB. Please provide:

**Needed Information:**
1. Schema of existing events table (column names, types)
2. Sample data (5-10 example events)
3. Recurrence format (if any)
4. Do events have attachments?
5. Any user associations (who created events)?

**Decision Needed:** ⬜ Provide existing database schema

---

### 11.2 Future Integrations

**Question:** Are there other systems to integrate with in the future?

**Potential Integrations:**
- Existing charity management software (Salesforce, Raiser's Edge)
- Email marketing tools (Mailchimp)
- Accounting software (Xero, QuickBooks)
- Booking systems for rooms/resources

**Recommendation:** Build API with future integrations in mind (RESTful, well-documented)

**Decision Needed:** ⬜ List any planned integrations

---

## 12. Branding & Design

### 12.1 Logo & Brand Assets

**Question:** Do you have logo and brand guidelines?

**Needed Assets:**
- Logo (SVG format preferred)
- Primary brand color (hex code)
- Secondary brand color
- Font preferences (or use default: Inter)

**Decision Needed:** ⬜ Provide brand assets or approve defaults

---

### 12.2 Favicon & App Icons

**Question:** For PWA "Add to Home Screen", need app icons.

**Needed:**
- App icon (512x512 PNG)
- Favicon (multiple sizes)
- Splash screen image (optional)

**Decision Needed:** ⬜ Provide app icons or use default logo

---

## 13. Legal & Compliance

### 13.1 Terms of Service & Privacy Policy

**Question:** Do you have existing legal documents?

**Options:**
- **A) Use existing:** Adapt current policies
- **B) Create new:** Draft custom for this platform
- **C) Use template:** Free templates available online

**Recommendation:** Start with template, review with legal team

**Decision Needed:** ⬜ Confirm legal documentation approach

---

### 13.2 Data Ownership

**Question:** Who owns the content posted on the platform?

**Options:**
- **Users retain ownership:** Standard approach
- **Organization owns:** Content belongs to charity
- **Platform owns:** Risky, not recommended

**Recommendation:** Users retain ownership, grant platform license to display

**Decision Needed:** ⬜ Confirm content ownership policy

---

## 14. Support & Maintenance

### 14.1 Support Email

**Question:** What email should users contact for help?

**Options:**
- Dedicated support email: support@villagehub.org
- IT staff email: it@stmartins.org
- Generic contact: info@villagehub.org

**Decision Needed:** ⬜ Provide support contact email

---

### 14.2 Ongoing Maintenance

**Question:** Who will maintain the platform post-launch?

**Maintenance Tasks:**
- Bug fixes
- Security updates
- Adding organizations/users
- Content moderation
- Answering user questions

**Decision Needed:** ⬜ Assign maintenance responsibilities

---

## 15. Training & Onboarding

### 15.1 User Training Plan

**Question:** How will users be trained?

**Options:**
- **Live training session:** 1-hour Zoom walkthrough
- **Video tutorials:** Pre-recorded screencast
- **User guide:** Written documentation with screenshots
- **In-app tooltips:** Guided tour on first login

**Recommendation:** Live session + video tutorials + user guide

**Decision Needed:** ⬜ Confirm training approach and schedule

---

### 15.2 Change Management

**Question:** How to handle transition from current communication methods?

**Current State:** Email lists, posters, disparate tools

**Transition Plan:**
1. Announce new platform 2 weeks before launch
2. Run pilot with 5-10 champions
3. Gradual rollout (one charity at a time?)
4. Maintain old methods for 1 month overlap
5. Fully transition after 1 month

**Decision Needed:** ⬜ Confirm rollout strategy

---

## 📋 Decision Checklist

Before starting development, confirm:

### Critical (Must Decide):
- [ ] User registration policy (open vs invite-only)
- [ ] Content retention policies
- [ ] Event privacy (all public vs org-private)
- [ ] File storage limits
- [ ] GDPR compliance requirements
- [ ] Hosting budget approved
- [ ] Support email address
- [ ] Existing calendar data schema provided

### Important (Should Decide):
- [ ] User deletion vs deactivation approach
- [ ] Chat message deletion policy
- [ ] Event cancellation workflow
- [ ] Notification frequency defaults
- [ ] Moderation response time SLA
- [ ] Brand assets provided
- [ ] Training plan scheduled

### Nice to Have (Can Decide Later):
- [ ] Edit history tracking (Phase 2)
- [ ] Multi-language support (Phase 2)
- [ ] DMs in chat (Phase 2)
- [ ] Advanced search features (Phase 2)
- [ ] Future integrations planned

---

## 🚨 Blockers to Resolve Before Coding

**Must have before Phase 0:**
1. ✅ Supabase account created
2. ✅ OAuth apps registered (Microsoft + Google)
3. ✅ Domain name decided (for OAuth redirect URLs)
4. ✅ First admin user plan (how to create)
5. ✅ Existing calendar data schema (if migrating)

**Can resolve during Phase 0-1:**
- Logo and brand assets
- Support email
- Training plan
- Legal documents

---

## 💡 Recommendations Summary

**My Top Recommendations:**

1. **Start Simple:** Use all the "Phase 1" simple approaches, defer complexity to Phase 2
2. **Privacy-Focused:** Minimal tracking, user data ownership, clear policies
3. **Mobile-First:** Design for mobile from day one, avoid desktop-only features
4. **Iterative Feedback:** Launch MVP to 5-10 pilot users early, gather feedback, iterate
5. **Document Decisions:** When you make a call on any of these questions, document it
6. **Security First:** Test RLS policies thoroughly, never trust client-side checks alone
7. **Accessibility Matters:** Use semantic HTML, keyboard nav, ARIA labels from the start

---

**Document Version:** 1.0
**Created:** November 3, 2025
**Status:** Awaiting Decisions
**Next Action:** Review with stakeholders and confirm critical decisions
