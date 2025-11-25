# User Stories & Story Mapping

**Project:** The Village Hub - Internal Communications Platform
**Last Updated:** November 24, 2025

---

## Story Mapping Overview

This document breaks down the project into user stories organized by **user journeys** and **epics**. Each story includes:
- **Story Points** (effort estimate: 1 = small, 3 = medium, 5 = large, 8 = very large)
- **Status** (✅ Done, 🚧 In Progress, ⏳ To Do, 🔮 Future)
- **Dependencies**
- **Acceptance Criteria**

---

## User Personas

### Primary Users
1. **Sarah - Organization Admin** (Partner Charity)
   - Manages her charity's presence
   - Posts updates, creates events
   - Responds to collaboration requests

2. **Mike - St Martins Staff** (Building Manager)
   - Oversees all organizations
   - Creates building-wide events
   - Moderates content

3. **Lisa - Volunteer** (Multiple Orgs)
   - Browses opportunities
   - RSVPs to events
   - Offers skills/resources

### Secondary Users
4. **Emma - Project Manager** (Partner Charity)
   - Runs multi-org projects
   - Tracks progress and tasks
   - Recruits collaborators

---

## Epic 1: User Onboarding & Authentication

### 🎯 Goal
Users can sign up, log in, and set up their profile

### Stories

#### 1.1 Sign Up with Email ⏳
**As a** new user
**I want to** sign up with my email address
**So that** I can access the platform

- **Story Points:** 5
- **Status:** ⏳ To Do
- **Dependencies:** Supabase Auth setup (✅ Done)
- **Acceptance Criteria:**
  - [ ] Email/password sign up form
  - [ ] Email verification required
  - [ ] Welcome email sent
  - [ ] Redirected to profile setup

#### 1.2 OAuth Sign In ⏳
**As a** user
**I want to** sign in with Google/Microsoft
**So that** I don't need another password

- **Story Points:** 3
- **Status:** ⏳ To Do
- **Dependencies:** OAuth configuration
- **Acceptance Criteria:**
  - [ ] "Sign in with Google" button
  - [ ] "Sign in with Microsoft" button
  - [ ] Auto-create profile on first login
  - [ ] Redirect to dashboard

#### 1.3 Dev Login ✅
**As a** developer
**I want to** quickly log in without OAuth setup
**So that** I can test features

- **Story Points:** 2
- **Status:** ✅ Done (Nov 20)
- **Implementation:** `/api/dev-login`
- **Acceptance Criteria:**
  - [x] POST endpoint creates test user
  - [x] Auto-creates org and profile
  - [x] Returns credentials
  - [x] Works in development only

#### 1.4 Complete Profile ⏳
**As a** new user
**I want to** complete my profile with name, organization, role
**So that** others know who I am

- **Story Points:** 3
- **Status:** ⏳ To Do
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] Profile setup wizard
  - [ ] Required fields: name, org, role
  - [ ] Optional: avatar, bio, skills
  - [ ] Can skip and complete later

---

## Epic 2: Social Feed & Posts

### 🎯 Goal
Users can view and create posts in a social feed

### Stories

#### 2.1 View Feed ✅
**As a** user
**I want to** see recent posts from all organizations
**So that** I stay updated on community activity

- **Story Points:** 5
- **Status:** ✅ Done (Nov 19)
- **Implementation:** `/dashboard` with 3-column layout
- **Acceptance Criteria:**
  - [x] Shows posts, events, projects in chronological order
  - [x] Displays author name and org
  - [x] Shows post category badge
  - [x] Shows timestamp ("2 hours ago")
  - [x] Responsive on mobile

#### 2.2 Create Post ⏳
**As a** user
**I want to** create a post with category
**So that** I can share updates with the community

- **Story Points:** 5
- **Status:** ⏳ To Do (UI exists, not wired up)
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] Text area for content (required)
  - [ ] Category selector (Wins, Opportunities, Questions, Learnings, General)
  - [ ] Optional title field
  - [ ] Optional image upload
  - [ ] "Post" button saves to database
  - [ ] Post appears in feed immediately

#### 2.3 Filter Feed ✅
**As a** user
**I want to** filter posts by type (All, Events, Projects, Posts)
**So that** I can focus on specific content

- **Story Points:** 2
- **Status:** ✅ Done (Nov 19)
- **Acceptance Criteria:**
  - [x] Filter buttons above feed
  - [x] "All" shows everything
  - [x] Other filters show only that type
  - [x] Active filter visually highlighted

#### 2.4 React to Posts ⏳
**As a** user
**I want to** like/react to posts
**So that** I can show appreciation

- **Story Points:** 3
- **Status:** ⏳ To Do
- **Dependencies:** Reactions table
- **Acceptance Criteria:**
  - [ ] Heart icon on each post
  - [ ] Click to like/unlike
  - [ ] Shows like count
  - [ ] User can see who liked
  - [ ] Emoji reactions (future)

#### 2.5 Comment on Posts ⏳
**As a** user
**I want to** comment on posts
**So that** I can engage in discussion

- **Story Points:** 5
- **Status:** ⏳ To Do
- **Dependencies:** Comments table
- **Acceptance Criteria:**
  - [ ] "Comment" button opens input
  - [ ] Type and submit comment
  - [ ] Comments appear below post
  - [ ] Shows commenter name/org
  - [ ] Can delete own comments

---

## Epic 3: Events Management

### 🎯 Goal
Users can create, discover, and RSVP to events

### Stories

#### 3.1 View Events in Feed ✅
**As a** user
**I want to** see upcoming events in my feed
**So that** I know what's happening

- **Story Points:** 5
- **Status:** ✅ Done (Nov 19)
- **Acceptance Criteria:**
  - [x] Event cards show title, date, time, location
  - [x] Shows host organization
  - [x] Shows collaborating orgs (multi-org feature)
  - [x] Different visual style than posts

#### 3.2 Create Event ⏳
**As an** organization admin or staff
**I want to** create an event
**So that** I can publicize it to the community

- **Story Points:** 8
- **Status:** ⏳ To Do
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] Form with title, description, date/time, location
  - [ ] Optional: volunteers needed, seeking partners
  - [ ] Optional: invite collaborating orgs
  - [ ] Optional: banner image
  - [ ] Saves to events table
  - [ ] Appears in feed

#### 3.3 RSVP to Event ⏳
**As a** user
**I want to** RSVP to an event
**So that** organizers know I'm attending

- **Story Points:** 5
- **Status:** ⏳ To Do (High Priority)
- **Dependencies:** event_rsvps table
- **Acceptance Criteria:**
  - [ ] "RSVP" button on event card
  - [ ] Options: Going, Maybe, Can't Go
  - [ ] Can offer to volunteer
  - [ ] Can offer resources
  - [ ] Shows attendee count
  - [ ] Can change/cancel RSVP

#### 3.4 View Event Calendar ⏳
**As a** user
**I want to** see events in a calendar view
**So that** I can plan my schedule

- **Story Points:** 8
- **Status:** ⏳ To Do
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] Month view calendar
  - [ ] Events appear on dates
  - [ ] Click date to see events
  - [ ] Click event to see details
  - [ ] Filter by organization
  - [ ] Export to iCal

#### 3.5 Event Reminders ⏳
**As a** user who RSVP'd
**I want to** receive reminders before events
**So that** I don't forget to attend

- **Story Points:** 5
- **Status:** ⏳ To Do
- **Dependencies:** Notifications system
- **Acceptance Criteria:**
  - [ ] Notification 1 day before
  - [ ] Notification 1 hour before
  - [ ] In-app notification
  - [ ] Email notification (optional)
  - [ ] Can customize reminder timing

---

## Epic 4: Multi-Organization Collaboration

### 🎯 Goal
Organizations can collaborate on events and projects

### Stories

#### 4.1 Display Collaborating Orgs ✅
**As a** user
**I want to** see which organizations are collaborating
**So that** I understand the partnerships

- **Story Points:** 3
- **Status:** ✅ Done (Nov 24)
- **Implementation:** Phase 1 complete
- **Acceptance Criteria:**
  - [x] Shows "Org A and Org B" for 2 orgs
  - [x] Shows "Org A, Org B · +2 more" for 3+ orgs
  - [x] Works for both events and projects
  - [x] Fetches org names from UUIDs

#### 4.2 Invite Collaborators 🚧
**As an** event/project creator
**I want to** invite other organizations to collaborate
**So that** we can partner on initiatives

- **Story Points:** 8
- **Status:** 🚧 In Progress (Phase 2)
- **Dependencies:** collaboration_invitations table (✅ Done)
- **Acceptance Criteria:**
  - [ ] "Invite Collaborators" field in create form
  - [ ] Multiselect dropdown of all orgs
  - [ ] Can add optional message
  - [ ] Invitation saved to database
  - [ ] Notification sent to invitee admin
  - [ ] Shows "(Pending)" status

#### 4.3 Respond to Invitation 🚧
**As an** organization admin
**I want to** accept or decline collaboration invitations
**So that** I can manage partnerships

- **Story Points:** 5
- **Status:** 🚧 In Progress (Phase 2)
- **Dependencies:** Notifications system (🚧)
- **Acceptance Criteria:**
  - [ ] Receive notification of invitation
  - [ ] See event/project details
  - [ ] "Accept" button adds org to collaborators
  - [ ] "Decline" button updates status
  - [ ] Notification sent back to inviter
  - [ ] Can add response message

#### 4.4 Express Interest 🚧
**As an** organization
**I want to** express interest in collaborating
**So that** I can proactively seek partnerships

- **Story Points:** 5
- **Status:** 🚧 In Progress (Phase 2)
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] "Express Interest" button on events/projects
  - [ ] Only shows when "seeking_partners: true"
  - [ ] Confirmation dialog
  - [ ] Notification sent to organizer
  - [ ] Organizer can accept/decline
  - [ ] Shows feedback "Interest sent!"

#### 4.5 Collaboration History 🔮
**As an** organization admin
**I want to** see past collaborations with other orgs
**So that** I can build on successful partnerships

- **Story Points:** 5
- **Status:** 🔮 Future
- **Dependencies:** Analytics
- **Acceptance Criteria:**
  - [ ] List of past collaborations
  - [ ] Shows events/projects worked on together
  - [ ] Shows success metrics
  - [ ] "Invite Again" shortcut

---

## Epic 5: Project Management

### 🎯 Goal
Users can create and collaborate on long-term projects

### Stories

#### 5.1 View Projects in Feed ✅
**As a** user
**I want to** see active projects in my feed
**So that** I can discover opportunities

- **Story Points:** 5
- **Status:** ✅ Done (Nov 19)
- **Acceptance Criteria:**
  - [x] Project cards show title, description, goal
  - [x] Shows progress bar (X of Y complete)
  - [x] Shows collaborating orgs
  - [x] Shows needs (volunteers, partners, resources)

#### 5.2 Create Project ⏳
**As an** organization admin or staff
**I want to** create a project
**So that** I can organize long-term initiatives

- **Story Points:** 8
- **Status:** ⏳ To Do
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] Form with title, description, impact goal
  - [ ] Set progress tracking (count, percent, currency)
  - [ ] Optional: target date, service area
  - [ ] Optional: volunteers needed, fundraising goal
  - [ ] Optional: invite collaborating orgs
  - [ ] Saves to projects table

#### 5.3 Update Project Progress ⏳
**As a** project owner
**I want to** update progress
**So that** community sees our impact

- **Story Points:** 3
- **Status:** ⏳ To Do
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] "Update Progress" button
  - [ ] Enter new progress value
  - [ ] Optional: add update note
  - [ ] Progress bar updates in feed
  - [ ] Notification sent to followers

#### 5.4 Project Tasks ⏳
**As a** project manager
**I want to** break project into tasks
**So that** work is organized and trackable

- **Story Points:** 8
- **Status:** ⏳ To Do
- **Dependencies:** project_tasks table
- **Acceptance Criteria:**
  - [ ] Add tasks to project
  - [ ] Assign tasks to users
  - [ ] Mark tasks complete
  - [ ] Project progress auto-calculates from tasks
  - [ ] Task list visible on project detail page

#### 5.5 Express Interest in Project 🚧
**As a** user or organization
**I want to** express interest in joining a project
**So that** I can contribute

- **Story Points:** 3
- **Status:** 🚧 In Progress (Phase 2)
- **Dependencies:** Same as Epic 4.4
- **Acceptance Criteria:**
  - [ ] "Join Project" button
  - [ ] Notification sent to project owner
  - [ ] Owner can approve/decline
  - [ ] Approved users added to collaborators

---

## Epic 6: Communication & Chat

### 🎯 Goal
Users can communicate via chat and direct messages

### Stories

#### 6.1 Simple Global Chat ✅
**As a** user
**I want to** participate in a community chat
**So that** I can have casual conversations

- **Story Points:** 5
- **Status:** ✅ Done (Nov 23)
- **Implementation:** chat_messages table created
- **Acceptance Criteria:**
  - [x] Single channel for all users
  - [x] Messages display chronologically
  - [x] Shows sender name and org
  - [x] Timestamp on messages

#### 6.2 Send Chat Message ⏳
**As a** user
**I want to** send messages in chat
**So that** I can communicate with community

- **Story Points:** 3
- **Status:** ⏳ To Do (UI not built)
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] Text input at bottom of chat
  - [ ] "Send" button or press Enter
  - [ ] Message appears immediately
  - [ ] Can edit own messages (5 min window)
  - [ ] Can delete own messages

#### 6.3 Direct Messages ⏳
**As a** user
**I want to** send private messages to other users
**So that** I can have private conversations

- **Story Points:** 8
- **Status:** ⏳ To Do
- **Dependencies:** conversations table
- **Acceptance Criteria:**
  - [ ] "Message" button on user profiles
  - [ ] Opens DM thread
  - [ ] Conversation list
  - [ ] Unread message badges
  - [ ] Typing indicators

#### 6.4 Group Chats ⏳
**As a** user
**I want to** create group chats
**So that** I can discuss projects with team

- **Story Points:** 8
- **Status:** ⏳ To Do
- **Dependencies:** conversations table
- **Acceptance Criteria:**
  - [ ] "New Group Chat" button
  - [ ] Select multiple users
  - [ ] Name the group
  - [ ] Add/remove members
  - [ ] Leave group

---

## Epic 7: Notifications

### 🎯 Goal
Users receive timely notifications about relevant activity

### Stories

#### 7.1 Notification Infrastructure 🚧
**As a** developer
**I want** a notification system
**So that** users can be alerted to activity

- **Story Points:** 5
- **Status:** 🚧 In Progress (Phase 2)
- **Implementation:** notifications table created
- **Acceptance Criteria:**
  - [x] Database table for notifications
  - [x] Triggers for collaboration invitations
  - [ ] Server actions to create notifications
  - [ ] Server actions to mark read

#### 7.2 Notification Bell 🚧
**As a** user
**I want to** see a notification count in header
**So that** I know when there's new activity

- **Story Points:** 5
- **Status:** 🚧 In Progress (Phase 2)
- **Dependencies:** 7.1
- **Acceptance Criteria:**
  - [ ] Bell icon in header
  - [ ] Badge shows unread count
  - [ ] Click opens dropdown
  - [ ] Dropdown shows recent notifications
  - [ ] Click notification to view details
  - [ ] "Mark all as read" button

#### 7.3 Notification Types ⏳
**As a** user
**I want to** receive different types of notifications
**So that** I stay informed

- **Story Points:** 3
- **Status:** ⏳ To Do
- **Dependencies:** 7.1, 7.2
- **Types:**
  - [ ] Collaboration invitation (🚧 In progress)
  - [ ] Invitation accepted/declined
  - [ ] Event reminder
  - [ ] Project update
  - [ ] Someone mentioned you
  - [ ] Comment on your post
  - [ ] Reaction to your post

#### 7.4 Email Notifications ⏳
**As a** user
**I want to** receive email summaries
**So that** I don't miss important updates

- **Story Points:** 5
- **Status:** ⏳ To Do
- **Dependencies:** Email service (Resend/SendGrid)
- **Acceptance Criteria:**
  - [ ] Daily digest email option
  - [ ] Immediate emails for urgent notifications
  - [ ] Unsubscribe link
  - [ ] Email preferences page
  - [ ] Branded email templates

---

## Epic 8: Search & Discovery

### 🎯 Goal
Users can find content, people, and opportunities

### Stories

#### 8.1 Global Search ⏳
**As a** user
**I want to** search across all content
**So that** I can find specific posts, events, projects

- **Story Points:** 8
- **Status:** ⏳ To Do (High Priority)
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] Search bar in header (currently placeholder)
  - [ ] Search posts, events, projects, people
  - [ ] Real-time search suggestions
  - [ ] Filter results by type
  - [ ] Highlight matching text
  - [ ] Recent searches saved

#### 8.2 People Directory ⏳
**As a** user
**I want to** browse all users in the network
**So that** I can find people with specific skills

- **Story Points:** 5
- **Status:** ⏳ To Do
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] List view of all users
  - [ ] Shows name, org, role, avatar
  - [ ] Filter by organization
  - [ ] Filter by role
  - [ ] Filter by skills/interests
  - [ ] Click to view profile

#### 8.3 User Profiles ⏳
**As a** user
**I want to** view someone's profile
**So that** I can learn more about them

- **Story Points:** 5
- **Status:** ⏳ To Do
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] Profile page shows full details
  - [ ] Bio, contact info, skills, interests
  - [ ] Posts/events/projects they created
  - [ ] "Message" button
  - [ ] Privacy controls on what's visible

---

## Epic 9: Admin & Moderation

### 🎯 Goal
Admins can manage the platform and moderate content

### Stories

#### 9.1 Admin Dashboard ⏳
**As an** admin
**I want to** access admin tools
**So that** I can manage the platform

- **Story Points:** 8
- **Status:** ⏳ To Do
- **Dependencies:** None
- **Acceptance Criteria:**
  - [ ] Admin-only route/page
  - [ ] Shows platform statistics
  - [ ] List of all organizations
  - [ ] List of all users
  - [ ] Recent activity feed

#### 9.2 Manage Organizations ⏳
**As an** admin
**I want to** add/edit organizations
**So that** I can onboard new partners

- **Story Points:** 5
- **Status:** ⏳ To Do
- **Dependencies:** 9.1
- **Acceptance Criteria:**
  - [ ] Create new organization
  - [ ] Edit org details (name, logo, description)
  - [ ] Deactivate organization
  - [ ] Assign admin users to org

#### 9.3 Content Moderation ⏳
**As an** admin
**I want to** moderate inappropriate content
**So that** platform remains professional

- **Story Points:** 5
- **Status:** ⏳ To Do
- **Dependencies:** 9.1
- **Acceptance Criteria:**
  - [ ] Flag content for review
  - [ ] Delete inappropriate posts/comments
  - [ ] Warn/suspend users
  - [ ] View moderation history

---

## Story Status Summary

### By Status
- ✅ **Done:** 7 stories (35 points)
- 🚧 **In Progress:** 6 stories (31 points)
- ⏳ **To Do (High Priority):** 8 stories (45 points)
- ⏳ **To Do (Medium Priority):** 15 stories (85 points)
- ⏳ **To Do (Low Priority):** 5 stories (28 points)
- 🔮 **Future:** 2 stories (10 points)

### By Epic
| Epic | Total Points | Done | In Progress | To Do |
|------|--------------|------|-------------|-------|
| 1. Onboarding & Auth | 13 | 2 | 0 | 11 |
| 2. Social Feed | 20 | 7 | 0 | 13 |
| 3. Events | 31 | 5 | 0 | 26 |
| 4. Collaboration | 26 | 3 | 18 | 5 |
| 5. Projects | 27 | 5 | 3 | 19 |
| 6. Chat | 24 | 5 | 0 | 19 |
| 7. Notifications | 18 | 5 | 5 | 8 |
| 8. Search | 18 | 0 | 0 | 18 |
| 9. Admin | 18 | 0 | 0 | 18 |

---

## Current Sprint Focus (Week of Nov 24)

### Sprint Goal
Complete Phase 2 Collaboration + Event RSVP + Search

### Stories in Sprint
1. 🚧 4.2 Invite Collaborators (8 points)
2. 🚧 4.3 Respond to Invitation (5 points)
3. 🚧 4.4 Express Interest (5 points)
4. 🚧 7.2 Notification Bell (5 points)
5. ⏳ 3.3 RSVP to Event (5 points)
6. ⏳ 8.1 Global Search (8 points)

**Total:** 36 points

---

## Next Sprint Preview

### Likely Stories
1. Event Calendar (8 points)
2. Create Event (8 points)
3. Create Project (8 points)
4. Direct Messages (8 points)
5. People Directory (5 points)
6. User Profiles (5 points)

---

**Last Updated:** November 24, 2025
**Next Review:** December 1, 2025
