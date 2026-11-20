**Add your own guidelines here**

# System Guidelines

This file defines the authoritative rules, constraints, and behavioral standards for the PNC Securities Lending Console prototype. All AI generations, modifications, and extensions must follow these rules.

---

## General Guidelines
- Use vertical scrolling instead of content compression
- No clipped content in 16:10 frames
- No hidden or truncated UI
- No placeholder states in production flows
- No dead-end interactions
- No decorative-only controls
- Preserve state across screens
- No visual resets between steps
- No duplicated workflows
- No disconnected screens

---

## Layout & Frame Rules
- Maintain 16:10 aspect ratio (1680×1050)
- Fixed header where applicable
- Fixed footer where applicable
- Scrollable main content area
- overflow-y-auto for content containers
- overflow-hidden for frame containers
- No horizontal scrolling
- No forced scaling
- No frame clipping
- No content shrinking to fit frames
- Padding and hierarchy must remain readable during scroll

---

## Navigation Rules
- Every button must navigate or change state
- Every link must resolve to a valid destination
- No duplicate hotspots
- No overlapping click zones
- No legacy prototype connections
- No orphaned routes
- All screens must have an exit path
- Navigation must be reversible

---

## Workflow Rules
- Start Application must navigate directly to Step 1 (Customer Information)
- No intermediate confirmation screens
- No modal-based entry flows
- Step rails must update state automatically:
  - In Progress
  - Completed
  - Inactive
- Save and Continue must advance workflows
- Back must preserve data state
- Submit must generate confirmation state
- Override must preserve context
- No duplicate flows for same task

---

## Step Rail Behavior
- Current step: In Progress
- Completed steps: Completed
- Upcoming steps: Inactive
- Status must update on:
  - Next
  - Back
  - Save and Continue
  - Submit
- Step rail must reflect true system state

---

## Data Continuity Rules
- Context must persist across screens
- No visual resets between flows
- No duplicate data entry
- No re-selection of previously selected data
- Manual Evaluation must reflect Auto Evaluation selections
- No static or hard-coded account rendering
- No duplicated rendering of the same entity

---

## Evaluation System Rules

### Auto Evaluation
- Must support multi-selection
- Selection state must persist
- Override must not reset selections

### Manual Evaluation
- Must dynamically render only selected Auto Evaluation accounts
- No static account cards
- No placeholder accounts
- If none selected, show instructional empty state
- Must preserve account context from Auto Evaluation
- Must show transparency label indicating carried-over data

---

## Modal Rules
- All modals must:
  - Open with backdrop
  - Close with X
  - Close on backdrop click
  - Support vertical scrolling
  - Never clip content
  - Never trap navigation

---

## Form Rules
- All inputs must accept user input
- All dropdowns must open
- All radios must toggle
- All checkboxes must toggle
- All forms must be scroll-accessible
- No hidden required fields
- No disabled flows without explanation

---

## Interaction Rules
- Every action must produce feedback
- No silent actions
- No fake loading states
- No decorative animations
- All interactions must be functional

---

## Prototype Integrity Rules
- No broken links
- No dead states
- No undefined states
- No placeholder overlays
- No duplicated modals
- No legacy components
- No deprecated flows

---

## Enterprise UX Standards
- Continuity of state
- Predictable behavior
- Transparent system logic
- Trust through consistency
- Clear system feedback
- Professional interaction patterns
- Production-grade UX behavior

---

## Prototype Quality Bar

The system must behave as:
- A cohesive enterprise application
- A complete end-to-end workflow
- A functional system prototype
- A production-grade UX simulation

Not:
- A slide deck
- A visual-only mockup
- A disconnected prototype
- A static case study

---

## Governance Rule

Any new screen, component, flow, or interaction must:
- Follow these rules
- Integrate with existing flows
- Preserve continuity
- Maintain state logic
- Respect layout constraints
- Preserve enterprise UX standards

---

## Authority Statement

This document is the system authority file. If any generation conflicts with this file, this file overrides all other instructions.
<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
Rules for how the AI should make generations look like your company's design system

Additionally, if you select a design system to use in the prompt box, you can reference
your design system's components, tokens, variables and components.
For example:

* Use a base font-size of 14px
* Date formats should always be in the format “Jun 10”
* The bottom toolbar should only ever have a maximum of 4 items
* Never use the floating action button with the bottom toolbar
* Chips should always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

You can also create sub sections and add more specific details
For example:


## Button
The Button component is a fundamental interactive element in our design system, designed to trigger actions or navigate
users through the application. It provides visual feedback and clear affordances to enhance user experience.

### Usage
Buttons should be used for important actions that users need to take, such as form submissions, confirming choices,
or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

### Variants
* Primary Button
  * Purpose : Used for the main action in a section or page
  * Visual Style : Bold, filled with the primary brand color
  * Usage : One primary button per section to guide users toward the most important action
* Secondary Button
  * Purpose : Used for alternative or supporting actions
  * Visual Style : Outlined with the primary color, transparent background
  * Usage : Can appear alongside a primary button for less important actions
* Tertiary Button
  * Purpose : Used for the least important actions
  * Visual Style : Text-only with no border, using primary color
  * Usage : For actions that should be available but not emphasized
-->
