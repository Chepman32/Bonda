# SDD — Bonda

## Offline iOS Contact Relationship Mapping App

## Product Design and Technical Specification

## 1. Product Definition

**Bonda** is an offline-first iOS app that helps a user evaluate the importance, closeness, energy, and relationship quality of people in their iPhone contacts through an intuitive, highly gestural interaction model. The core idea is to transform a dry address book into a personal, emotionally readable, beautifully animated “social bubble map” that reveals who matters most, which relationships are strong or fading, which groups dominate the user’s attention, and what the overall structure of the user’s social circle looks like.

The app does not collect data, does not require login, does not require cloud sync, and performs all contact import, rating, clustering, summary generation, and visual analytics completely on-device. Its interaction language is inspired by the immediate feel of swipe-based interfaces, but it is more nuanced and more respectful than simplistic like/dislike mechanics. Instead of reducing a person to a binary choice, Bonda introduces a tactile card system with directional swipes, hold gestures, radial drag interactions, layered chips, and contextual micro-decisions that allow the user to quickly but meaningfully rate each contact.

The final experience culminates in a cinematic animated summary: a living social bubble visualization rendered with React Native Skia and Reanimated, showing proximity zones, emotional balance, strong ties, weak ties, neglected contacts, family clusters, work clusters, and custom relationship archetypes. The user leaves with a polished, introspective summary rather than just a list of scored contacts.

The app must feel premium, intimate, calm, and fluid. It must not feel clinical, spreadsheet-like, or gamified in a childish way. It should feel like a cross between a privacy-first personal insight tool and a high-end social mirror.

---

## 2. Product Goals

1. Turn contact evaluation into an intuitive gesture-driven flow that feels effortless rather than administrative.
2. Help the user understand their personal social structure without requiring heavy manual data entry.
3. Deliver rich visual analysis at the end of the flow through animated, high-beauty summaries.
4. Preserve complete privacy through full offline operation.
5. Make the experience production-ready, polished, and emotionally intelligent, not merely functional.
6. Use only UI patterns and technical approaches that are fully implementable with React Native and JavaScript-based tooling, including native modules where needed for contacts access and local persistence.
7. Avoid any emoji-based UI. All emotional cues, states, and categories must use typography, vector icons, gradients, motion, and abstract visuals instead.

---

## 3. Product Principles

### 3.1 Privacy-first

All user data stays on-device. Contacts are read locally via permissioned iOS access. Ratings, clustering, tags, and summaries are stored locally in encrypted or app-private storage.

### 3.2 Gesture-first

Nearly every key action should be possible via gestures: swipe, drag, hold, tap, flick, pull, pinch, and edge-pan. Buttons exist, but the app should primarily feel direct-manipulation driven.

### 3.3 Soft emotional design

The product is about real people in the user’s life. UI must feel thoughtful and elegant, not aggressive or judgmental. Copy, motion, sound, and visuals should encourage reflection, not ranking anxiety.

### 3.4 Fast progression with optional depth

A user should be able to rapidly evaluate dozens of contacts, but also open richer detail for important people. Quick mode and deep mode coexist seamlessly.

### 3.5 Beauty as information

The summary is not decoration added after the fact. Motion, spacing, color, orbit distance, bubble density, and visual grouping all communicate meaning.

---

## 4. Platform and Technology Scope

**Primary platform:** iOS  
**Framework:** React Native  
**Animation:** react-native-reanimated, react-native-skia, react-native-gesture-handler  
**State management:** Zustand or Redux Toolkit  
**Persistence:** MMKV for high-speed UI/session state, SQLite or WatermelonDB for structured contact evaluation data  
**Contacts access:** react-native-contacts or a custom native bridge if deeper normalization is required  
**Navigation:** React Navigation with native stack and gesture-enabled transitions  
**Icons:** vector-icons, SVG icon pack, or custom line icons via react-native-svg  
**Charts/visuals:** mostly custom Skia-based rendering rather than standard chart libraries  
**Offline computation:** all heuristics and clustering implemented in JS/TS on-device  
**Image assets:** decorative illustrations and abstract visual assets originate from remote image sources during content preparation, but the shipped app contains bundled/local cached derivatives so runtime connectivity is never required for core function

---

## 5. Brand and Visual Identity

### 5.1 Name

**Bonda**

Rationale: short, memorable, warm, and directly associated with connection and bonds without sounding generic or overly technical.

### 5.2 Tone

- Calm
- Premium
- Reflective
- Clean
- Intelligent
- Personal

### 5.3 Visual language

The visual system should combine:

- soft translucent layers
- fluid particle motion
- orbital metaphors
- glass-like surfaces with restrained blur
- precise typography
- luminous gradients
- dark and light adaptive themes

The design should avoid loud social media aesthetics. No neon overload, no childish stickers, no novelty effects that cheapen the emotional theme.

### 5.4 Typography

Use SF Pro Display and SF Pro Text.  
Typography scale should be bold and modern:

- Hero titles: large, confident, slightly compressed feel
- Section titles: medium-weight, clean spacing
- Metrics: tabular numerals for score-based data
- Body copy: restrained, readable, slightly warm tone

### 5.5 Color system

Core palette should be abstract and atmospheric rather than categorical in a crude way.

Suggested families:

- Deep graphite / near-black base
- Pearl / cloud white for light mode
- Indigo-blue gradients for structure and trust
- Violet-lilac for emotional depth
- Soft aqua for balance and clarity
- Amber-gold for strongest ties / core circle
- Rose for warmth / family / intimacy
- Muted slate for neutral states

Color should be used more as a field and mood than as harsh labels. Categories can be distinguished via motion patterns, icon treatment, halo thickness, ring structure, and bubble texture in addition to hue.

---

## 6. Core UX Concept

The central evaluation model is not a simple Tinder clone. It is a layered card interaction system:

- **Horizontal swipe** determines closeness/importance directionally.
- **Vertical drag** introduces energy/maintenance context.
- **Press-and-hold** opens quick attribute ring.
- **Small radial scrubber** allows fine score adjustments.
- **Edge swipe** moves between review, backlog, skipped, and summary spaces.
- **Long swipe velocity** can trigger “strong signal” actions for contacts the user feels clearly about.
- **Micro-tags** are selected by drag-through chips, not by opening bulky forms.

This keeps evaluation fast while allowing richer nuance.

A contact can be evaluated through four primary dimensions:

1. Importance in user’s life
2. Emotional comfort / relationship quality
3. Recency / relevance
4. Desired attention level going forward

The app may also support optional labels such as:

- Family
- Close friend
- Friend
- Work
- Creative
- Service
- Dormant
- Complicated
- Supportive
- Aspirational
- Mentor
- Inner circle

These are chosen through elegant chip gestures and not via checkbox-heavy forms.

---

## 7. Information Architecture

1. Splash
2. Permission introduction
3. Contacts access request
4. Contact import and normalization
5. Mode selection
6. Evaluation deck
7. Contact quick-detail overlay
8. Review queue
9. Cluster editor
10. Summary generation transition
11. Animated social bubble summary
12. Contact insights detail screens
13. Timeline / saved sessions
14. Settings and privacy
15. Export/share snapshot screen

---

## 8. Screen-by-Screen Specification

## 8.1 Splash Screen

### Purpose

Deliver an immediate premium impression and establish the app’s motion language.

### Layout

- Full-screen dark or adaptive background
- Centered Bonda wordmark and symbol
- Thin ambient particle field in background
- Subtle noise texture
- No static loading spinner

### Animation

The splash should be dramatic but elegant:

1. The logo begins as a tight luminous orb.
2. It fractures into dozens of soft particles with spring physics.
3. Particles orbit outward in rings.
4. The word “Bonda” twists into place from segmented ribbon-like strokes.
5. The orb re-forms behind the text as a halo.
6. The entire composition slightly parallax-shifts with device motion.
7. Transition into next screen via the logo expanding into a circular portal.

This should be built with Skia for particle rendering and Reanimated for timing orchestration, gesture-aware interruption safety, and shared element style transitions.

### Notes

No hard cuts. The splash should morph directly into onboarding.

---

## 8.2 Permission Intro Screen

### Purpose

Explain clearly why contacts access is needed.

### Layout

- Large hero illustration: abstract orbiting nodes connected with thin lines
- Title: “Map your real social circle”
- Body copy explaining fully offline processing
- Three trust cards:
  - On-device only
  - No cloud account
  - You control every rating
- Primary CTA
- Secondary “Not now” action

### Components

- Animated hero canvas
- Trust badges with vector icons
- CTA button with soft press depth
- Bottom legal-style privacy note

### Motion

The hero graphic subtly responds to touch. Tapping a node makes linked lines ripple. Trust cards slide upward with staggered springs. CTA glows softly on idle.

---

## 8.3 Contacts Access Request

### Layout

Minimal, direct, system-friendly.

- Small header
- Permission explanation
- Animated miniature contact cards fanning open
- Primary button to trigger iOS permission
- Secondary educational link: “How your data stays private”

### State variations

- Not determined
- Denied
- Restricted
- Granted

### Denied state

If access is denied, show elegant troubleshooting with an inline visual path to iOS Settings, not a generic error wall. Include a mock settings card with animated highlight around Contacts permission.

---

## 8.4 Import and Normalization Screen

### Purpose

Process device contacts and prepare the evaluation deck.

### Layout

- Large circular progress visualization
- Live counters: imported, deduplicated, hidden, ready
- Activity feed: “Merging duplicate phone entries”, “Preparing contact cards”, “Grouping by likely category”
- Decorative orbit lines

### Motion

The circle should not be a standard progress bar. It should behave like a dynamic orbital radar: new contacts become little dots entering a main field, then snapping into a stable ring. Text updates animate as number tickers.

### Logic

During this stage, app:

- reads contacts
- normalizes names
- merges duplicates where safe
- excludes obviously unusable entries if configured
- generates local initials avatars if no photo exists
- stores normalized models locally

---

## 8.5 Mode Selection Screen

### Purpose

Let the user choose evaluation style.

### Modes

1. **Quick Pass** — fast intuitive rating
2. **Deep Pass** — adds richer relationship signals
3. **By Group** — evaluate family, work, friends separately
4. **Resume Previous** — continue unfinished session

### Layout

A grid of large tactile cards, each with animated iconography and concise explanation.

### Motion

Cards subtly tilt with pan. On selection, the chosen card expands while others recede into blurred depth.

---

## 8.6 Main Evaluation Deck

### Purpose

This is the core interaction space.

### Overall structure

- Top progress strip
- Center stack of contact cards
- Side hint rails
- Bottom contextual action dock
- Hidden gesture zones
- Background ambient field that changes based on score trend

### Contact card contents

- Contact photo or initials avatar
- Full name
- Optional company / label
- Small metadata row: phone count, email count, notes availability, last edited presence if available locally
- Relation confidence badge if inferred
- Optional “known group” chip
- Subtle background texture based on assigned cluster

### Card gesture model

#### Horizontal swipe

- Right: more important / closer
- Left: less central / weaker relevance

As the card moves:

- background halo intensifies
- category indicators animate
- score preview numerically updates in real time
- next card slightly peeks with depth transform

#### Vertical drag

- Up: currently active / should invest more
- Down: lower current relevance / maintain less

This adds a second dimension rather than replacing the main score.

#### Press-and-hold

Opens a radial quick ring around the card with attributes such as:

- Family
- Friend
- Work
- Mentor
- Complicated
- Supportive
- Inner circle
- Skip

Icons are crisp vector symbols, not pictograms with emotional faces.

#### Two-finger hold

Opens “detail mode” to make a more deliberate rating without leaving the deck.

#### Flick velocity thresholds

A fast decisive swipe creates stronger confidence weighting. A slow release creates softer weighting and leaves room for later refinement.

### Visual feedback

The card should feel physically present:

- soft shadow
- perspective tilt
- stretch/compression on drag
- friction resistance near center
- spring return when cancelled
- layered depth with second and third cards visible underneath

### Bottom dock

Not a traditional fixed tab bar. Instead, a floating pill dock with:

- Undo
- Skip
- Detail
- Group view
- Pause session

Dock icons gently morph in and out depending on gesture state.

### Top progress strip

Shows:

- number processed
- number skipped
- current streak
- cluster confidence progress

This bar is interactive. Pulling it down expands a mini map of the evaluation session.

### Edge actions

- Swipe from left edge: open session queue
- Swipe from right edge: open live cluster view
- Swipe down from top: reveal metrics
- Pull up from bottom: open quick filters

### Haptics

Subtle, layered haptic system:

- soft tick on crossing score thresholds
- firmer pulse on confirmed category set
- muted rebound when action is cancelled
- satisfying low-impact confirmation on completed card

---

## 8.7 Contact Detail Overlay

### Purpose

Provide deeper editing without losing flow.

### Layout

Half-sheet or full-screen expansion with shared element transition from the card.
Contains:

- large avatar/photo
- full name
- notes field for personal memory prompts
- relationship sliders
- cluster assignment
- tags
- timeline of evaluation changes
- optional reminder-to-revisit flag

### Components

- smooth segmented controls
- radial score dial
- linked chips
- note composer
- relationship descriptors
- “pin to core circle” action
- “mark dormant” action

### Motion

The contact card expands into the overlay while retaining its position and color context. Metrics fade in sequentially. Closing the sheet reverses the motion fluidly.

---

## 8.8 Review Queue

### Purpose

Process skipped or uncertain contacts.

### Layout

A horizontally scrollable ribbon of mini-cards above a larger active review card. User can reorder by dragging mini-cards.

### UX

This screen should feel less intense than the main deck. It uses:

- tap to select
- short swipe for provisional score
- drag-and-drop into temporary bins like “Later”, “Unsure”, “Done”

### Bins

Represented as beautiful translucent containers with orbit animations rather than folder icons.

---

## 8.9 Cluster Editor

### Purpose

Let the user review automatic grouping and manually adjust it.

### Layout

Canvas-based node field:

- bubbles represent contacts
- group islands represent inferred clusters
- contact can be dragged between islands
- pinch to zoom
- lasso select multiple contacts
- tap cluster header to rename or recolor

### Cluster examples

- Family
- Close friends
- Work
- Creative circle
- Dormant ties
- Support network
- Professional contacts
- Peripheral contacts

### Motion

Dragging a contact bubble stretches a magnetic tether toward nearby clusters. Clusters pulse slightly when they can accept a drop. Bubble collisions are softly simulated.

---

## 8.10 Summary Generation Transition

### Purpose

Bridge the rating phase to the insights phase in a cinematic way.

### Sequence

1. The last card swipes away.
2. The entire deck collapses into particles.
3. Particles fly toward the center of the screen.
4. A spherical social map grows from those particles.
5. Metric labels emerge around it.
6. The app transitions seamlessly into the summary dashboard.

No loading spinner. The transformation itself is the progress indicator.

---

## 8.11 Animated Social Bubble Summary

### Purpose

Provide the signature payoff of the product.

### Main visualization

A central Skia-rendered bubble field showing:

- core circle near center
- strong contacts in inner orbit
- meaningful but less frequent ties in mid orbit
- dormant or peripheral contacts in outer orbit
- clusters as soft atmospheric regions
- line density indicating inter-group significance
- bubble size influenced by importance
- halo warmth influenced by relationship quality
- pulse rhythm influenced by current activity weighting

### Summary sections

1. **Core Circle**
2. **Emotional Balance**
3. **Support Density**
4. **Social Concentration**
5. **Neglected Valuable Contacts**
6. **Work vs Personal Split**
7. **Relationship Quality Spectrum**
8. **People to Reconnect With**
9. **Most stable group**
10. **Potential energy drain group**

### Dashboard layout

The top half is the living bubble map. The bottom half is a vertically scrollable insight narrative made of animated cards.

### Insight cards

Each insight card includes:

- title
- metric
- small animated diagram
- concise interpretation
- optional action suggestion

Example:
“Your closest circle is compact and strong.”
“Most of your strongest ratings are concentrated in six people.”
Mini visual: six bubbles connected by stable low-noise lines.

### Interactions

- pinch to zoom into bubble map
- tap a bubble to open person insight
- scrub across time-like slider to see “what if” emphasis filters
- long press a cluster to isolate it
- double tap empty space to reset field
- drag from bottom to switch between analysis modes

### Analysis modes

- Importance view
- Warmth view
- Recency view
- Support view
- Complexity view
- Cluster view

Each mode changes motion behavior, label emphasis, and field rendering. For example, in Warmth view, halos and glow gradients dominate; in Cluster view, region boundaries and group density become clearer.

---

## 8.12 Person Insight Screen

### Purpose

Explain why a contact appears where they do in the map.

### Contents

- avatar
- name
- position in social bubble
- current score composition
- assigned cluster
- relationship confidence
- what influenced placement
- comparison to median contact
- quick actions to adjust rating

### Motion

The bubble selected in the map smoothly expands into the person detail header.

---

## 8.13 Session History Screen

### Purpose

Allow repeated reflection over time.

### Layout

Timeline of completed evaluations, each shown as a compact animated thumbnail of the social map state.

### Features

- open previous sessions
- compare two sessions
- see delta of core circle
- see which clusters expanded or shrank
- restore previous classification as baseline

### Comparison mode

Two maps side-by-side are avoided on phone due to density. Instead, use a morph view: the map transitions from one state to another with additions, removals, and migrations animated.

---

## 8.14 Settings and Privacy

### Sections

- Contacts access
- Data storage
- Reset all ratings
- Export local snapshot
- Theme
- Haptics intensity
- Motion reduction
- Hidden contacts filter
- Evaluation defaults
- About privacy

### Privacy design

Settings must reinforce trust. Show a device icon, local storage badge, and simple explanations like:
“All scoring stays on this iPhone.”
“No remote profile is created.”

---

## 8.15 Export / Share Snapshot

### Purpose

Allow the user to save a beautiful static or animated summary image/video locally.

### Export types

- Poster image of social bubble
- Minimal statistics card
- Animated short loop rendered on-device
- Personal insights PDF snapshot if desired

### Design

The exported visuals should be elegant, anonymous if needed, and configurable to hide names.

---

## 9. Relationship Rating Model

The scoring system should be multi-dimensional but invisible by default.

### Base dimensions

- Importance
- Comfort / positivity
- Activity relevance
- Desired future attention

### Optional modifiers

- Stability
- Complexity
- Supportiveness
- Professional value
- Emotional weight

### UX translation

The user should not always see raw numeric sliders. Instead:

- gestures map to weighted score changes
- subtle descriptors communicate ranges
- fine-tuning uses elegant dials or scrubbers

This preserves speed and avoids spreadsheet fatigue.

---

## 10. Design System Components

### 10.1 Cards

Rounded, premium, tactile, layered, with subtle border light and responsive shadows.

### 10.2 Chips

Pill-shaped, soft glass feel, icon + text, springy insertion/removal animation.

### 10.3 Bubble nodes

Skia-rendered circles with inner gradient, soft edge blur, optional halo, label lockups.

### 10.4 Dials

Circular scrub controls with low-friction rotational gesture, used in deep detail mode.

### 10.5 Progress constructs

No default spinners. Progress shown via orbital motion, particles, ring formation, and metric tickers.

### 10.6 Sheet system

Half-sheet, full-sheet, and floating contextual sheet all share the same motion language.

---

## 11. Motion System

Motion is a primary identity layer.

### Principles

- Nothing abrupt without reason
- Motion should explain hierarchy and causality
- Every gesture should feel physically resolved
- Data transitions should feel alive, not decorative

### Techniques

- spring-based card movement
- shared element transitions
- bubble physics
- soft collision systems
- breathing halos
- parallax backgrounds
- number tweening
- shader-like gradient shifts via Skia
- trailing particles during important transitions

### Accessibility

A reduced motion mode must replace complex transforms with fades, scale, and shorter movement distances while preserving clarity.

---

## 12. Offline Data and Persistence

### Stored locally

- normalized contacts
- evaluation scores
- tags
- clusters
- skipped status
- session history
- export preferences
- theme and motion settings

### Security

App-private local storage. Sensitive user interpretations should not leak into logs or analytics. No remote telemetry required for core product behavior.

---

## 13. Asset Strategy

The app must not depend on live internet access for operation. Decorative graphic elements may originate from remote source libraries during content preparation and design pipeline, but in production they should be:

- bundled with the app,
- cached permanently after first install content pack setup if ever needed,
- or converted into local static assets.

For visual illustrations, recommended source categories:

- abstract light textures
- blurred atmospheric backdrops
- neutral portrait placeholders for marketing screens only
- gradient overlays
- geometric line patterns

Recommended implementation approach:

- Use remote-source licensed art to create final optimized PNG/WebP/SVG assets
- Store them locally in the shipped app
- Render icons exclusively via vector-icons, custom SVGs, and line icon sets
- Never use emojis anywhere in product UI, onboarding, insights, badges, or exported visuals

---

## 14. Production-Ready Notes

This app should not feel like an experiment. It must include:

- robust permission handling
- interruption-safe session saving
- efficient contact list normalization
- high-performance rendering for large contact sets
- memory-conscious bubble map rendering
- reduced motion accessibility support
- graceful handling of contacts without names/photos
- deterministic scoring persistence
- local export reliability
- clear reset and privacy controls

For large contact books, the app should use virtualization where possible in supporting lists, incremental preprocessing, and optimized Skia node rendering strategies.

---

## 15. Final Experience Summary

Bonda is not a utility that merely ranks contacts. It is a beautifully designed personal reflection tool that turns the structure of a user’s relationships into something touchable, understandable, and visually memorable. The rating flow is quick, tactile, and intuitive; the analytics are cinematic and emotionally meaningful; the overall app feels private, intelligent, and premium from the first frame to the final summary.

Its success depends on three things being executed at a very high level:

1. exceptionally fluid gesture-based evaluation,
2. a visually striking but readable social bubble visualization,
3. a calm, trustworthy, privacy-first product atmosphere.

If built to this specification, Bonda can stand out as a sophisticated offline iOS app that uses contact data in a genuinely human-centered way rather than as raw utility.
