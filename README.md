# PIDAKA

**No identity. No followers. Just truth.**

A wall for things you would not sign.

You are named in private — *Ember 4702*, *Soot 1184*, something you did not pick. The wall never shows it. There are no profiles. Nobody follows anybody. A paste is not a performance. It is a confession left for strangers.

Reading is free. Dropping something requires a name, and the name stays yours.

---

## The room

**Paste.** Say it to the wall. Not them. Three thousand characters is enough for a night and not enough for a memoir.

**Listen.** Every pidaka is walked to every other door. You do not rank the village. You meet what arrived. Pass means you heard it — not that it failed.

**Burn.** An anonymous reply to the person who wrote it. They read it in Burns. They will never know who you are. You will never know who they are. That is the point.

Long copy pages. The wall does not stretch to show off.

---

## What this is not

Not a feed.  
Not a score.  
Not a brand you wear in public.  
Not a place that keeps your real name on the plaster.

If you want likes, go where likes live.

---

## Run it locally

Node 20+. Copy `.env.example` to `.env` and give it a `SESSION_SECRET`.

```bash
npm install
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).

With no `DATABASE_URL`, the wall is an in-memory demo. Restart and the village forgets. For a wall that remembers, set Postgres and run:

```bash
npm run db:push
```

Google, Apple, and phone are optional. Email still works. On this machine, a phone code may simply appear in the dialog.

```bash
npm run check    # types
npm run build    # production
```

---

## Stack

React and Vite on the front. Express, JWT, Drizzle, and Postgres on the back. One process serves the glass and the API. The doorstep queue is its own library: every live pidaka, every other person.

---

The wall is listening. It will not keep your name.
