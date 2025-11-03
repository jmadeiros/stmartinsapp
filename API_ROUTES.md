# The Village Hub - API Routes Specification
## Complete API Documentation v1.0

---

## Table of Contents
1. [API Overview](#1-api-overview)
2. [Authentication](#2-authentication)
3. [Users API](#3-users-api)
4. [Posts API](#4-posts-api)
5. [Events API](#5-events-api)
6. [Chat API](#6-chat-api)
7. [Jobs API](#7-jobs-api)
8. [Meeting Notes API](#8-meeting-notes-api)
9. [Media Coverage API](#9-media-coverage-api)
10. [Upload API](#10-upload-api)
11. [Dashboard API](#11-dashboard-api)
12. [Error Handling](#12-error-handling)
13. [Rate Limiting](#13-rate-limiting)

---

## 1. API Overview

### Base URL
```
Development: http://localhost:3000/api
Production: https://internal-comms.villagehub.org/api
```

### Common Headers
```
Authorization: Bearer <jwt_token>  (automatically handled by Supabase client)
Content-Type: application/json
```

### Response Format

**Success Response:**
```json
{
  "data": { /* response data */ },
  "pagination": {  // Only for list endpoints
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Response:**
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { /* optional context */ }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (semantic error)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 2. Authentication

### POST /api/auth/signup
Create a new user account (email invite flow)

**Request:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "organization_id": "uuid",
  "role": "partner_staff"  // Pending admin approval
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "message": "User created. Please check your email to verify your account."
  }
}
```

---

### POST /api/auth/signin
Redirect to OAuth provider (handled by Supabase)

**Query Params:**
- `provider`: `microsoft` | `google`
- `redirectTo`: URL to redirect after auth (optional)

---

### POST /api/auth/signout
Sign out current user

**Response:** `200 OK`
```json
{
  "data": {
    "message": "Signed out successfully"
  }
}
```

---

### GET /api/auth/session
Get current user session

**Response:** `200 OK`
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "partner_staff",
      "organization": {
        "id": "uuid",
        "name": "Charity Alpha"
      },
      "avatar_url": "https://..."
    },
    "session": {
      "access_token": "jwt...",
      "expires_at": 1234567890
    }
  }
}
```

---

## 3. Users API

### GET /api/users
List all active users

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `search` - Search by name or email
- `role` - Filter by role
- `organization_id` - Filter by organization

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "partner_staff",
      "organization": {
        "id": "uuid",
        "name": "Charity Alpha",
        "logo_url": "https://..."
      },
      "avatar_url": "https://...",
      "job_title": "Project Manager",
      "last_seen_at": "2025-11-03T10:30:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### GET /api/users/:id
Get user by ID

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "partner_staff",
    "organization": { /* ... */ },
    "avatar_url": "https://...",
    "bio": "Project manager passionate about...",
    "phone": "+44 7700 900000",
    "job_title": "Project Manager",
    "created_at": "2025-01-15T09:00:00Z",
    "last_seen_at": "2025-11-03T10:30:00Z"
  }
}
```

---

### PATCH /api/users/:id
Update user profile (own profile only, unless admin)

**Request:**
```json
{
  "full_name": "John Doe Jr.",
  "bio": "Updated bio...",
  "phone": "+44 7700 900000",
  "job_title": "Senior Project Manager"
}
```

**Response:** `200 OK`
```json
{
  "data": { /* updated user object */ }
}
```

---

### PATCH /api/users/:id/role
Update user role (admin only)

**Request:**
```json
{
  "role": "st_martins_staff"
}
```

**Response:** `200 OK`

---

## 4. Posts API

### GET /api/posts
List posts with filters

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20)
- `category` - Filter by category: `announcement`, `event`, `job`, `story`, `general`
- `organization_id` - Filter by organization
- `pinned` - Boolean, show only pinned posts
- `search` - Search in title and content

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Fire Drill Today at 2 PM",
      "content": "Please evacuate the building...",
      "category": "announcement",
      "is_pinned": true,
      "pinned_at": "2025-11-03T08:00:00Z",
      "author": {
        "id": "uuid",
        "full_name": "Jane Smith",
        "avatar_url": "https://...",
        "organization": "St Martins Housing Trust"
      },
      "organization": {
        "id": "uuid",
        "name": "St Martins Housing Trust"
      },
      "tags": ["urgent", "building"],
      "view_count": 45,
      "comment_count": 3,
      "reactions": {
        "like": 12,
        "helpful": 5
      },
      "created_at": "2025-11-03T08:00:00Z",
      "updated_at": "2025-11-03T08:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### GET /api/posts/:id
Get single post with comments

**Response:** `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "title": "Fire Drill Today at 2 PM",
    "content": "Full post content...",
    "category": "announcement",
    "is_pinned": true,
    "author": { /* ... */ },
    "organization": { /* ... */ },
    "tags": ["urgent"],
    "comments": [
      {
        "id": "uuid",
        "content": "Thanks for the heads up!",
        "author": {
          "id": "uuid",
          "full_name": "John Doe",
          "avatar_url": "https://..."
        },
        "created_at": "2025-11-03T08:15:00Z",
        "updated_at": "2025-11-03T08:15:00Z"
      }
    ],
    "reactions": {
      "like": 12,
      "helpful": 5
    },
    "user_reaction": "like",  // Current user's reaction (null if none)
    "created_at": "2025-11-03T08:00:00Z",
    "updated_at": "2025-11-03T08:00:00Z"
  }
}
```

---

### POST /api/posts
Create new post (Partner staff and above)

**Request:**
```json
{
  "title": "Cross-Charity Mixer - Wednesday 5 PM",
  "content": "Join us for an informal networking session...",
  "category": "event",
  "tags": ["networking", "social"],
  "expires_at": "2025-12-01T00:00:00Z"  // Optional
}
```

**Response:** `201 Created`
```json
{
  "data": { /* created post object */ }
}
```

**Validation Rules:**
- `title`: 3-200 characters, required
- `content`: 10+ characters, required
- `category`: must be valid enum value
- `tags`: max 10 tags, each max 30 characters
- `expires_at`: must be future date

---

### PATCH /api/posts/:id
Update post (author or admin)

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "tags": ["updated", "tags"]
}
```

**Response:** `200 OK`

---

### PATCH /api/posts/:id/pin
Pin/unpin post (St Martins staff or admin only)

**Request:**
```json
{
  "is_pinned": true
}
```

**Response:** `200 OK`

---

### DELETE /api/posts/:id
Delete post (soft delete, admin only)

**Response:** `204 No Content`

---

### POST /api/posts/:id/comments
Add comment to post (Partner staff and above)

**Request:**
```json
{
  "content": "Great initiative!",
  "parent_comment_id": "uuid"  // Optional, for replies
}
```

**Response:** `201 Created`
```json
{
  "data": { /* created comment object */ }
}
```

---

### POST /api/posts/:id/reactions
Add/update reaction to post (All authenticated users)

**Request:**
```json
{
  "reaction_type": "like"  // "like" | "helpful" | "celebrate"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "reaction_type": "like",
    "created_at": "2025-11-03T10:30:00Z"
  }
}
```

---

### DELETE /api/posts/:id/reactions
Remove reaction from post

**Response:** `204 No Content`

---

## 5. Events API

### GET /api/events
List events with filters

**Query Params:**
- `start_date` - ISO date, filter events starting after this date
- `end_date` - ISO date, filter events ending before this date
- `category` - Filter by event category
- `organization_id` - Filter by organization
- `view` - `month` | `week` | `list` (affects response format)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Monday Partner Meeting",
      "description": "Weekly meeting for all partner charities",
      "location": "Conference Room A",
      "start_time": "2025-11-06T10:00:00Z",
      "end_time": "2025-11-06T11:30:00Z",
      "is_all_day": false,
      "is_recurring": true,
      "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO",
      "category": "meeting",
      "color": "#3B82F6",
      "organizer": {
        "id": "uuid",
        "full_name": "Jane Smith",
        "organization": "St Martins Housing Trust"
      },
      "organization": { /* ... */ },
      "attachments": [
        {
          "id": "uuid",
          "file_name": "agenda.pdf",
          "file_url": "https://...",
          "file_type": "application/pdf"
        }
      ],
      "created_at": "2025-10-01T09:00:00Z"
    }
  ]
}
```

---

### GET /api/events/:id
Get single event

**Response:** `200 OK`
```json
{
  "data": { /* event object with full details */ }
}
```

---

### POST /api/events
Create new event (Partner staff and above)

**Request:**
```json
{
  "title": "Charity Workshop",
  "description": "Learn about grant applications...",
  "location": "Room B",
  "start_time": "2025-11-10T14:00:00Z",
  "end_time": "2025-11-10T16:00:00Z",
  "is_all_day": false,
  "is_recurring": false,
  "category": "workshop",
  "color": "#10B981"
}
```

**Response:** `201 Created`

**Validation Rules:**
- `title`: 3-200 characters, required
- `start_time`: required, must be future date
- `end_time`: required, must be after start_time
- `recurrence_rule`: optional, must be valid RRULE format

---

### PATCH /api/events/:id
Update event (organizer or admin)

**Request:**
```json
{
  "title": "Updated Event Title",
  "start_time": "2025-11-10T15:00:00Z"
}
```

**Response:** `200 OK`

---

### DELETE /api/events/:id
Delete event (organizer or admin)

**Query Params:**
- `delete_series` - Boolean, if true delete all recurring instances

**Response:** `204 No Content`

---

### POST /api/events/:id/attachments
Upload attachment to event

**Request:** `multipart/form-data`
```
file: (binary file data)
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "file_name": "agenda.pdf",
    "file_url": "https://...",
    "file_type": "application/pdf",
    "file_size": 123456
  }
}
```

---

## 6. Chat API

### GET /api/chat/channels
List accessible chat channels

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "General",
      "slug": "general",
      "description": "Building-wide general discussion",
      "channel_type": "public",
      "last_message_at": "2025-11-03T10:25:00Z",
      "unread_count": 3,  // For current user
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /api/chat/channels/:id/messages
Get messages in channel

**Query Params:**
- `limit` (default: 50, max: 100)
- `before` - ISO timestamp, get messages before this time (pagination cursor)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Hello everyone!",
      "user": {
        "id": "uuid",
        "full_name": "John Doe",
        "avatar_url": "https://..."
      },
      "mentions": ["uuid1", "uuid2"],
      "created_at": "2025-11-03T10:25:00Z"
    }
  ],
  "has_more": true
}
```

---

### POST /api/chat/channels/:id/messages
Send message to channel

**Request:**
```json
{
  "content": "Hello @John! How are things going?",
  "mentions": ["user-uuid"]  // Array of mentioned user IDs
}
```

**Response:** `201 Created`
```json
{
  "data": { /* created message object */ }
}
```

**Validation Rules:**
- `content`: 1-2000 characters, required
- `mentions`: optional, max 20 mentions per message

---

### DELETE /api/chat/messages/:id
Delete own message (soft delete)

**Response:** `204 No Content`

---

## 7. Jobs API

### GET /api/jobs
List job postings

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20)
- `role_type` - Filter by: `paid_staff`, `volunteer`, `internship`
- `organization_id` - Filter by organization
- `active_only` - Boolean (default: true)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Volunteer Coordinator",
      "description": "We're seeking a passionate...",
      "role_type": "volunteer",
      "time_commitment": "10 hours/week",
      "requirements": "- Experience with...",
      "organization": {
        "id": "uuid",
        "name": "Charity Alpha",
        "logo_url": "https://..."
      },
      "contact_name": "Jane Smith",
      "contact_email": "jane@charityalpha.org",
      "application_url": "https://...",
      "closing_date": "2025-12-31",
      "is_active": true,
      "view_count": 24,
      "created_at": "2025-10-15T09:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### GET /api/jobs/:id
Get single job posting

**Response:** `200 OK`

---

### POST /api/jobs
Create job posting (Partner staff and above)

**Request:**
```json
{
  "title": "Volunteer Coordinator",
  "description": "We're seeking...",
  "role_type": "volunteer",
  "time_commitment": "10 hours/week",
  "requirements": "- Experience with...",
  "contact_name": "Jane Smith",
  "contact_email": "jane@charityalpha.org",
  "closing_date": "2025-12-31"
}
```

**Response:** `201 Created`

**Validation Rules:**
- `title`: 3-200 characters
- `description`: 50+ characters
- `contact_email`: valid email format
- `closing_date`: must be future date

---

### PATCH /api/jobs/:id
Update job posting (author or admin)

**Response:** `200 OK`

---

### DELETE /api/jobs/:id
Delete job posting (author or admin)

**Response:** `204 No Content`

---

## 8. Meeting Notes API

### GET /api/meeting-notes
List meeting notes

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20)
- `series` - Filter by meeting series name
- `start_date` - Filter notes after this date
- `end_date` - Filter notes before this date

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "meeting_series": "Monday Partner Meetings",
      "meeting_date": "2025-11-01",
      "title": "Monthly Check-in - November 2025",
      "organizer": {
        "id": "uuid",
        "full_name": "Jane Smith"
      },
      "attendees": ["John Doe", "Jane Smith", "Bob Wilson"],
      "agenda": "1. October recap\n2. November plans",
      "discussion_summary": "Discussed upcoming events...",
      "action_items": [
        {
          "description": "Book venue for December event",
          "assignee": "John Doe",
          "due_date": "2025-11-15"
        }
      ],
      "next_meeting_date": "2025-12-06",
      "attachments": [
        {
          "file_name": "presentation.pdf",
          "file_url": "https://..."
        }
      ],
      "created_at": "2025-11-01T12:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### GET /api/meeting-notes/:id
Get single meeting note

**Response:** `200 OK`

---

### POST /api/meeting-notes
Create meeting note (St Martins staff or admin)

**Request:**
```json
{
  "meeting_series": "Monday Partner Meetings",
  "meeting_date": "2025-11-01",
  "title": "Monthly Check-in - November 2025",
  "attendees": ["John Doe", "Jane Smith"],
  "agenda": "1. Recap\n2. Plans",
  "discussion_summary": "Discussed...",
  "action_items": [
    {
      "description": "Book venue",
      "assignee": "John Doe",
      "due_date": "2025-11-15"
    }
  ],
  "next_meeting_date": "2025-12-06"
}
```

**Response:** `201 Created`

---

### PATCH /api/meeting-notes/:id
Update meeting note (organizer or admin)

**Response:** `200 OK`

---

## 9. Media Coverage API

### GET /api/media-coverage
List media coverage articles

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20)
- `organization_id` - Filter by organization
- `featured_only` - Boolean
- `tags` - Comma-separated tags

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Local Charity Makes Impact in Community",
      "publication_name": "The Daily News",
      "publication_date": "2025-10-28",
      "article_url": "https://dailynews.com/article",
      "summary": "Charity Alpha's recent initiative...",
      "thumbnail_url": "https://...",
      "organization": {
        "id": "uuid",
        "name": "Charity Alpha"
      },
      "tags": ["community", "impact"],
      "is_featured": false,
      "created_at": "2025-10-29T09:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### POST /api/media-coverage
Create media coverage entry (St Martins staff or admin)

**Request:**
```json
{
  "title": "Local Charity Makes Impact",
  "publication_name": "The Daily News",
  "publication_date": "2025-10-28",
  "article_url": "https://dailynews.com/article",
  "summary": "Brief summary...",
  "thumbnail_url": "https://...",
  "organization_id": "uuid",
  "tags": ["community", "impact"],
  "is_featured": false
}
```

**Response:** `201 Created`

---

## 10. Upload API

### POST /api/upload
Upload file to storage

**Request:** `multipart/form-data`
```
file: (binary file data)
bucket: "avatars" | "posts" | "events" | "meeting-notes" | "media"
folder: (optional subfolder within bucket)
```

**Response:** `201 Created`
```json
{
  "data": {
    "file_name": "image.jpg",
    "file_url": "https://supabase-storage.../avatars/user-123-1234567890.jpg",
    "file_type": "image/jpeg",
    "file_size": 245678
  }
}
```

**Validation:**
- Max file size: 10 MB
- Allowed types:
  - Images: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
  - Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`
  - Text: `text/plain`, `text/csv`

---

## 11. Dashboard API

### GET /api/dashboard
Get dashboard data (highlights, stats)

**Response:** `200 OK`
```json
{
  "data": {
    "highlights": [
      {
        "type": "post",
        "id": "uuid",
        "title": "Fire Drill Today at 2 PM",
        "category": "announcement",
        "timestamp": "2025-11-03T08:00:00Z",
        "author": "Jane Smith",
        "is_pinned": true
      },
      {
        "type": "event",
        "id": "uuid",
        "title": "Cross-Charity Mixer",
        "timestamp": "2025-11-06T17:00:00Z",
        "organizer": "John Doe"
      }
    ],
    "latest_posts": [ /* 3 most recent posts */ ],
    "upcoming_events": [ /* 3 next events */ ],
    "recent_jobs": [ /* 2 latest job postings */ ],
    "lunch_menu_preview": {
      "today": "Soup & Salad",
      "tomorrow": "Taco Tuesday"
    },
    "stats": {
      "total_users": 87,
      "active_today": 23,
      "posts_this_week": 12,
      "upcoming_events_count": 8
    }
  }
}
```

---

### GET /api/dashboard/notifications
Get user notifications

**Query Params:**
- `unread_only` - Boolean (default: false)
- `limit` (default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "mention",
      "title": "John Doe mentioned you in a comment",
      "message": "Thanks for organizing @Jane!",
      "link": "/board/post-uuid",
      "is_read": false,
      "created_at": "2025-11-03T10:15:00Z"
    },
    {
      "id": "uuid",
      "type": "event_reminder",
      "title": "Event starting in 1 hour",
      "message": "Monday Partner Meeting at 10:00 AM",
      "link": "/calendar/event-uuid",
      "is_read": true,
      "created_at": "2025-11-03T09:00:00Z"
    }
  ],
  "unread_count": 5
}
```

---

### PATCH /api/dashboard/notifications/:id/read
Mark notification as read

**Response:** `200 OK`

---

### POST /api/dashboard/notifications/read-all
Mark all notifications as read

**Response:** `200 OK`

---

## 12. Error Handling

### Error Response Schema

```typescript
interface ErrorResponse {
  error: string;           // Human-readable message
  code: string;            // Machine-readable error code
  details?: {              // Optional additional context
    field?: string;        // Field that caused error (validation)
    constraints?: object;  // Validation constraints
    [key: string]: any;
  };
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Temporary outage |

### Example Error Responses

**Validation Error:**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "title",
    "constraints": {
      "min": 3,
      "max": 200
    }
  }
}
```

**Unauthorized:**
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**Forbidden:**
```json
{
  "error": "You don't have permission to create posts",
  "code": "FORBIDDEN",
  "details": {
    "required_role": "partner_staff",
    "current_role": "volunteer"
  }
}
```

---

## 13. Rate Limiting

### Limits by Role

| Role | Requests per Minute | Burst Limit |
|------|---------------------|-------------|
| Admin | Unlimited | N/A |
| St Martins Staff | 200 | 50 |
| Partner Staff | 100 | 30 |
| Volunteer | 60 | 20 |

### Rate Limit Headers

All responses include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698765432  (Unix timestamp)
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retry_after": 45  // Seconds until reset
  }
}
```

---

## API Versioning (Future)

Currently on v1 (implicit). Future versions will use URL prefix:
```
/api/v1/posts  (current, implicit)
/api/v2/posts  (future, explicit)
```

---

## Webhooks (Phase 2)

Future feature: Allow admins to configure webhooks for events like:
- New post created
- Event added to calendar
- New user registered
- Message sent in chat

---

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Next Review:** After Phase 1 API implementation
