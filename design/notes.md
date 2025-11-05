# Design References

This folder holds design-system artifacts and layout skeletons that you can copy into live routes as needed. Nothing here is imported by default in the application.

## System Tokens

- `design/system/tailwind.config.example.ts` mirrors your desired Tailwind theme extension. Copy the `extend` block (or replace your project config entirely) when you are ready to apply the full palette, shadows, and animations.
- `design/system/theme.css` defines the CSS variables for the light and dark themes. Import this file instead of `src/index.css` if you want the warm “Community Hub” aesthetic in a new project.

**How to use**
1. Replace the root `tailwind.config.ts` `theme.extend` with the version from the example file.
2. Import `@/design/system/theme.css` (or copy its contents into `src/app/globals.css`) to register the CSS variables.
3. Restart the Tailwind process so the new tokens are available.

## Layout Shell

- `design/layout/dashboard-shell.tsx` exports the sidebar primitives and a `DashboardShellDemo` page showing the priority notices + featured event layout you referenced.
- Components are organised so you can cherry-pick pieces:
  - `Sidebar`, `SidebarBody`, `SidebarLink` for navigation.
  - `PriorityNoticeCard`, `FeaturedEventCard`, and associated data for the dashboard hero section.

**How to use**
1. Copy the components you need into `src/components/dashboard/` (keep `"use client";` for the ones using hooks).
2. Replace the mock data arrays with calls to your real data loaders.
3. Wire the pieces together inside `app/dashboard/page.tsx`.

## Next Steps

- Once Community Board, Events, and Jobs features are live, revisit the design system to confirm the tokens still support the real data.
- Consider creating Storybook or Playroom entries to preview each pattern in isolation before rolling them out broadly.
