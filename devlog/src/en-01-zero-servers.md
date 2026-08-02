---
title: I shipped an AI app with zero servers. Here's what it cost me.
date: 2026-08-01
summary: Chihaofan has AI features and no backend. Not because I'm cheap — on purpose. Here is how it works, and the four things it made impossible.
tags: architecture, privacy, buildinpublic
lang: en
order: 1
status: published
---

I built an app with AI features and zero servers.

Not because I couldn't afford one. On purpose.

**Chihaofan** is an AI fridge manager: you log what's in your fridge, it plans dinner from what you already have, flags what's about to expire, and rolls the missing items into one grocery list. First commit `2026-07-05`, live on the App Store 27 days later. 47 commits, 43,918 lines of Dart.

In that whole stack, there is no machine of mine anywhere.

## The default I refused

In 2026, the reflex when you start an app is: stand up a backend. Auth, a database, an analytics pipeline, a proxy in front of the model provider so you control the key and can meter usage.

Every one of those is a place where your users' data ends up on my hardware.

For a fridge app that seemed absurd. What I'm storing is: what you bought, what you ate, what you spent, who in your family has diabetes. That is an unusually intimate dataset for something this mundane. I did not want custody of it.

So the architecture is three pieces:

- **All data lives on-device**, in Hive. No account, no sign-up, no sync service.
- **AI is BYOK** — you bring your own API key. Requests go from your phone straight to the model provider. They never touch anything of mine, because I don't have anything.
- **Backup goes through iCloud**, into *your* Apple account. I can't read it.

No ads either, which follows directly: there's no data to target with.

## What it actually cost

This is the part most "we take your privacy seriously" posts skip, so let me be specific.

**1. Switching phones is manual.** There is no "log in and everything appears." You either turn on iCloud backup ahead of time, or you export a sync code and import it on the new device. If you do neither and lose the phone, the data is gone and **I cannot recover it for you**. Not "we'll see what we can do" — there is literally nowhere for me to look.

**2. I am blind when debugging.** No crash context tied to a user, no session replay, no server logs. When someone emails me "the meal plan looked wrong," all I have is their sentence. I've spent evenings trying to reproduce something from a two-line description. A backend would have told me in thirty seconds.

**3. An entire category of features is closed off.** Cloud leaderboards, real-time family sync, shared shopping lists that update live across two phones, server-side recipe updates without shipping a build. Not "hard" — architecturally impossible. Every time someone asks for one, the honest answer is no, and the reason is a decision I made on day one.

**4. BYOK is a real barrier.** Asking a normal person to go create an account with a model provider and paste an API key is a big ask. This is the single biggest unsolved problem in the product. I don't have a good answer yet. If you have one, I'd like to hear it.

## So how is a local agent supposed to be smart?

If the model is the user's and there's no backend, the thing I actually control is **context**. Not model size — context.

The system prompt is assembled in layers, in priority order:

1. Persona
2. **Safety rails** — allergies and dietary restrictions. Never truncated, ever.
3. Current state — what's in the fridge, what's expiring, whether you've eaten today
4. User profile snapshot — derived from your own structured data: cutting weight, household size, likes it spicy, cooks often or orders in
5. Installed skill fragments
6. Chat memory
7. Rolling summary + recent turns

When the budget is tight, truncation happens **from the bottom up**. Layer 7 goes first. Layer 2 never goes. An AI that forgets you're allergic to shellfish because the conversation got long is not a UX bug, it's a hazard.

Chat memory is capped at 30 entries, deduped, and — this matters — **visible and deletable**. There's a screen listing everything the app has remembered about you. You can edit any line or wipe all of it.

Retrieval is bigram keyword matching plus recency. No vector store. On a phone, with 30 entries, embeddings would be engineering theatre.

One honest note: the number 30 is not the output of an experiment. I picked it because it felt right and I have no way to A/B test it, because — see cost #2 — I can't see anything.

## The argument

Here is the thing I keep coming back to.

For a utility app, *not touching your data* should be the boring default, not a feature I get to put on a marketing page. The fact that I can list "no account, no ads, no data collection" as differentiators says more about the industry than about me.

The costs above are real, and for some people they'll be disqualifying. That's a fair trade to offer out loud rather than bury.

---

**Chihaofan** is on the App Store — free download, one-time **US$2.99** to unlock Pro, no subscription. Android is in the works (Google Play requires a 14-day closed test first). Optional skill packs are dietary suggestions, not medical advice.

If you try it and it breaks, email me: <blake.chen94@gmail.com>. Given the above, a detailed description is genuinely all I have to go on.
