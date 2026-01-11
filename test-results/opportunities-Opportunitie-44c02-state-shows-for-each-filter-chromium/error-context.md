# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - img [ref=e5]
    - generic [ref=e8]:
      - heading "404" [level=1] [ref=e9]
      - heading "Page not found" [level=2] [ref=e10]
      - paragraph [ref=e11]: The page you're looking for doesn't exist or has been moved.
    - generic [ref=e12]:
      - link "Go to Dashboard" [ref=e13] [cursor=pointer]:
        - /url: /dashboard
        - img
        - text: Go to Dashboard
      - button "Go back" [ref=e14] [cursor=pointer]:
        - img
        - text: Go back
  - region "Notifications (F8)":
    - list
  - alert [ref=e15]
```