# Ndunda App Documentation

## 1. Product Overview

Ndunda is a Namibia-focused property marketplace for tenants, buyers, property owners, agents, and administrators. The app helps users discover rental and sale properties, contact property publishers directly, save listings, list properties for free, and apply to become verified agents.

The product supports both mobile-first browsing and desktop usage. Mobile users get onboarding, language selection, city selection, and bottom-tab navigation. Desktop users get a wider layout with a top navigation bar, richer search header, and grid-based property browsing.

## 2. Target Users

- Tenants and buyers looking for rooms, apartments, houses, plots, offices, commercial spaces, student accommodation, guesthouses, and short-stay rentals in Namibia.
- Property owners who want to publish listings without paying a listing fee.
- Verified agents who need a public profile, listing management, and direct contact channels.
- Administrators who review agent applications, moderate listings, manage users, and maintain listing quality.

## 3. Technology Stack

- Frontend: React 18, TypeScript, Vite.
- Routing: React Router.
- Styling: Tailwind CSS with shadcn-ui/Radix UI primitives.
- Icons: lucide-react.
- Authentication: Clerk.
- Backend and database: Convex.
- Client data cache: Convex live queries plus localStorage-backed cached values.
- Forms and validation utilities: React Hook Form, Zod, and local form validation.
- Notifications: Sonner and shadcn toast components.
- Deployment target: Vercel, with SPA routing through `vercel.json`.

## 4. App Structure

Key directories:

- `src/pages`: route-level screens such as Home, Property View, Profile, Admin, Agents, Add Listing, and onboarding pages.
- `src/components`: reusable UI, layout, home, booking, auth, and profile components.
- `src/hooks`: Convex data hooks, local cache utilities, user profile hooks, toast hooks, and mobile helpers.
- `src/contexts`: shared app state, currently language, selected city, and listing mode.
- `src/i18n`: translation catalogs and Namibia city data.
- `src/types`: shared TypeScript models.
- `convex`: database schema, queries, mutations, auth config, and generated Convex API files.
- `public`: product imagery, city images, category images, logo, favicon, and static assets.

## 5. Routing Map

Public routes:

- `/`: Home, search, categories, recommended listings, nearby CTA, and featured agents.
- `/onboarding`: Mobile onboarding slides.
- `/select-language`: Language selection.
- `/choose-city`: City, suburb, manual address, or nearest-city selection.
- `/login/*`: Clerk login and sign-up screen.
- `/search`: Redirects to `/` while preserving query parameters.
- `/property/:id`: Full property details page.
- `/agents`: Verified agents directory.
- `/agents/:id`: Public agent profile and active listings.
- `/profile`: Guest profile prompt or signed-in user/agent/admin profile.
- `/help`: Support contacts and FAQ.
- `/nearby`: Geolocation-based nearby property scan.
- `*`: Not found page.

Protected routes:

- `/add-listing`: Create a property listing.
- `/my-listings`: Manage listings owned by the signed-in user.
- `/agent-dashboard`: Agent/admin listing dashboard.
- `/admin`: Admin operations dashboard.
- `/become-agent`: Agent application form.
- `/saved` and `/saved-properties`: Saved listings.
- `/notifications`: Notification center.
- `/settings`: Account and preference settings.

## 6. Authentication and Authorization

Authentication is handled by Clerk. Convex uses Clerk-issued JWTs to identify users on the backend.

The app synchronizes authenticated Clerk users into the Convex `users` table through `UserSync` and `api.users.store`.

User roles:

- `customer`: default signed-in user role.
- `agent`: approved property agent role.
- `admin`: administrator role.

Admin recognition:

- Users can have role `admin` in Convex.
- Built-in or configured admin emails are also treated as admins.
- The built-in admin email is `yammertaurus@gmail.com`.
- Additional admins can be configured through Convex `ADMIN_EMAILS`.

Protected routes use `ProtectedRoute`, which redirects unauthenticated users to `/login` and returns them to the originally requested path after sign-in.

## 7. Data Model

### Users

The `users` table stores:

- Clerk identity fields: token identifier, Clerk user ID, email, avatar.
- Profile fields: full name, phone, WhatsApp, cover photo, location, bio.
- Agent fields: agency name, specialty, agent documents, application status, applied/reviewed timestamps.
- Role: `customer`, `agent`, or `admin`.
- Created and updated timestamps.

Indexes:

- `by_token`
- `by_clerk_user`
- `by_role`
- `by_agent_status`

### Properties

The `properties` table stores:

- Ownership: `ownerId`.
- Main listing content: title, description, location, full address.
- Category: room, house, plot, apartment, guesthouse, hotel, lodge, camp, lodges-camps, office-space, student-accommodation, commercial, airbnb, mbashu.
- Listing purpose: `buy` or `rent`.
- Rental type: `long-term` or `short-term`.
- Price and property facts: price, bedrooms, bathrooms, size.
- Images: Convex storage IDs, URLs, or legacy data URLs.
- Quality and lifecycle flags: verified, recommended, active/pending/sold/rented/inactive, new.
- Long-term rental fields: available date, deposit, lease term, pets allowed, furnished.
- Short-term rental fields: daily/weekly/monthly prices, minimum stay, max guests, cleaning fee, check-in/check-out, instant book, cancellation policy.
- Views and timestamps.

Indexes:

- `by_owner`
- `by_owner_status`
- `by_status`
- `by_listing_mode`
- `by_type`

### Saved Properties

The `savedProperties` table stores user-to-property saves.

Indexes:

- `by_user`
- `by_user_property`

## 8. Design System

The design is defined through Tailwind tokens in `src/index.css`, Tailwind extensions in `tailwind.config.ts`, and typography rules in `DESIGN_SYSTEM.md`.

### Visual Identity

- Primary color: green, using HSL token `142 71% 45%`.
- Background: light neutral off-white.
- Cards: white surfaces with subtle borders and card shadows.
- Accent states: green for success/verification, amber for pending/warning, red for destructive actions.
- Typography: Plus Jakarta Sans with system fallbacks.
- Corner radius: rounded UI with a base radius of `1rem`, extended into xl/2xl variants.
- Shadows: lightweight card, soft, and lifted shadows for depth.

### Layout Principles

- Mobile-first app container with a max-width feel on phones.
- Desktop expands to full width with a maximum content width of `7xl`.
- Bottom navigation on mobile.
- Fixed top navigation on desktop.
- Safe bottom padding to avoid mobile bottom nav overlap.
- Scrollbar hiding for a native-app feel on mobile.

### Navigation Design

Mobile bottom nav includes:

- Home.
- Saved properties.
- Add listing.
- Agents.
- Profile.

Desktop top nav includes:

- Home.
- Agents.
- List Property.
- Saved Properties.
- Admin, only for admin users.
- Notifications icon.
- Profile avatar.

### Typography

The app uses a responsive typography scale:

- Page headings: `text-2xl md:text-3xl lg:text-4xl`.
- Section headings: `text-xl md:text-2xl lg:text-3xl`.
- Card titles: `text-base md:text-lg`.
- Body text: `text-base`.
- Secondary text: `text-sm md:text-base`.
- Captions and badges: `text-xs md:text-sm`.

## 9. Internationalization and Location

The app supports these languages:

- English.
- Afrikaans.
- German.
- Oshiwambo.
- Rukwangali.

Language, selected city, setup completion, and listing mode are stored in localStorage.

Location selection supports:

- Popular Namibia cities.
- A larger list of Namibia cities.
- Suburb/area selection for selected cities.
- Manual address entry.
- Browser geolocation to select the nearest supported city.

Supported city examples:

- Windhoek.
- Walvis Bay.
- Swakopmund.
- Oshakati.
- Rundu.
- Katima Mulilo.
- Otjiwarongo.
- Keetmanshoop.
- Gobabis.
- Tsumeb.
- Okahandja.
- Ondangwa.

## 10. First-Time User Flow

On mobile, users who have not completed setup are guided through:

1. Onboarding slides explaining discovery, home search, and property access.
2. Language selection.
3. City or location selection.
4. Home page.

Desktop users are sent directly to the main app and are not forced through the mobile setup flow.

## 11. Home and Search Features

The home page is the main discovery screen.

Features:

- City display with link to city selector.
- Buy/rent mode switch.
- Search input backed by URL query parameters.
- Advanced filters in a sheet/drawer.
- Category browsing.
- Recommended listings.
- Featured agents.
- Nearby scan CTA.
- Mobile list cards and desktop grid cards.

Search filters:

- Query text.
- Listing mode: buy or rent.
- Property type.
- Minimum price.
- Maximum price.
- Bedrooms.
- Bathrooms.
- Rental type: long-term or short-term.
- Verified-only toggle.

Search supports aliases and typo-tolerant category matching for common property terms such as houses, flats, apartments, plots, offices, student rooms, lodges, camps, guesthouses, and mbashu/ghetto.

## 12. Property Categories

Supported listing categories:

- House.
- Apartment.
- Plot.
- Room.
- Guest House.
- Office Space.
- Student Accommodation.
- Commercial.
- Ghetto/Mbashu.
- Vacation Rental/Airbnb.
- Hotel.
- Lodge.
- Camp.
- Lodges and Camps.

Mode rules:

- Buy mode supports houses, apartments, plots, and commercial listings.
- Rent mode supports rental housing, rooms, guesthouses, offices, student accommodation, commercial listings, mbashu, and vacation rentals.
- Office Space is rent-only in the backend.

## 13. Property Detail Page

The property detail page displays a full listing experience.

Features:

- Image carousel.
- Image thumbnails.
- Back navigation.
- Save/unsave property.
- Share using the browser share API or clipboard fallback.
- Title, address, price, listing mode, and rental type.
- Bedrooms, bathrooms, and size.
- Verification badge.
- Long-term rental details: deposit, available date, lease term, furnished status.
- Short-term rental details: daily/weekly pricing, check-in, check-out, max guests, minimum stay.
- Description tab.
- Amenities tab.
- Location tab.
- Optional Google Street View embed through `VITE_GOOGLE_MAPS_API_KEY`.
- Google Maps directions link.
- Reviews tab layout.
- Owner/agent card.
- Phone and WhatsApp contact actions.
- Schedule viewing dialog for long-term rentals.
- Booking widget area for short-term rentals.

Implementation note:

- Viewing scheduling is persisted to Convex as viewing requests and creates an owner notification.
- Reviews are persisted to Convex and users can add or update their review from the property page.
- Short-term booking requests are persisted to Convex and create requester/owner notifications.

## 14. Saved Properties

Signed-in users can save and unsave properties.

Features:

- Save button on property detail page.
- Saved list page.
- Filter saved listings by all, buy, or rent.
- Empty state with link back to browsing.

Saved properties are stored in Convex through the `savedProperties` table.

## 15. Add Listing

Signed-in users can publish listings.

Features:

- Listing purpose switch: Rent or Sell.
- Category selection based on listing purpose.
- Image upload to Convex storage.
- Up to 6 listing photos.
- Image resizing before upload.
- Image file validation.
- Title, location, price, bedrooms, bathrooms, size, and description fields.
- Long-term rental pricing.
- Sale pricing.
- Short-term pricing: daily, weekly, monthly.
- Short-term settings: minimum stay, max guests, check-in, check-out, cleaning fee, cancellation policy, instant booking.
- Free listing information.
- Redirect to My Listings after successful publish.

Backend behavior:

- Agent/admin listings are verified automatically.
- Customer listings are not automatically verified.
- New listings default to active.
- Recommended defaults to false.
- Long-term rental listings default deposit to the monthly price and lease term to 12 months.

## 16. My Listings

Signed-in users can manage their own listings.

Features:

- Listing count.
- Add listing shortcut.
- Grid of owned listings.
- Status badge.
- Views badge.
- Delete listing action.
- Edit button placeholder in the UI.

Implementation note:

- Delete is connected to Convex.
- Edit listing routes to `/edit-listing/:id` and reuses the listing form with existing property details.

## 17. Agents Directory

The agents page lists approved Convex users with role `agent`.

Features:

- Verified agent cards.
- Agent avatar or fallback icon.
- Specialty.
- Location.
- Listing count.
- WhatsApp contact.
- Phone call contact.
- Link to public agent profile.
- CTA to become an agent.
- Local cache for agents data.

## 18. Agent Public Profile

Each agent has a public profile at `/agents/:id`.

Features:

- Verified badge.
- Profile photo.
- Specialty.
- Bio.
- Agency name.
- Area.
- Email.
- WhatsApp and call actions.
- Active listing count.
- Grid of active listings owned by the agent.
- Empty state when no active listings exist.

## 19. Become an Agent

Signed-in users can apply to become verified agents.

Features:

- Benefit summary.
- Full name.
- Phone.
- Email display.
- Operating area.
- Agency name.
- Specialty.
- WhatsApp number.
- Experience/bio.
- Required ID document upload.
- Optional business registration upload.
- Optional tax certificate upload.
- Terms confirmation.
- Application submission to Convex.

Validation:

- Required personal and profile fields must be completed.
- ID document is required.
- Either agency name or business registration is required.
- Documents must be under 2.5MB.

After submission:

- User agent status becomes `pending`.
- Admin reviews the application from the Admin Dashboard.

## 20. Agent Dashboard

Approved agents and admins can access the Agent Dashboard.

Features:

- Approved agent header.
- Add Listing and My Listings shortcuts.
- Active listings count.
- Pending/non-active listings count.
- Total views count.
- New leads placeholder.
- Listing performance preview.
- Profile readiness score.
- Agent details panel.
- Profile checklist.
- WhatsApp leads, phone calls, and performance placeholder cards.

Implementation note:

- Views are stored on property records, but automatic view incrementing is not currently visible in the inspected property detail flow.
- Lead tracking now counts persisted viewing requests and booking requests. WhatsApp/call conversion analytics are still future-ready.

## 21. Profile

The profile page adapts to guest, customer, agent, and admin users.

Guest users:

- Guest profile card.
- Sign in button.
- Register button.
- Continue browsing is available through the normal app navigation.

Customers:

- Avatar/profile details.
- Edit profile dialog.
- Agent application CTA.
- Settings, notifications, and help links.
- Sign out action.

Agents:

- Public-style profile header.
- Cover photo support.
- Avatar.
- Bio, agency, specialty, and location facts.
- Contact details.
- Active listing stats.
- Agent listing preview.
- Manage listings shortcut.
- Public view shortcut.
- Add listing shortcut.

Admins:

- Admin badge.
- Admin dashboard link.
- Agent-style profile presentation where applicable.

Profile editing supports:

- Full name.
- Phone.
- WhatsApp.
- Location.
- Avatar through Clerk profile image.
- Cover photo through Convex storage for agents/admins.
- Agent-only fields: agency name, specialty, bio.

## 22. Admin Dashboard

Admins can access `/admin`.

Features:

- Admin-only access guard.
- Clerk/Convex auth diagnostics.
- Current user sync action.
- Stats cards:
  - Users.
  - Agents.
  - Pending agents.
  - Listings.
  - Portfolio value.
- Search across users, listings, locations, and emails.
- Role filter.
- Listing status filter.
- Agent Review tab.
- Users tab.
- Listings tab.

Agent review:

- View pending applications.
- Inspect uploaded documents.
- Approve agent.
- Reject application.

User management:

- List users.
- View profile details.
- Change roles between customer, agent, and admin.

Listing moderation:

- View listing image, title, location, type, owner, price, and status.
- Change listing status.
- Verify or unverify listing.
- Recommend or unrecommend listing.
- Remove listing.

Storage maintenance:

- Backend functions exist for reporting and clearing legacy base64 images from users and properties.

## 23. Nearby Scan

The nearby scan feature uses the browser geolocation API.

Features:

- Request user location.
- Error handling for denied, unavailable, timeout, and unsupported geolocation.
- Search radius controls: 5km, 10km, 15km, 20km, 25km.
- Distance calculation with the Haversine formula.
- Property cards sorted by distance.
- Open current location in Google Maps.

Implementation note:

- Property listings support optional latitude and longitude fields. Nearby scanning works for listings where coordinates have been added.

## 24. Settings

Settings features:

- Edit profile link.
- Change password link to Clerk login flow.
- Phone number link to profile.
- Notifications toggle.
- Language selection link.
- Dark mode toggle UI.
- App version display.

Implementation note:

- The notification preference toggle is local UI state in this screen.
- Dark mode persists in localStorage and is applied on app startup.

## 25. Notifications

The notifications page shows a static notification center design.

Features:

- Unread count.
- Mark all read button UI.
- Listing, saved-property, and agent notification types.
- Read/unread styling.
- Empty state.

Implementation note:

- Notifications are persisted in Convex and can be marked read from the notifications page.

## 26. Help and Support

Help page features:

- WhatsApp support link.
- Phone support link.
- Email support link.
- FAQ accordion.
- Terms of Service link.
- Privacy Policy link.

Current FAQ topics:

- Listing a property.
- Becoming a verified agent.
- Tenant fees.
- Virtual viewings.
- Reporting suspicious listings.

Implementation note:

- `/terms` and `/privacy` routes are registered with app-level legal content pages.

## 27. Short-Term Booking Features

The booking components support short-term stay UI.

Features:

- Check-in and check-out selection.
- Guest count.
- Minimum stay validation.
- Maximum guest validation.
- Daily, weekly, or monthly pricing.
- Cleaning fee.
- Service fee calculated as 10% of subtotal.
- Total calculation.
- Instant booking vs request-to-book messaging.
- Cancellation policy display.

Implementation note:

- Booking records are stored in Convex.
- The widget uses a default one-year availability window when a property does not provide explicit availability data.

## 28. Contact and Lead Actions

The app provides direct owner/agent contact flows.

Supported actions:

- Phone calls through `tel:` links.
- Email inquiries through `mailto:` links.
- WhatsApp messages through `wa.me` links.
- Property share using browser share or clipboard.
- Google Maps directions from property detail.

Default WhatsApp messages are generated from the context, such as property interest or agent directory contact.

## 29. Caching and Loading Behavior

The app combines Convex live queries with a local cache helper.

Cached areas include:

- Property lists.
- Search results.
- Single property records.
- Owner properties.
- User profile.
- Agents list.

Benefits:

- Reduces empty loading states after previous visits.
- Keeps screens usable while Convex refetches.
- Improves mobile perceived speed.

Loading states are provided through spinners, empty states, and cached fallback values.

## 30. Environment Variables

Frontend variables:

- `VITE_CONVEX_URL`: Convex deployment URL.
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key.
- `VITE_GOOGLE_MAPS_API_KEY`: Optional, enables Street View embeds on property pages.

Convex variables:

- `CLERK_JWT_ISSUER_DOMAIN`: Clerk issuer domain required for Convex auth.
- `ADMIN_EMAILS`: comma-separated admin email allowlist.

Clerk requirement:

- A Clerk JWT template named `convex` must exist.

## 31. Development Commands

Install dependencies:

```sh
npm install
```

Run Convex:

```sh
npx convex dev
```

Run Vite:

```sh
npm run dev
```

Build:

```sh
npm run build
```

Lint:

```sh
npm run lint
```

Preview production build:

```sh
npm run preview
```

## 32. Deployment Notes

The app is prepared for Vercel deployment.

Vercel settings:

- Framework preset: Vite.
- Install command: `npm install`.
- Build command: `npm run build`.
- Output directory: `dist`.

The repository includes `vercel.json` for single-page app routing.

For production auth:

- Configure Clerk production domain.
- Configure Convex production environment variables.
- Use a custom domain for Clerk production auth where required.

## 33. Current Limitations and Future Work

Remaining future work:

- Automatic property view incrementing is not currently visible in the inspected property detail flow.
- WhatsApp and phone inquiry conversion analytics are not implemented.
- Notification preferences are local UI state and are not stored per user in Convex.
- Booking payment collection, calendar blocking, cancellation workflows, and owner approval management can be expanded.
- Review moderation/reporting can be added for stronger marketplace safety.

## 34. Summary of Major Features

- Mobile onboarding.
- Language selection.
- Namibia city and suburb selection.
- Buy/rent mode.
- Property search.
- Advanced filters.
- Property categories.
- Recommended listings.
- Verified agents directory.
- Property detail pages.
- Image carousel.
- Save properties.
- Share listings.
- Direct phone, email, and WhatsApp contact.
- Optional Google Street View.
- Listing creation with image upload.
- Long-term and short-term listing support.
- Saved properties page.
- User profile.
- Profile editing.
- Agent application.
- Agent approval workflow.
- Public agent profiles.
- Agent dashboard.
- My listings management.
- Admin dashboard.
- User role management.
- Listing moderation.
- Nearby scan.
- Settings.
- Notifications screen.
- Help and FAQ screen.
- Clerk authentication.
- Convex backend.
- Local cached query data.
