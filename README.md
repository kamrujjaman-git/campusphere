# 🎓 Campusphere

> **Empowering Campus Communities & University Clubs**  
> A modern, multi-tenant SaaS platform built to seamlessly organize, manage, and scale university-centric organizations, events, finances, and members.

---

## 🌟 Overview

**Campusphere** is an all-in-one community management ecosystem designed for higher education institutions. Whether it's managing student clubs, organizing university events, tracking transparent financial transactions, or maintaining member databases—Campusphere unifies campus life into one sleek, fully responsive web application.

---

## ✨ Key Features

### 🏛️ Multi-Tenant Architecture
* **Isolated Communities:** Distinct spaces for different university clubs and organizations.
* **Smart Domain Verification:** Instant auto-extraction and strict client/server validation for official `.edu` and `.edu.bd` university emails.
* **Exact-Case Keys:** Unique `community_key` persistence for reliable tenant scoping and routing.

### 👥 Access Control & Role Management
* **Platform Owner Portal:** Global administrative bypass for managing all communities, approving invite codes, monitoring overall system activity, and overriding tenant scopes seamlessly.
* **Community Admins & Executive Controls:** Granular permission layers for managing local events, tracking finances, and issuing dynamic membership roles.
* **Member Management:** Comprehensive member directory with custom profile tracking, role assignments, and search/filter actions.

### 💰 Financial Management & Transparency
* **Transaction Ledger:** Track income, expenses, and club funds with precision.
* **Audit Logs:** Immutable record keeping for clear organizational accountability.

### 📅 Event Management & Interactive Feed
* **Event Creation & Detail Pages:** Schedule, edit, and publish upcoming campus events.
* **Announcements & Updates:** Centralized community updates visible to all registered members.

### 🎨 Modern UI & Profile Personalization
* **Responsive Design:** Optimized experience across mobile, tablet, and desktop screens.
* **Storage Integration:** Integrated image uploads for member avatars and custom community branding via Supabase Storage.

---

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router, Server Components, Server Actions)
* **Language:** TypeScript
* **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Storage Buckets, OAuth)
* **Authentication:** Google OAuth 2.0 & Email/Password
* **Styling:** Tailwind CSS, Lucide React (Icons), Shadcn UI Components
* **Deployment:** Vercel

---

📜 License
This project is proprietary software developed for managing campus communities worldwide. All rights reserved.