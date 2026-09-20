# QMap — User Manual

**Personal Ambient Noise & Focus Cartographer**  
**Version:** 1.0.0  
**Application Type:** Multi-User Web Application with Secure Authentication (React 18 + FastAPI + PostgreSQL)  

---

## Table of Contents

1. [Introduction](#1-introduction)
   - [What is QMap?](#what-is-qmap)
   - [Core Purpose and Philosophy](#core-purpose-and-philosophy)
   - [Who Should Use QMap?](#who-should-use-qmap)
   - [Key Capabilities](#key-capabilities)
2. [System Requirements](#2-system-requirements)
   - [Supported Web Browsers](#supported-web-browsers)
   - [Audio Hardware & Microphone](#audio-hardware--microphone)
   - [Network & Security Protocols](#network--security-protocols)
   - [User Account Requirements](#user-account-requirements)
3. [Getting Started](#3-getting-started)
   - [Opening QMap & Authentication](#opening-qmap--authentication)
   - [The 3-Step Onboarding Walkthrough](#the-3-step-onboarding-walkthrough)
   - [Granting Microphone Permissions](#granting-microphone-permissions)
   - [Your First Focus Session](#your-first-focus-session)
4. [Application Interface Tour](#4-application-interface-tour)
   - [Sidebar Navigation](#sidebar-navigation)
   - [Dashboard](#dashboard)
   - [Focus Map](#focus-map)
   - [Timeline](#timeline)
   - [Insights](#insights)
   - [Settings](#settings)
5. [Ambient Noise Monitoring](#5-ambient-noise-monitoring)
   - [How Audio Measurement Works](#how-audio-measurement-works)
   - [The 0–100 Relative Noise Scale](#the-0100-relative-noise-scale)
   - [Sampling and Persistence Telemetry](#sampling-and-persistence-telemetry)
   - [Starting and Pausing Monitoring](#starting-and-pausing-monitoring)
   - [What is Stored vs. What is Never Stored](#what-is-stored-vs-what-is-never-stored)
6. [Focus Sessions](#6-focus-sessions)
   - [What is a Focus Session?](#what-is-a-focus-session)
   - [Selecting a Workspace Location](#selecting-a-workspace-location)
   - [Defining Your Activity](#defining-your-activity)
   - [Starting and Tracking a Live Session](#starting-and-tracking-a-live-session)
   - [Ending a Session & Focus Score Summary](#ending-a-session--focus-score-summary)
   - [Session Editing and Notes Capabilities](#session-editing-and-notes-capabilities)
7. [Acoustic Interruptions & Spike Detection](#7-acoustic-interruptions--spike-detection)
   - [What Constitutes an Interruption?](#what-constitutes-an-interruption)
   - [The Adaptive Baseline & Rise Threshold](#the-adaptive-baseline--rise-threshold)
   - [How Spikes are Represented in the Interface](#how-spikes-are-represented-in-the-interface)
   - [Impact on Focus Metrics](#impact-on-focus-metrics)
8. [Dashboard & Productivity Metrics](#8-dashboard--productivity-metrics)
   - [Current Atmosphere & Noise Gauge](#current-atmosphere--noise-gauge)
   - [Sessions Today](#sessions-today)
   - [Acoustic Shifts](#acoustic-shifts)
   - [Average Focus Score](#average-focus-score)
   - [The Dynamic Insight Strip](#the-dynamic-insight-strip)
9. [Focus Map (Workspaces)](#9-focus-map-workspaces)
   - [Understanding Workspaces](#understanding-workspaces)
   - [Adding a New Workspace](#adding-a-new-workspace)
   - [Editing & Renaming Workspaces](#editing--renaming-workspaces)
   - [Deleting a Workspace](#deleting-a-workspace)
   - [Quick Launch: "Focus Here"](#quick-launch-focus-here)
10. [Timeline & Historical Telemetry](#10-timeline--historical-telemetry)
    - [Interactive Acoustic Signal Graph](#interactive-acoustic-signal-graph)
    - [Selecting Time Ranges (12h, 24h, 7d)](#selecting-time-ranges-12h-24h-7d)
    - [Data Aggregation & Downsampling](#data-aggregation--downsampling)
    - [Point Inspection & Telemetry Callouts](#point-inspection--telemetry-callouts)
11. [Insights & 7-Day Retrospective](#11-insights--7-day-retrospective)
    - [Data Readiness Requirements](#data-readiness-requirements)
    - [Your Quietest Window](#your-quietest-window)
    - [Optimal Workspace](#optimal-workspace)
    - [Emerging Acoustic Shifts](#emerging-acoustic-shifts)
    - [The 7-Day Retrospective Chart](#the-7-day-retrospective-chart)
    - [Quickstart Demo Data Seeding](#quickstart-demo-data-seeding)
12. [Settings & Preferences](#12-settings--preferences)
    - [User Profile & Display Name](#user-profile--display-name)
    - [Timezone Configuration & Automatic Sync](#timezone-configuration--automatic-sync)
    - [Visual Theme Preferences (Light, Dark, System)](#visual-theme-preferences-light-dark-system)
    - [Live Monitoring Active Toggle](#live-monitoring-active-toggle)
    - [Sampling Interval (Telemetry Frequency)](#sampling-interval-telemetry-frequency)
    - [Interruption Rise Threshold](#interruption-rise-threshold)
    - [Purge All Data (Complete Factory Reset)](#purge-all-data-complete-factory-reset)
13. [Privacy Architecture & Data Handling](#13-privacy-architecture--data-handling)
    - [Zero Audio Storage Guarantee](#zero-audio-storage-guarantee)
    - [Client-Side Processing (Web Audio API)](#client-side-processing-web-audio-api)
    - [Backend Data Structure](#backend-data-structure)
    - [Microphone Permissions Transparency](#microphone-permissions-transparency)
14. [Troubleshooting Guide](#14-troubleshooting-guide)
    - [Microphone Permission Denied or Blocked](#microphone-permission-denied-or-blocked)
    - [Microphone Reading Remains Flat / Zero](#microphone-reading-remains-flat--zero)
    - [Dashboard Fails to Load or Shows Network Error](#dashboard-fails-to-load-or-shows-network-error)
    - [Insights Page Shows "Still Learning Your Routine"](#insights-page-shows-still-learning-your-routine)
    - [Sessions Fail to End or Report Conflict](#sessions-fail-to-end-or-report-conflict)
    - [Purging Data Does Not Clear Immediately](#purging-data-does-not-clear-immediately)
15. [Frequently Asked Questions (FAQ)](#15-frequently-asked-questions-faq)
16. [Security & Privacy Recommendations](#16-security--privacy-recommendations)
17. [Data Interpretation Guide](#17-data-interpretation-guide)
18. [Glossary of Terms](#18-glossary-of-terms)
19. [Known Limitations](#19-known-limitations)
20. [Planned / Future Features](#20-planned--future-features)
21. [Appendix A — Admin & Deployment Guide](#21-appendix-a--admin--deployment-guide)

---

## 1. Introduction

### What is QMap?
**QMap** (QuietMap) is a privacy-first ambient noise and personal focus cartographer. Designed as a modern multi-user web application with secure personal authentication, QMap continuously measures the acoustic atmosphere of your physical environment and correlates environmental calmness with your dedicated focus sessions.

### Core Purpose and Philosophy
Most productivity and focus tools judge you: they track keystrokes, monitor screen time, or flag idle minutes. QMap approaches focus from an entirely different philosophy:

> **"Evaluate the quality of your environment, not your personal cognitive worth."**

QMap operates on the principle that deep focus requires acoustic stability. By observing environmental volume, noise spikes, and workspace trends without recording audio, QMap helps you discover:
- Which hours of your day provide natural, uninterrupted quiet.
- Which physical workspaces (e.g., home desk, campus library, corner office) offer the highest acoustic stability.
- When sudden noise disturbances break your sustained concentration.

### Who Should Use QMap?
- **Knowledge Workers & Engineers:** Programmers, writers, researchers, and designers who need sustained blocks of deep concentration.
- **Students & Academics:** Anyone studying in varied locations (libraries, coffee shops, dorms, shared flats) seeking optimal study spots.
- **Remote & Hybrid Professionals:** Workers trying to identify noisy periods in their home or co-working spaces to better schedule deep work vs. administrative tasks.
- **Privacy-Conscious Individuals:** Users who want environmental insights without having smart speakers, cloud voice assistants, or corporate trackers listening to their rooms.

### Key Capabilities
- **Local Audio Analysis:** Evaluates room loudness directly in your browser using the HTML5 Web Audio API.
- **Zero Raw Audio Transmission:** Sound is instantly converted into numeric decibels; raw audio is immediately discarded from device memory.
- **Workspace Focus Mapping:** Profile physical locations over time to see their average noise, interruption frequency, and Focus Score.
- **Acoustic Spike Detection:** Identifies sudden decibel surges above your rolling room baseline.
- **Adaptive Timeline:** Visually scrub across 12-hour, 24-hour, and 7-day noise graphs.
- **Personal Account Isolation:** Secure, privacy-first authentication ensuring all focus sessions, workspace profiles, and noise telemetry remain private and isolated to your account.

---

## 2. System Requirements

### Supported Web Browsers
QMap relies on the standardized **HTML5 Web Audio API** and **MediaStream Recording API**. Supported browsers include:
- **Google Chrome / Chromium:** Version 90 or newer (Desktop recommended)
- **Mozilla Firefox:** Version 88 or newer
- **Apple Safari:** Version 14.1 or newer (macOS / iPadOS)
- **Microsoft Edge:** Version 90 or newer
- **Brave / Opera / Vivaldi:** Any modern Chromium-based release

> [!NOTE]
> Private / Incognito browser windows are supported, but you must grant microphone permission each session since incognito windows do not persist device authorizations.

### Audio Hardware & Microphone
- Any functional audio input device:
  - Built-in laptop microphone
  - External USB desktop microphone
  - Headset microphone (wired 3.5mm, USB, or Bluetooth)
  - Web camera integrated microphone
- High-fidelity studio microphones are **not required**. Standard built-in laptop microphones are fully sufficient.

### Network & Security Protocols
- **HTTPS Connection (Production):** Web browsers strictly require a secure origin (`https://` or `http://localhost`) to access microphone hardware.
- **Stable Internet Connection:** When using the hosted cloud deployment, a continuous low-bandwidth connection is required to transmit small numeric telemetry payloads (roughly 150 bytes every 10 seconds).

### User Account Requirements
- **Account Registration:** QMap provides personal, password-protected user accounts. Each user's focus sessions, workspace locations, ambient noise samples, and configuration preferences are strictly private and isolated.
- **Password Standards:** Passwords must be at least 8 characters (up to 128 characters) and include both letters and numbers.
- **Session Security:** Browser authentication uses secure, `HttpOnly` cookie-backed sessions. Passwords and secret tokens are never stored in browser memory or client scripts.

---

## 3. Getting Started

### Opening QMap & Authentication
1. Launch your web browser.
2. Navigate to your deployed QMap URL (e.g., `https://your-qmap-app.vercel.app`) or local development address (`http://localhost:5173`).
3. **Sign In or Create an Account**:
   - If you do not have an account, click **Create Account**, enter your full name (2–100 characters), email address, and create a secure password. Click **Create My Account**.
   - If you already have an account, enter your email and password and click **Sign In**.
4. Once authenticated, QMap loads your private workspace data. If visiting for the first time, QMap presents the **Onboarding Walkthrough**.

---

### The 3-Step Onboarding Walkthrough

The initial setup consists of three short screens:

```
[ Step 1: Welcome ]  ──>  [ Step 2: Privacy & Mic ]  ──>  [ Step 3: Default Activity ]  ──>  [ Dashboard ]
```

#### Step 1: Welcome to Your Focus Cartographer
- Introduces QMap's purpose.
- Click **Continue** to move to the privacy screen.

#### Step 2: Privacy by Design & Microphone Permission
- Explains that QMap measures relative volume levels only and never records speech.
- Click **Allow Microphone**.
- Your browser will display its native permission prompt: *"Allow QMap to use your microphone?"*
- Select **Allow** (or **Allow while using the app**).
- When granted, a green confirmation banner confirms: *"Microphone permission active. Ready for live ambient metering."*
- Click **Continue**. (You may also choose *Continue without Monitoring* if you wish to use the app in read-only mode).

#### Step 3: Context Preference
- Select your primary type of focus work from the preset buttons:
  - **Deep Work** (Default)
  - **Coding**
  - **Writing**
  - **Reading**
  - **Study**
  - **Design**
  - **Meeting**
  - **Other**
- Click **Open Your Map**.

Your preference is saved locally, and you are immediately taken to your primary **Dashboard**.

---

### Granting Microphone Permissions

If your browser did not prompt you, or if you accidentally blocked access:

| Browser | How to Re-Enable Access |
| :--- | :--- |
| **Chrome / Edge** | Click the **Tune / Padlock icon** on the left side of the address bar. Set **Microphone** to **Allow**, then refresh the page. |
| **Firefox** | Click the **Permissions icon** (left of URL bar). Clear the blocked microphone permission, then reload and accept the prompt. |
| **Safari (macOS)** | Open **Safari** > **Settings** > **Websites** > **Microphone**. Locate the QMap domain and select **Allow**. |

---

### Your First Focus Session

To record your first focus block:
1. On the **Dashboard**, locate the **Focus Session** card (right side).
2. Choose your workspace under **Workspace Location** (e.g., "Desk" or "Library"). If none exists, click *+ Add your first workspace in Focus Map*.
3. Type or choose what you are working on under **Working On** (e.g., "Deep Work").
4. Click **Start Focus Session**.
5. The digital elapsed timer begins counting up immediately, and ambient monitoring activates automatically.

---

## 4. Application Interface Tour

QMap's interface is organized into five primary pages accessible via the persistent left-hand sidebar:

```
┌─────────────────┬────────────────────────────────────────────────────────┐
│  QUIETMAP       │ Good morning.                                          │
│                 │ Your Environment Today        [ Turn Monitoring On ]   │
│  [■] Dashboard  ├────────────────────────────┬───────────────────────────┤
│  [⌕] Focus Map  │ CURRENT ATMOSPHERE         │ FOCUS SESSION             │
│  [∿] Timeline   │ Quiet (32 / 100)           │ Deep Work (00:24:18)      │
│  [✦] Insights   │ [ ◯ Live Noise Gauge ]    │ Location: Desk            │
│  [⚙] Settings   ├────────────────────────────┴───────────────────────────┤
│                 │ [Sessions: 2]   [Acoustic Shifts: 1]   [Focus Score: 88]│
│  ● Monitoring   ├────────────────────────────────────────────────────────┤
│    Active       │ INSIGHT STRIP: Desk is currently your calmest space.   │
└─────────────────┴────────────────────────────────────────────────────────┘
```

### Sidebar Navigation
The left sidebar remains visible across all screens:
- **Logo & Title:** Displays the QMap compass brand.
- **Dashboard:** Real-time noise meter, active session timer, and today's summary metrics.
- **Focus Map:** Workspace library with historical scores, best times, and workspace management.
- **Timeline:** Continuous, scrubbable decibel graph over 12h, 24h, and 7d horizons.
- **Insights:** Algorithmic routine analysis, quietest window discovery, and 7-day retrospective.
- **Settings:** Sampling rates, interruption threshold sensitivities, profile settings, and database management.
- **User Profile & Sign Out (Bottom):** Displays your user avatar with your initial, display name, and email. Clicking your user badge opens the **Profile & Preferences** modal to edit your name, customize your timezone, or change your theme. Click the sign-out icon to securely end your session.
- **Live Status Indicator (Bottom):** Shows a green pulsing indicator with *"Monitoring ambient"* when the microphone analyzer is running, or a gray indicator with *"Monitoring paused"* when idle.

---

## 5. Ambient Noise Monitoring

### How Audio Measurement Works
QMap uses an on-device mathematical measurement process known as **Root Mean Square (RMS)** integration:

```
Microphone Input
       │
       ▼ (Pure acoustic waveform - No recording)
HTML5 AudioContext (1024-sample AnalyserNode)
       │
       ▼ (Sum of squared amplitude values)
Calculate Root Mean Square (RMS)
       │
       ▼ (Decibels relative to Full Scale)
Convert to dBFS = 20 * log10(RMS)
       │
       ▼ (Linear interpolation to 0-100 range)
Normalized Relative Noise Level (0 to 100)
       │
       ├───> Visual Gauge (60 FPS local display)
       └───> Telemetry HTTP Sample (Logged every 10 seconds)
```

1. When active, your browser captures audio amplitude samples at 44.1 kHz or 48 kHz.
2. System-level **echo cancellation, auto-gain control, and noise suppression are explicitly disabled** by QMap to ensure you get a true, raw physical reading of your room rather than a processed speech signal.
3. Every animation frame (60 frames per second), the root mean square of the audio buffer is calculated.
4. The result is converted to Decibels relative to Full Scale (**dBFS**), ranging from -60 dBFS (very quiet) to 0 dBFS (loudest possible microphone input).
5. This value is mapped to a friendly **0 to 100** relative scale.

### The 0–100 Relative Noise Scale

| Noise Range | Status Label | Physical Real-World Equivalent |
| :---: | :---: | :--- |
| **0 – 15** | **Very quiet** | Late-night study room, whisper-quiet bedroom, sound-damped library |
| **16 – 35** | **Quiet** | Calm private office, gentle laptop fan, distant muffled room tone |
| **36 – 55** | **Moderate** | Normal quiet conversation, keyboard typing, soft air conditioning |
| **56 – 75** | **Noisy** | Open-plan office chatter, busy cafe background music, nearby traffic |
| **76 – 100** | **Very noisy** | Loud street construction, blaring television, sirens, direct shouting |

> [!IMPORTANT]
> **Relative vs. Absolute Decibels**:
> QMap measures *relative acoustic volume* based on your specific microphone's hardware sensitivity. It is **not** a calibrated SPL sound meter (such as dBA or dBC) and should not be used for industrial safety compliance.

### Sampling and Persistence Telemetry
- **Visual Display (Local):** Updates smoothly at 60 FPS on your screen.
- **Database Telemetry (Server):** Transmits an instantaneous sample payload to your database once every **10 seconds** (configurable to 5s, 30s, or 60s in Settings).
- Each telemetry record contains only:
  - `recorded_at`: Timestamp (UTC)
  - `noise_level`: Numeric float (e.g. `24.6`)
  - `location_id`: Optional workspace ID
  - `focus_session_id`: Optional active session ID

### Starting and Pausing Monitoring
- Click the **Turn Monitoring On / Monitoring Ambient** button in the top right of the Dashboard or Settings page.
- You can leave ambient monitoring running continuously even when you are not in a focus session to map background room levels throughout the day.
- Starting a **Focus Session** automatically starts monitoring if it was previously paused.

### What is Stored vs. What is Never Stored

| Data Category | Transmitted / Stored? | Where Stored? |
| :--- | :---: | :--- |
| Raw Voice / Speech Audio | ❌ **NEVER** | Discarded in browser RAM immediately |
| Audio Recordings (.wav, .mp3) | ❌ **NEVER** | Non-existent in the codebase |
| Speech-to-Text Transcripts | ❌ **NEVER** | Non-existent in the codebase |
| Decibel Numbers (e.g., `32.4`) | ✅ **YES** | Hosted PostgreSQL database |
| Session Start & End Times | ✅ **YES** | Hosted PostgreSQL database |
| Workspace Names (e.g., "Library")| ✅ **YES** | Hosted PostgreSQL database |

---

## 6. Focus Sessions

### What is a Focus Session?
A **Focus Session** represents a deliberate, timed block of deep concentration. While a session is active, QMap tags all ambient noise samples with the session's ID and monitors for sudden acoustic disturbances.

### Selecting a Workspace Location
Before starting a session, use the **Workspace Location** dropdown to specify where you are working (e.g., "Home Office", "Desk", "Library"). This enables QMap to compare acoustic performance across your different physical work spots.

### Defining Your Activity
Under **Working On**, specify your current focus objective:
- Use the quick tags: **Deep Work**, **Coding**, **Writing**, **Reading**.
- Or type any custom task label into the input field (up to 64 characters).

### Starting and Tracking a Live Session
1. Click **Start Focus Session**.
2. The card transitions into an active state:
   - A bold digital timer displays elapsed time (`MM:SS` or `HH:MM:SS`).
   - A pulsing green indicator confirms the active activity.
   - The primary button transforms into a red **End Focus Session** button.

```
┌────────────────────────────────────────────────────────┐
│ FOCUS SESSION                                     (⏰) │
│ Session in Progress                                    │
│                                                        │
│ 00:42:15                                               │
│ ● Activity: System Architecture Design                 │
│                                                        │
│ [ ■ End Focus Session ]                                │
└────────────────────────────────────────────────────────┘
```

### Ending a Session & Focus Score Summary
When your focus block is complete:
1. Click **End Focus Session**.
2. QMap immediately queries the noise samples and interruptions recorded during the session and computes:
   - **Duration:** Total elapsed minutes.
   - **Average Noise:** The arithmetic mean of all recorded decibel samples.
   - **Stability Score:** Consistency of the soundscape (lower variance = higher stability).
   - **Interruption Count:** Number of sudden noise spikes detected.
   - **Focus Score:** A composite score between 0 and 100.
3. A success notification displays your score:
   *`"Session completed. Focus Score: 92/100"`*
4. All dashboard counters and the weekly chart update immediately.

### Session Editing and Notes Capabilities
- **Pre-Session Selection:** You can freely select your workspace and type of activity prior to launching a session.
- **In-Flight / Historical Editing:** *Currently, past completed sessions and active in-flight session labels cannot be retroactively modified.* (See [Section 20: Future Features](#20-planned--future-features)).

---

## 7. Acoustic Interruptions & Spike Detection

### What Constitutes an Interruption?
An **Acoustic Shift (Interruption)** is defined as a sudden, sharp rise in room volume that breaks the prevailing background noise floor.

Examples of interruptions:
- A door slamming in a quiet room.
- A telephone ringing nearby.
- Someone suddenly speaking directly next to your workspace.
- Loud sirens or vehicle horns outside an open window.

### The Adaptive Baseline & Rise Threshold
To avoid false positives, QMap uses an **exponential moving average baseline**:
1. When a session begins, your initial sound level forms the initial baseline.
2. During quiet periods, the baseline smoothly adapts:  
   $$\text{Baseline}_{\text{new}} = (\text{Baseline}_{\text{old}} \times 0.85) + (\text{Current Level} \times 0.15)$$
3. If an instantaneous noise sample exceeds the baseline by the **Interruption Rise Threshold** (default: **18 dB**), QMap immediately logs an interruption:  
   $$\Delta = \text{Current Level} - \text{Baseline} \ge \text{Threshold}$$
4. If loud noise persists across multiple samples, QMap extends the recorded duration and updates the peak intensity rather than creating duplicate events.
5. Once noise subsides, the baseline tracker resumes normal tracking.

### How Spikes are Represented in the Interface
- **Dashboard Metric:** Tracked under the **Acoustic Shifts** metric card.
- **Weekly Summary:** Displayed in the 7-day retrospective as total interruption spikes.
- **Focus Map:** Tracked per location to highlight which spaces have the most interruptions.

### Impact on Focus Metrics
Every detected interruption deducts **12 points** from the interruption component of your Focus Score. A quiet session with zero interruptions preserves the maximum score.

---

## 8. Dashboard & Productivity Metrics

The Dashboard provides an instant snapshot of your daily focus environment:

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ SESSIONS TODAY          │ ACOUSTIC SHIFTS         │ AVERAGE FOCUS SCORE     │
│ 3                       │ 2                       │ 89 / 100                │
│ Completed focus blocks  │ Elevated noise spikes   │ Environmental calm      │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### Current Atmosphere & Noise Gauge
- **Circular Noise Gauge:** Visual dial displaying your current relative level from 0 to 100.
- **Live Atmosphere Label:** Classifies your room as *Very quiet*, *Quiet*, *Moderate*, *Noisy*, or *Very noisy*.
- **Stream Status:** Indicates *Live Stream* (when microphone is active) or *Idle*.

### Sessions Today
- The total count of completed focus sessions since midnight UTC.

### Acoustic Shifts
- The total count of sudden acoustic spikes detected across all sessions today.

### Average Focus Score
- The arithmetic mean of all Focus Scores earned today.
- Computed via the four-pillar environmental formula:

$$\text{Focus Score} = (\text{Quietness} \times 0.40) + (\text{Stability} \times 0.30) + (\text{Interruption Score} \times 0.24) + (\text{Duration Score} \times 0.06)$$

- **Quietness (40%):** How low the average sound was relative to 100.
- **Stability (30%):** Standard deviation of noise readings (steady hum scores higher than erratic fluctuations).
- **Interruption Score (24%):** Penalty of 12 points per detected spike.
- **Duration Score (6%):** Proportion of sustained time up to a maximum baseline of 45 minutes.

### The Dynamic Insight Strip
Located at the bottom of the Dashboard, this contextual banner surfaces immediate observations:
- Warns if your current space is unusually loud.
- Highlights your best workspace for today's tasks.
- Provides a one-click shortcut to explore historical trends in **Timeline** or **Insights**.

---

## 9. Focus Map (Workspaces)

The **Focus Map** allows you to catalog the physical locations where you work and evaluate their acoustic profiles.

```
┌────────────────────────────────────────────────────────┐
│ [⌕] Desk                                      [✎] [🗑] │
│ FOCUS SCORE: 92                                        │
│ ılılııılı                                              │
│ Avg Noise: Quiet (24)       Best Time: 8 AM - 10 AM    │
│ ✦ 12 sessions                       [ ▶ Focus Here ]   │
└────────────────────────────────────────────────────────┘
```

### Understanding Workspaces
Workspaces represent real physical spaces (e.g., "Home Office", "Desk", "Kitchen Table", "Campus Library", "Coffee Shop"). Each workspace card tracks:
- **Focus Score:** Lifetime average focus score achieved in this location.
- **Acoustic Wave Graphic:** Visual representation of environmental calm.
- **Avg Noise:** Overall noise classification for this workspace.
- **Best Time:** The 2-hour hour window during which this workspace historically records its lowest noise levels.
- **Session Count:** Total completed sessions recorded here.

### Adding a New Workspace
1. Navigate to **Focus Map** from the sidebar.
2. Click **+ Add Workspace** in the top right.
3. Enter a workspace name (e.g., "Corner Desk").
4. Click **Create Workspace**.

### Editing & Renaming Workspaces
1. Click the **Pencil (Edit)** icon on any workspace card.
2. Type the new name.
3. Click **Save Changes**.

### Deleting a Workspace
1. Click the **Trash (Delete)** icon on the workspace card.
2. Confirm the browser prompt.
3. *Note:* Deleting a workspace unlinks past focus sessions and noise records without deleting your historical session data.

### Quick Launch: "Focus Here"
Clicking **Focus Here** on any workspace card immediately selects that location and transitions you to the Dashboard ready to launch a session.

---

## 10. Timeline & Historical Telemetry

The **Timeline** page displays a continuous, interactive graph of acoustic levels recorded over time.

```
Relative Noise Graph                                  [ 12 Hours | Past 24 Hours | Past 7 Days ]
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ 100                                                                                          │
│  75                                                                                          │
│  50            ▲                                                                             │
│  25 ───╭───────╯╰────────╮─────────────╭───                                                  │
│   0 ───╯                 ╰─────────────╯                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Interactive Acoustic Signal Graph
- **Green Filled Wave:** Represents the contour of noise levels over time.
- **Crosshair Hover Cursor:** Move your cursor across the graph to inspect any precise point in time.
- **Hover Inspection Card:** Displays the exact timestamp, recorded level, and relative noise label.

### Selecting Time Ranges (12h, 24h, 7d)
Use the segmented control in the top-right corner to change your inspection window:
- **12 Hours:** High-resolution view of your recent morning or afternoon.
- **Past 24 Hours:** Standard daily view showing day vs. night contrast.
- **Past 7 Days:** Broad weekly trend view.

### Data Aggregation & Downsampling
To ensure your browser stays responsive and never stutters, QMap downsamples high-frequency database samples into clean temporal buckets:

| Selected Range | Bucket Size | Maximum Data Points Displayed |
| :--- | :---: | :---: |
| **12 Hours** | 2 Minutes | ~360 points |
| **Past 24 Hours** | 5 Minutes | ~288 points |
| **Past 7 Days** | 30 Minutes | ~336 points |

### Point Inspection & Telemetry Callouts
When scrubbing over any point on the timeline, three inspection cards below the chart update in real time:
1. **Point Inspection:** Shows the exact time and the minimum, average, and maximum noise range within that time bucket.
2. **Workspace:** Identifies which workspace you were in (or displays *Unlabeled* if monitoring ambiently).
3. **Focus Session:** Indicates whether you were in an active focus session or passive ambient monitoring.

---

## 11. Insights & 7-Day Retrospective

The **Insights** screen processes your accumulated telemetry into high-level patterns.

### Data Readiness Requirements
To prevent false conclusions from sparse data, QMap requires a minimum threshold before revealing insights:
- **Minimum 15 noise measurements**
- **Minimum 2 completed focus sessions**

If these thresholds have not been met, QMap displays:  
*`"Still Learning Your Routine — QuietMap requires at least 15 noise measurements and 2 completed focus sessions to detect local patterns."`*

### Your Quietest Window
- Highlights the 2-hour window during the day (e.g., *8 AM – 10 AM*) that consistently records the lowest average noise levels.
- Displays the exact average decibel rating for that window.

### Optimal Workspace
- Recommends the workspace that achieved your highest average Focus Score across completed sessions.

### Emerging Acoustic Shifts
- Highlights periods of high acoustic volatility where sound levels fluctuate erratically, suggesting when to schedule collaborative or administrative work instead of deep focus.

### The 7-Day Retrospective Chart
A bar chart breaking down your focus across the past week:
- **Best Day:** Identifies the day with your highest Focus Score.
- **Total Focus Time:** Sum of minutes spent in focus sessions over the last 7 days.
- **Total Interruption Spikes:** Sum of all acoustic disturbances across the week.
- **Daily Performance Bars:** Visual columns for each of the past 7 days displaying daily focus scores.

### Quickstart Demo Data Seeding
If you are testing QMap or want to see how the analytics look before recording several days of personal work:
1. Navigate to **Insights**.
2. If sufficient data does not exist, look for **Quickstart with Simulated Demo Data**.
3. Choose:
   - **Load 7 Days Demo**
   - **Load 14 Days Demo**
   - **Load 30 Days Demo**
4. QMap will generate realistic sample records, workspaces (Desk, Library, Home), sessions, and interruptions. All charts and metrics populate immediately.

---

## 12. Settings & Preferences

The **Settings** page gives you full control over your personal profile identity, timezone synchronization, visual themes, telemetry sampling rates, and database management:

```
┌────────────────────────────────────────────────────────────────────────┐
│ PROFILE & PREFERENCES                                 [ Edit Profile ] │
│                                                                        │
│ Display Name: Jane Doe            Account Email: jane@example.com (🔒) │
│ Timezone: America/New_York (auto) Visual Theme: System                 │
├────────────────────────────────────────────────────────────────────────┤
│ AMBIENT MONITORING                                                     │
│                                                                        │
│ Live Monitoring Active                           [ Switch ON / OFF ]   │
│                                                                        │
│ Sampling Interval                                [ Every 10 seconds ▼ ]│
│                                                                        │
│ Interruption Rise Threshold                      [ Balanced (18 dB) ▼ ]│
├────────────────────────────────────────────────────────────────────────┤
│ PRIVACY ARCHITECTURE                                                   │
│ [ Local Audio RMS ]    [ No Cloud Sync ]    [ Complete Purge ]         │
│                                                                        │
│ Danger Zone:                                     [ Delete All Data ]   │
└────────────────────────────────────────────────────────────────────────┘
```

### User Profile & Display Name
- **Display Name (Required):** Your visible name displayed throughout QMap (in the header greeting, sidebar, and workspace reports).
  - Validation: Must be between 2 and 100 characters in length.
  - Leading and trailing whitespace is automatically trimmed. Empty or whitespace-only names are prohibited.
  - You can update your display name at any time by clicking **Edit Profile** in the Settings screen or clicking your user badge in the bottom-left sidebar.
- **Account Email (Read-Only):** Your registered email address serves as your primary account identifier and authentication credential. For security and tenant integrity, your email address is read-only and cannot be altered via the profile dialog.

### Timezone Configuration & Automatic Sync
Accurate timestamps ensure your Focus Sessions, Timeline charts, and Daily Retrospectives align with your local working hours. QMap provides two timezone synchronization modes:
1. **Automatic (Browser Detection — Recommended):**
   - QMap detects your local device timezone using the browser's standard internationalization engine (`Intl.DateTimeFormat`).
   - When you travel or change timezones, QMap automatically updates your profile to match your current local timezone.
   - **Zero Redundant Writes:** If your device timezone already matches your saved profile timezone, QMap performs zero unnecessary network requests or database writes.
2. **Manual Selection:**
   - If you prefer to log sessions in a fixed timezone regardless of your physical location, switch the toggle to **Manual Selection**.
   - Choose any standard IANA timezone identifier (e.g., `UTC`, `America/New_York`, `Europe/London`, `Asia/Tokyo`).
   - While in Manual mode, QMap's automatic detection is suspended and will never overwrite your manually chosen timezone.

### Visual Theme Preferences (Light, Dark, System)
Customize QMap's visual presentation to suit your working environment and lighting conditions:
- **Light:** Clean, crisp daylight palette built with soft forest green and warm sage accents.
- **Dark:** Low-glare, contrast-optimized palette designed for nighttime deep focus sessions and low-light workspaces.
- **System (Default):** Dynamically mirrors your operating system or browser light/dark mode preference (`prefers-color-scheme`). If your OS automatically switches between light and dark themes at sunrise/sunset, QMap updates immediately in real time without requiring a page reload.

To change your visual theme, open **Edit Profile** and select **Light**, **Dark**, or **System**. Your choice is saved directly to your account profile and applies across all devices where you log in.

### Live Monitoring Active Toggle
- Turns the browser microphone audio capture on or off.
- Can be toggled without affecting your saved preferences.

### Sampling Interval (Telemetry Frequency)
Controls how often aggregated decibel readings are logged to the database:
- **Every 5 seconds:** High telemetry resolution (useful for fast-changing environments).
- **Every 10 seconds (Recommended):** Optimal balance between data resolution and database efficiency.
- **Every 30 seconds:** Reduced database traffic.
- **Every 60 seconds:** Minimal database storage footprint.

### Interruption Rise Threshold
Configures the sensitivity of spike detection:
- **Sensitive (12 dB jump):** Catches minor rustling, quiet speaking, or distant door clicks.
- **Balanced (18 dB jump — Recommended):** Ignores normal keyboard typing and chair shifts; flags clear conversations and sudden disturbances.
- **High (26 dB jump):** Only flags major loud events (alarms, shouts, dropped objects).

### Purge All Data (Complete Factory Reset)
If you wish to wipe your history:
1. Under the **Danger Zone** on the Settings page, click **Delete All Data**.
2. A confirmation modal appears:
   *"This permanently purges every recorded noise sample, focus session, interruption, and workspace from your database. This action cannot be undone."*
3. Click **Yes, Delete Everything**.
4. All database tables are emptied, active sessions are terminated, and the dashboard resets to clean zeros.

---

## 13. Privacy Architecture & Data Handling

### Zero Audio Storage Guarantee
QMap's privacy model is architectural, not merely contractual. The application is built with the following guarantees:
- **Audio buffers are volatile:** The Web Audio API processes acoustic frames in browser memory and immediately discards them during the next garbage collection cycle.
- **No audio encoding:** There are no audio encoders (e.g., MP3, WAV, AAC, Opus) included in either the frontend or backend code.
- **No voice recognition:** There are no speech recognition, speech-to-text, or Natural Language Processing (NLP) models in QMap.

### Client-Side Processing (Web Audio API)
All signal processing happens inside your browser's local sandbox:
```
Your Room Audio  ──>  [Browser Memory RMS Math]  ──>  Number: 28.4  ──>  FastAPI  ──>  PostgreSQL
                      (Audio frame destroyed)
```

### Backend Data Structure
The only data stored in your PostgreSQL database consists of standard relational records:

| Table | What It Contains |
| :--- | :--- |
| `locations` | UUID, Workspace Name (e.g. "Library"), Creation Date |
| `focus_sessions` | UUID, Start/End Timestamps, Activity Name, Focus Score, Average Noise, Interruption Count |
| `noise_samples` | UUID, Timestamp, Noise Level (Float between 0.0 and 100.0), Location ID, Session ID |
| `interruptions` | UUID, Session ID, Timestamp, Duration in Seconds, Decibel Intensity, Peak Level |
| `daily_statistics`| Date, Average Noise, Quietest Hour, Interruption Count, Total Focus Minutes |
| `settings` | Key-Value configuration pairs (sampling interval, thresholds) |

### Microphone Permissions Transparency
When your browser displays the microphone icon in your browser tab, it confirms that the browser's audio input node is connected to QMap's RMS calculation script. Closing the browser tab or clicking **Turn Monitoring On/Off** immediately closes the audio stream.

---

## 14. Troubleshooting Guide

### Microphone Permission Denied or Blocked
- **Symptom:** Toast error displays *"Microphone access was denied or is unavailable"*, or status remains *"Idle"*.
- **Solution:**
  1. Click the icon to the left of the website URL in your address bar (padlock or slider icon).
  2. Locate **Microphone** and switch it from **Block** to **Allow**.
  3. Refresh the webpage.
  4. Ensure your operating system allows your browser to access the microphone:
     - **Windows:** Settings > Privacy & Security > Microphone > Allow apps to access your microphone.
     - **macOS:** System Settings > Privacy & Security > Microphone > Toggle your browser ON.

### Microphone Reading Remains Flat / Zero
- **Symptom:** The dial remains at 0 or displays `--`, even when speaking.
- **Solution:**
  1. Check your physical microphone's hardware mute switch or headset mute button.
  2. Verify your default input device in your operating system's sound settings.
  3. Ensure no other application (e.g., Zoom, Teams, Discord) has taken exclusive access of the microphone hardware.

### Dashboard Fails to Load or Shows Network Error
- **Symptom:** Toast alert: *"Could not load dashboard."*
- **Solution:**
  1. Verify your internet connection.
  2. If self-hosting, check that your FastAPI backend is running and that the `/api/v1/health` endpoint returns `{"status":"ok","database":"connected"}`.
  3. If deployed on Vercel, check the Vercel Function Logs for connection timeouts to Supabase.

### Insights Page Shows "Still Learning Your Routine"
- **Symptom:** Insights page displays an empty state compass instead of analytics cards.
- **Explanation:** This is expected behavior. QMap requires at least 15 noise measurements and 2 completed focus sessions before calculating routine patterns.
- **Solution:** Complete two short focus sessions, or click **Load 7 Days Demo** on the Insights screen to preview analytics with simulated data.

### Sessions Fail to End or Report Conflict
- **Symptom:** Starting a session returns *"A focus session is already in progress"*.
- **Solution:** You can only run one focus session at a time. Click **End Focus Session** on the current active session before launching a new one. If the server restarted during a session, QMap's startup routine automatically closes orphaned sessions older than 12 hours.

### Purging Data Does Not Clear Immediately
- **Symptom:** You clicked "Yes, Delete Everything", but cards still show old numbers.
- **Solution:** The purge operation clears the database immediately. QMap triggers a fresh reload of all views; if your browser cached an API response, do a hard refresh (**Ctrl+F5** on Windows/Linux or **Cmd+Shift+R** on macOS).

---

## 15. Frequently Asked Questions (FAQ)

#### Can QMap hear or record my conversations?
**No.** QMap contains no audio recording or transmission logic. It reads amplitude values to compute a decibel number, and the audio frame is immediately purged from RAM.

#### Does QMap work offline?
Ambient monitoring and the visual gauge can run offline in your browser, but saving sessions, historical data, and computing insights requires a connection to your backend and PostgreSQL database.

#### Can I use QMap on my smartphone?
Yes. QMap's interface is responsive and works on modern mobile browsers (iOS Safari, Android Chrome). However, mobile operating systems automatically suspend audio capture when the screen locks or when switching apps.

#### Why does my Focus Score drop even if I worked hard?
The Focus Score evaluates **environmental calm**, not your personal cognitive output. If your room was loud or experienced frequent interruptions, the Focus Score will reflect that environmental turbulence.

#### Can I rename a workspace after creating it?
Yes. Go to **Focus Map**, click the **Pencil icon** on the workspace card, enter the new name, and click Save.

#### How do I start over with a fresh database?
Go to **Settings**, scroll down to the **Danger Zone**, click **Delete All Data**, and confirm.

---

## 16. Security & Privacy Recommendations

1. **Deploy with HTTPS:** Never deploy QMap in production over unencrypted HTTP. Modern browsers will reject microphone permissions on insecure domains.
2. **Protect Database Credentials:** When configuring `backend/.env` or Vercel environment variables, never share or commit your `DATABASE_URL`.
3. **Use the Supabase Session Pooler:** Always connect via port `5432` with `sslmode=require` to protect your telemetry in transit.
4. **Personal Account Isolation:** Each user's data is strictly isolated to their authenticated account. Maintain a strong, unique password and sign out when using shared computers to protect your focus telemetry.

---

## 17. Data Interpretation Guide

To gain the greatest value from QMap, interpret your metrics objectively:

- **Do NOT equate a low Focus Score with personal failure:** A low Focus Score indicates that your physical environment was noisy or erratic. Use this as a trigger to close a window, put on noise-cancelling headphones, or relocate to a quieter workspace.
- **Look for stability over absolute silence:** The brain easily adapts to steady background sound (like a quiet fan or distant traffic). Erratic, unpredictable sounds (conversations, doors slamming) cause the greatest cognitive strain and trigger QMap's interruption detection.
- **Use the Best Time insight to schedule deep work:** If QMap identifies *8 AM – 10 AM* as your quietest window, protect that time for complex problem-solving, writing, or coding, and leave noisy afternoon windows for meetings and emails.

---

## 18. Glossary of Terms

- **dBFS (Decibels relative to Full Scale):** A standard digital audio scale where 0 dBFS is the maximum possible digital level and negative values represent quieter levels.
- **RMS (Root Mean Square):** A statistical measure of the magnitude of a varying audio signal, representing perceived loudness.
- **Acoustic Shift / Interruption:** A sudden upward surge in decibels exceeding your ambient baseline by a configured threshold.
- **Focus Score:** A composite 0–100 score combining quietness (40%), acoustic stability (30%), absence of interruptions (24%), and session length (6%).
- **Stability Score:** A 0–100 rating reflecting how constant and non-erratic your room volume remained during a session.
- **Downsampling:** Reducing high-frequency data points into time-bucket averages (e.g., 5-minute buckets) to enable fast, responsive graph rendering.
- **Telemetry:** Automated transmission of numeric monitoring samples from the client browser to the backend database.

---

## 19. Known Limitations

The following limitations reflect the current state of the implementation:
1. **Browser Background Throttling:** When you switch tabs or minimize the browser, modern operating systems reduce CPU and timer execution. While monitoring continues, telemetry may be batched or delayed until you refocus the tab.
2. **Hardware-Dependent Decibels:** Decibel readings are relative to your computer microphone's gain. A sensitive microphone will report higher numbers than a quiet microphone in the same room.
3. **No Retroactive Session Editing:** You cannot currently edit the start time, end time, or notes of a session after it has ended.
4. **No Data Export (CSV/JSON):** There is currently no one-click button in the UI to export raw noise samples or sessions to spreadsheet files.

---

## 20. Planned / Future Features

*(The following features are proposed roadmap enhancements and are **NOT** currently implemented in the codebase)*

- [x] **[Implemented — Phase 1] User Authentication & Multi-Tenancy:** Secure email/password login, HttpOnly cookie sessions, and independent personal data per user.
- [ ] **[Planned — Phase 2] User Profiles:** Display names, avatar customization, and personal default preferences.
- [ ] **[Planned — Phase 3] Enhanced Focus Sessions:** Structured focus tags, retroactive session editing, and reflection notes.
- [ ] **[Planned — Phase 4] Pomodoro Integration:** Configurable work/break intervals and audio chimes.
- [ ] **[Planned — Phase 5] Goals & Targets:** Daily/weekly focus time targets and quietness thresholds.
- [ ] **[Planned — Phase 6] Calendar Integration (Google / Outlook):** Automatically log and schedule focus blocks.
- [ ] **[Planned — Phase 9] CSV & JSON Telemetry Export:** Download raw focus logs and noise telemetry.
- [ ] **[Planned] Background Audio Worker (Service Worker):** Enhanced background audio processing to prevent timer throttling when switching browser tabs.
- [ ] **[Planned] Native Desktop Application:** Standalone system tray app (Electron/Tauri) with global hotkeys and OS-level notifications.

---

## 21. Appendix A — Admin & Deployment Guide

*(For developers, system administrators, and technical users)*

### Architecture Summary
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend: React 18                       │
│  - Vite + TypeScript + Tailwind CSS                         │
│  - Web Audio API Analyzer (Client-side RMS)                 │
│  - Deployed on Vercel (SPA Router: /* -> /index.html)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON REST API (/api/v1)
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend: FastAPI                         │
│  - Python 3.10+ / SQLAlchemy 2.0                            │
│  - Pydantic v2 validation                                   │
│  - Deployed on Vercel Serverless Function (/api/main.py)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ PostgreSQL wire protocol (Port 5432, SSL)
┌──────────────────────────────▼──────────────────────────────┐
│             Database: Supabase Hosted PostgreSQL            │
│  - Supabase Session Pooler                                  │
│  - Managed via Alembic migrations                           │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables

| Variable Name | Environment | Purpose | Example Value |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend / Vercel Serverless | PostgreSQL connection string with SSL | `postgresql+psycopg://user:pass@host:5432/postgres?sslmode=require` |
| `SECRET_KEY` | Backend / Vercel Serverless | Cryptographic signing key for JWT tokens (min 32 chars) | `your-secure-random-32-char-production-key` |
| `ENVIRONMENT` | Backend / Vercel | Runtime environment mode | `production` or `development` |
| `PROJECT_NAME`| Backend (Optional) | API title metadata | `QuietMap API` |

> [!CAUTION]
> `DATABASE_URL` and `SECRET_KEY` contain sensitive credentials. They must **only** be configured on the server/Vercel backend and **never** prefixed with `VITE_` or included in frontend client bundles.

### API Structure (`/api/v1`)
The FastAPI backend exposes the following primary endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST`| `/api/v1/auth/register` | Register new user account (HttpOnly cookie) |
| `POST`| `/api/v1/auth/login` | Authenticate user credentials (HttpOnly cookie) |
| `POST`| `/api/v1/auth/token` | Obtain bearer token (API and automated testing) |
| `POST`| `/api/v1/auth/logout` | Invalidate cookie session |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/v1/health` | Service health and database ping |
| `GET` | `/api/v1/dashboard` | Aggregated metrics, active session, live level |
| `GET` | `/api/v1/locations` | List all workspaces |
| `POST`| `/api/v1/locations` | Create a new workspace |
| `PUT` | `/api/v1/locations/{id}` | Rename a workspace |
| `DELETE`| `/api/v1/locations/{id}` | Delete a workspace |
| `GET` | `/api/v1/focus-map` | Detailed workspace metrics and best times |
| `GET` | `/api/v1/sessions/active` | Get current active focus session |
| `POST`| `/api/v1/sessions/start` | Start a new focus session |
| `POST`| `/api/v1/sessions/{id}/end` | End session and compute Focus Score |
| `POST`| `/api/v1/noise/sample` | Log an instantaneous noise telemetry sample |
| `GET` | `/api/v1/noise/latest` | Fetch the most recent recorded noise sample |
| `GET` | `/api/v1/timeline?range=day` | Fetch downsampled timeline buckets (12h, day, week) |
| `GET` | `/api/v1/insights` | Routine insights and quietest hour analysis |
| `GET` | `/api/v1/weekly` | 7-day retrospective analytics |
| `GET` | `/api/v1/settings` | Retrieve user preferences |
| `PUT` | `/api/v1/settings` | Update preferences (sampling interval, thresholds) |
| `DELETE`| `/api/v1/settings/all-data`| Complete purge of all user records |
| `POST`| `/api/v1/seed/demo?days=7` | Generate realistic simulated test records |

### Deployment Architecture (Vercel Services Model)
QMap is configured as **one single project** on Vercel using the root `vercel.json` Services model:
- **Routing:**
  - `/api/*` routes to the FastAPI service at `backend/app/main.py`.
  - `/*` routes to the static Vite frontend build at `frontend/dist`.
- **Single Public Domain:** Eliminates Cross-Origin Resource Sharing (CORS) complexity in production.

### Database Migrations (Alembic)
To apply database schema changes in Supabase:
```bash
cd backend
python -m alembic upgrade head
```
This executes the versioned migrations in `backend/alembic/versions/`, creating all required tables, constraints, foreign keys, and indexes.

---
*End of QMap User Manual — QuietMap Version 1.0.0*
