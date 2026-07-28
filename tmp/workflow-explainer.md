# Nate's AI Dev Workflow — Briefing Document

**Purpose:** this document exists so a writing collaborator who has *no access to the repo*
can help draft a blog post about this workflow. It describes what each piece does and why,
not how each is implemented line-by-line.

**Audience for the eventual post:** people using AI to build technical things — many of them
developers or managers of developers, but not exclusively. Also prospective hiring managers
reading it as evidence of how skilled the author is at working with AI. So: the post should
show judgment and tradeoffs, not just a tool list.

Source of truth for most of it: a personal `dotfiles` repo
(`github.com/nathaniel-may/dotfiles`, branch `main`) containing `install.py`,
`claude-skills/`, `codex-skills/`, `claude-agents/`, `tools/sbx-new/` (a Rust CLI),
`tools/gh-agent-key`, `tools/sbx-kits/`, and `docs/` design records.

---

## 1. The stack at a glance

```
M3 MacBook (daily driver, left awake with caffeinate + screen off — the one machine that holds credentials)
  └── UniFi Teleport VPN  ..... way back into the home network from anywhere
      └── ssh (from Termux on mobile, or Terminal.app locally)
          └── herdr  .......... terminal agent multiplexer; 1–6 agents at a glance, detachable
              └── sbx-new  .... custom launcher: one disposable, isolated sandbox VM per agent session
                  └── Claude Code or Codex CLI
                      └── skills (/dev-workflow, /pr-review, quality-gate)
                          └── subagents (designer, planner, reviewer, reviser, implementor, history-rewriter)
                              └── git + GitHub (issue = run log, wip branch, PR)
```

Two through-lines worth building the post around:

1. **Every layer is about isolation and legibility.** Agents get real autonomy — they write
   code, commit, push, open PRs — but never where a mistake can damage the host checkout,
   leak a broad credential, or vanish without a record.
2. **The same session follows you.** Work started on a phone is *literally the same session*
   on the laptop later. Mobile is continuation, not a separate mode.

---

## 2. The machine and the way in — M3 + Teleport + Termux

- **One M3 MacBook, the daily driver.** Not a server, not a cloud box. It's left on with
  `caffeinate` and the screen off when leaving the house.
- **UniFi Teleport** is the VPN back into the home network. Chosen because UniFi gear was
  already there — Tailscale would do the same job otherwise. It's not a fancy choice, it's
  the zero-marginal-cost one.
- From mobile, the entry point is **Termux → ssh → herdr**. Because the agent sessions live
  on the laptop, walking in the door and sitting down at the laptop resumes *the exact same
  panes*. That seamlessness is the whole point: **mobile isn't a separate workflow, it's a
  continuation of the one workflow.** Most real work still happens at the laptop; the phone
  covers the in-between time.
- **Plain `ssh`, not `mosh`** — and there's a specific, documented reason (see §3.1). Over a
  mobile connection ssh drops once or twice on a typical outing, which is annoying but
  livable, and herdr's detach/reattach absorbs most of the pain.

---

## 3. herdr — running 1–6 agents at once

[`herdr`](https://herdr.dev) ([github](https://github.com/ogulcancelik/herdr)) bills itself as
an *"agent multiplexer that lives in your terminal"* — a single Rust binary, tmux-style
prefix keys plus first-class mouse, real terminal views rather than a wrapped
reinterpretation, detachable sessions that survive restarts and reattach over ssh, and a
socket API that agents themselves can drive. Its headline feature is the one that matters
here: **every agent at a glance — blocked, working, done.**

In practice: **1–6 concurrent agents, most commonly 3.** Supervision is not watching code
scroll by. It is:

- making decisions when an agent hits a human gate,
- answering questions,
- choosing which threads to continue and which to **kill**,
- and then doing final coordination — merging — in the GitHub UI.

That last part matters: herdr is where work is *supervised*, GitHub is where it's *resolved*.

The hard integration problem is that the agent doesn't run in the pane — it runs *inside a
sandbox VM*. `sbx-new` bridges this in two opt-in layers, and is a complete no-op outside a
herdr pane:

- **Layer 0:** sets `HERDR_AGENT=claude|codex` on its own environment before creating the
  sandbox, so herdr's screen-detection still identifies the pane.
- **Layer 1:** installs a hook inside the sandbox (Claude's `settings.json` / Codex's
  `hooks.json`) that writes agent state to a status directory, plus a detached watcher on
  the host that translates it into `herdr pane report-agent` / `release-agent` calls.

The status directory is bind-mounted at the *identical path* inside and outside the sandbox
so both sides agree on it. Without this bridge, herdr would see a pane running `sbx` and
have no idea whether the agent inside it was blocked on a question.

### 3.1 The mosh bug (precise details)

**[mobile-shell/mosh#1364 — "Mouse support has issues when terminal does not support all
modes."](https://github.com/mobile-shell/mosh/issues/1364)** Opened 2025-12-09 by
`Imberflur`; still open. Nate's confirming comment is dated **2026-07-15**.

The mechanism, exactly:

- Zellij-style clients request the mutually-exclusive mouse modes in ascending order of
  preference (`1002` → `1003` → `1006`), relying on terminal emulators to *ignore* requests
  for modes they don't support and stay in the previous mode. That's common emulator behavior.
- **mosh instead explicitly disables the previously-enabled mode** and stores only the most
  recent one.
- **Termux doesn't support any-event mode (`1003`)**. So when the `1003` request goes
  through mosh, mosh turns off `1002` and stores `1003` — which Termux won't honor — and the
  net result is **all mouse reporting disabled**.
- Nate's report: `Termux → mosh 1.4.0 → herdr` loses mouse support; `Terminal.app → mosh 1.4.0
  → herdr` works fine, because that terminal does support `1003`.
- Suggested fix in the issue: stop explicitly disabling the current mode; store all requested
  modes in request order so they can be replayed to the client in the right order.

**Why it belongs in the post:** it's a tidy example of what actually breaks when you push a
workflow onto a phone. Not "AI is hard" — a mouse-mode negotiation bug three layers down.
The cost of it is real (no mosh means no roaming/resumption over a flaky mobile link, so ssh
drops once or twice per trip) and the response was to file/confirm upstream and live with the
degraded path, not to abandon the setup.

---

## 4. sbx-new — the sandbox launcher (the custom piece)

`sbx-new` is a Rust CLI wrapping [`sbx`](https://github.com/anthropics/sbx), Anthropic's
sandbox tool. Usage is deliberately trivial:

```sh
sbx-new claude
sbx-new codex
```

Each invocation creates a **fresh, named, disposable sandbox** and attaches to it. What it
does, in order of importance:

### 4.1 It never mounts your checkout
Instead of mounting the repo you invoked it from, `sbx-new` first makes a **private,
standalone Git clone** under a temp directory and mounts *that*. This is the security
boundary: branch switches, resets, rebases, and Git-metadata changes inside the agent cannot
touch the host checkout.

- Clean checkout → the clone is an immutable snapshot of the local commit (so committed local
  work is available to the agent).
- Dirty / unborn / mid-rebase / linked-worktree checkout → it deliberately falls back to a
  fresh snapshot of the remote default branch. It **never** stashes, resets, or cleans your
  working tree to make itself work. It prints the chosen OID and clone path so nothing is lost.
- Before launch the clone is hardened: only the validated managed `origin` remains, plus a
  narrow SSH command and a non-secret marker file (`.git/sbx-new-workspace.json`) that lets
  `/dev-workflow` recognize "I'm already inside an isolated clone, I can work here directly."

### 4.2 Narrow, repo-scoped GitHub credentials
A companion tool, `gh-agent-key`, provisions a **per-repository Ed25519 deploy key** and
points only that checkout's `origin` at a managed `gh-agent-*` SSH host alias.

- `sbx-new` accepts *only* these managed origins. Plain HTTPS origins, ordinary `github.com`
  SSH origins, and arbitrary aliases **fail closed**.
- Only the one relevant key and a minimal SSH config are copied into the sandbox — never a
  general-purpose `~/.ssh`.
- GitHub's pinned host key is installed with strict host-key checking, so Git never stalls on
  a first-contact SSH prompt inside an automated session.
- Deploy keys don't bypass branch protection, so protected branches still require the normal
  PR flow — exactly the intent.

One sentence for the post: **an agent gets write access to exactly one repo, from a
disposable machine, working on a copy.**

### 4.3 A batteries-included, cached toolchain
A declarative "kit" builds a full-toolchain image once; every later launch reuses a saved
local template, so sandboxes start fast without re-downloading packages. It installs a fixed
current-version baseline: build-essential/pkg-config/OpenSSL, Node/npm, TypeScript,
Python/pip, Rust (rustup, rustfmt, clippy, rust-src), PureScript/Spago/purs-tidy,
GHC/Cabal/Stack, `just`, dbt with the DuckDB adapter, the DuckDB CLI, plus both the Claude
Code and Codex CLIs.

- The image is built by a **disposable builder** sandbox that mounts an empty workspace —
  never a checkout — and receives no credentials, skills, or hooks. Only the final sandbox
  gets those.
- The kit's package-source egress is granted **only to the builder** and is not retained in
  the saved template. Runtime sandboxes get a separate, narrow allow-list (npm, PyPI,
  PureScript registry, jsDelivr, Playwright CDN, dbt hub, GitHub release assets).
- Templates refresh in the background when stale; `--refresh-image` forces a sync rebuild.
- **No per-project toolchain config or version pinning** by design — projects needing a
  specific version use project-local tooling. Opinionated simplicity over a config surface.

### 4.4 A warm pool
`sbx-new` keeps a standby sandbox per agent, replenished in the background. A launch
atomically claims the standby and injects the workspace into it rather than creating one from
scratch. This is what makes "a fresh isolated machine per task" feel instant instead of
annoying — and instant-enough is what makes the isolation rule survivable in daily use.

### 4.5 Auth is checked before anything is created
Every launch requires both a global `github` and `openai` secret (plus Claude's host-managed
subscription OAuth) *regardless of which agent you start*, because either agent may shell out
to the sibling CLI for cross-model review. Missing secret → exits **before** creating a
sandbox, printing the exact fix command. `--single-agent` opts out: only the selected agent's
auth is required, and cross-family review is unavailable in that sandbox.

Claude uses subscription OAuth, not an API key. On first run, `sbx-new` opens a bootstrap
shell telling you to run `claude` → `/login`; the OAuth state is then reused by every later
sandbox, Claude *and* Codex.

### 4.6 Skills and subagents travel into the sandbox
Host-installed user skills (`~/.claude/skills`, `~/.codex/skills`) are mounted read-only and
copied into the sandbox's config dir before the agent starts. For Claude, host **subagent
definitions** (`~/.claude/agents/*.md`) are propagated the same way — without this,
`/dev-workflow` would reach the sandbox but its subagents wouldn't, and it would fail at the
first spawn. Codex needs no equivalent step because it bundles subagent references inside
each skill directory.

### 4.7 Observability
Safe operational metadata (outcomes, not secrets, command output, or auth URLs) is appended
to `~/Library/Logs/sbx-new/sbx-new.log`.

---

## 5. The dotfiles repo and `install.py`

One idempotent Python script wires the host: symlinks each skill directory into
`~/.claude/skills` and `~/.codex/skills`; symlinks each `claude-agents/*.md` into
`~/.claude/agents`; symlinks `.zshenv` (which fixes `PATH` for headless ssh — a direct
consequence of the mobile workflow); installs `gh-agent-key` into `~/.local/bin`; links the
committed sbx kit to its stable runtime path; and `cargo install`s `sbx-new` **last and in
isolation**, so a missing Rust toolchain is a soft skip and a build failure still leaves every
symlink step done. It refuses to overwrite anything that isn't already a symlink it owns.

CI on the repo itself: `cargo fmt --check`, `cargo clippy -D warnings`, `cargo build`,
`cargo test`, `ruff check`.

---

## 6. Skills — the agent-facing layer

Three skills, each installed for **both** Claude Code and Codex (parallel `claude-skills/`
and `codex-skills/` trees, same behavior, different harness idioms). Both are marked
explicit-invocation-only — they never fire on an ordinary coding request.

| Skill | What it does |
|---|---|
| `/dev-workflow` | The big one: design → human gate → plan → implement → review → cross-model review → history cleanup → PR. See §7. |
| `/pr-review` | Reviews a GitHub PR by URL/number and posts the review as a PR comment, signed with the reviewing model's identity. Checks the PR out into a reusable per-repo clone under `/tmp` so the reviewer sees whole files with context, not just a diff. Reads CI status and existing comments first so it doesn't re-raise settled points. **Only reviews — never fixes.** |
| `quality-gate` | Not user-invocable. Resolves the repo's gate script from `~/.claude/dev-workflow/quality-gates/<repo>.sh`, runs it, writes a machine-readable `status.json` (timestamp + pass/fail + captured output). One gate script per repo, written once, reused by every run. |

The Claude side also ships six **subagent definitions** — designer, planner, reviewer,
reviser, implementor, history-rewriter — each with its own tool allow-list and role prompt.
The reviewer is pinned to the strongest model; the others inherit.

---

## 7. `/dev-workflow` — the core loop

Invoked as `/dev-workflow <task>` or `/dev-workflow resume <run-id>`.

**Stage 0 — setup.** Verify `gh` auth, a GitHub origin, `jq`. Detect the real base branch
(never hardcode `main`). Generate a 6-char run ID. **Create a GitHub issue** titled
`[dev-workflow <id>] <task>` — the run's durable log. Clone `origin/<base>` into a temp
standalone clone on branch `wip/dev-workflow-<id>`. Add `.workflow/` to the clone's *local
exclude* (never `.gitignore`) so run state never pollutes the diff.

**Stage 1 — design.** A designer subagent writes a design doc, then a **critic loop**: a
reviewer subagent appends a structured verdict (`blocking` / `approved`) to a journal; on
`blocking`, a reviser subagent makes *surgical* edits addressing each issue. Max 6 rounds,
journal compacted after 3.

→ **Human gate.** The orchestrator surfaces just `## Summary` and `## Open Questions` in
chat — you approve or describe changes without opening a file in a temp clone. This is the
one place human judgment is mandatory. On approval the design is posted to the issue.

**How often does the gate actually bite?** Small tasks: rarely. **Anything slightly bigger:
almost always 2–5 rounds of human feedback before approval.** That's the number that proves
the gate is load-bearing rather than ceremonial — and it's the argument for putting the *only*
mandatory gate at design rather than at code review. Feedback at the design stage costs a
paragraph; the same correction after implementation costs a rewrite.

### When runs get killed (and why that's the gate's real payoff)

Killing a thread is a normal part of supervision, and it almost always happens **during or
right after the design stage** — cheaply, before any code exists. The recurring reasons:

- the design work discovered a **hard blocker** — e.g. an API that simply doesn't support what
  the task assumed;
- **the premise wasn't well founded** in the first place;
- the task is really **blocked behind tech debt** — in which case the run gets shelved, the
  debt gets handled first (often as its own dev-workflow run), and the original task comes
  back afterward.

This reframes the design stage: it isn't only a quality filter on *how* something gets built,
it's a **cheap discovery mechanism for whether it should be built at all.** An agent doing 10
minutes of design work to establish "the API can't do this" is a bargain, and it's a strong
counter to the assumption that agent workflows are only about writing code faster.

**Stage 2 — plan.** A planner subagent turns the design into a step-by-step plan; same critic
loop. **No human gate here** — deliberately. The design gate is where human input matters;
the plan stage exists to iron out detail, so it auto-proceeds on reviewer approval.

**Stage 3 — implementation.** An implementor subagent writes code, commits, runs the quality
gate. The orchestrator then enforces a hard **contract** after every exit:
1. working tree clean (nothing uncommitted),
2. `status.json` exists,
3. the gate's timestamp is **not older than the last commit** — i.e. it actually ran *after*
   the final change.

Violations trigger a bounded respawn with a specific correction. Then a code-review critic
loop runs against the real diff (`origin/<base>...HEAD`), max 6 rounds.

Efficiency detail: the implementor is kept **warm** across fix rounds (continued by message
rather than respawned cold), because a cold start re-reads the plan and re-explores the
codebase every time — the dominant avoidable cost of the loop. It resets to a fresh agent only
at the round-3 compaction boundary, to bound context growth.

**Stage 3.5 — cross-model review.** *The most distinctive part.* Before the PR, the diff is
reviewed by **the other model family**: a Claude-driven run shells out to `codex exec` (and
vice versa) for an independent read-only second opinion, up to 3 rounds. Blocking findings go
back to the implementor. Safeguards, because you're handing your working tree to another
vendor's agent:
- run read-only where supported, but the *guaranteed* protection is a **worktree-integrity
  check after every invocation** — if the sibling touched anything, hard-reset to the
  pre-invocation commit and warn.
- the verdict is extracted from sentinel lines, taking the *last* pair, because `codex exec`
  echoes its own prompt back to stdout (a real bug that had to be fixed).
- **the stage never blocks the run**: on any failure it logs why, warns loudly, and continues.

**Stage 4 — history rewrite.** A history-rewriter subagent squashes the messy trail into 1–4
clean, well-titled commits via soft reset (non-interactive — no `rebase -i`).

**Stage 5 — PR.** Push the wip branch, open the PR with `Closes #<issue>`, and post a **recap
comment**: rounds and verdict per stage, which model reviewed what, how many commits —
assembled from machine-readable stage-summary comments left on the issue during the run.

### Cross-cutting mechanisms

- **The GitHub issue is the state store.** Design and plan are posted as issue comments with
  HTML-comment markers. `resume <run-id>` finds the issue, reads which markers exist, infers
  the stage, reconstructs the artifacts, and can even re-clone the wip branch if the temp
  clone is gone. No database, no checkpoint files — just artifacts a human can read.
- **Anti-sycophancy rule.** A reviewer may not emit `approved` without enumerating at least
  one *specific, falsifiable* objection it checked for and found absent or resolved. Approval
  with an empty `### Considered` section is **malformed** and gets respawned. The orchestrator
  validates structure; the prompt is what discourages rubber-stamping.
- **Boundary-crossing rule.** If a change touches a serialization / FFI / IPC / worker /
  network boundary, green unit tests are explicitly declared insufficient — the reviewer must
  check for an integration test that exercises the real boundary. Existing test skipped =
  blocking; no such test = advisory, escalated to the human.
- **Post-validation over trust.** Every subagent's output is structurally validated: round
  number matches, verdict word present, approved-with-blocking-issues rejected. Malformed
  output = respawn with an exact correction, which does not consume a round.
- **Escalate, don't guess.** Every loop has a round cap; on exhaustion the orchestrator stops
  and asks the human, showing the unresolved issues.
- **Run metrics.** Every subagent return appends a row to `run-metrics.tsv` (stage, agent,
  round, verdict, tokens, tool uses, duration, self-reported model) — a per-run cost and round
  audit log.
- **Model attribution.** Each subagent self-reports its model identity on exit (`unidentified`
  rather than a guess), so the PR recap can say who reviewed what.

### How long a run actually takes

Depends entirely on scale: **~5 minutes** for small things, **up to an hour** for large ones.
**The tasks deliberately carved out for this workflow land around 20 minutes.** That
20-minute median is itself a workflow decision — tasks are *scoped to fit*, which is part of
why 3 concurrent agents is manageable.

---

## 8. Two vendors, on purpose — Claude Max 200 + Codex Pro

- Subscriptions: **Claude Max (200)** and **Codex Pro**. Strictly personal setup, no team
  infrastructure.
- **Both roles, genuinely alternating.** Claude runs most primary work until its 5-hour usage
  window is saturated, then work shifts to Codex. Each also serves as the *cross-reviewer* for
  the other.
- So the dual-vendor design does double duty: **better review** (a different model family
  catches different things) and **better throughput** (rate-limit balancing across two
  providers). That's an unusually honest, practical reason to run two subscriptions and worth
  saying out loud in the post.

**Does cross-model review actually earn its keep? Yes — nearly every run turns up something.**
The effect is most pronounced when the two families are at **comparable quality but reach
different results** — the author's example is Codex 5.6 ("sol") against Opus 4.8, where the two
were close in quality and consistently disagreed in useful ways. When one family is clearly
ahead (the author's read: Opus 5 currently outclasses sol), the exchange is less symmetric,
but the second pass still surfaces things the first missed.

That's the real argument for a cross-family reviewer, and it's stronger than the usual
"ensemble" hand-wave: **near-parity plus different failure modes is what makes the second
opinion valuable.** Two instances of the same model mostly agree with themselves.

### Why Gemini was dropped — it's an auth-model problem, not an ACP problem

The Gemini Pro subscription was cancelled because Google's CLI couldn't be integrated. **Two
different blockers in two different places, and it's worth keeping them straight:**

**In Zed: no ACP.** Google replaced **Gemini CLI** with **Antigravity CLI** (`agy`), a Go
binary (commenters on the tracking issue reference a gemini-cli sunset on 6/18). Gemini CLI
supported [ACP](https://github.com/zed-industries/agent-client-protocol) — JSON-RPC over
stdio, the protocol editors use to drive an external agent (`gemini --acp`). `agy` doesn't;
the request is [antigravity-cli#31](https://github.com/google-antigravity/antigravity-cli/issues/31),
filed 2026-05-20, still open. That killed it as a Zed agent — **but it's orthogonal to this
workflow, which never speaks ACP.** Cross-review shells out to `codex exec` directly, and
herdr tracks state through the hook bridge (it even ships an `antigravity` detection manifest).

**In this flow: the login flow can't survive a disposable sandbox.** `agy` works fine with an
**API key** — in Zed and in sbx alike. The problem is subscription auth: **it requires a
browser login**, which does not work headlessly inside a sandbox, and — the decisive part —
**would have to be redone on every single launch.** A workflow whose whole premise is *a fresh,
disposable VM per task* cannot absorb a per-launch interactive browser handshake. That's not
an inconvenience, it's a structural mismatch.

Compare what `sbx-new` does for the two agents it does support: Claude's subscription OAuth
state is captured **once** on the host (one bootstrap `claude` → `/login`) and then **reused by
every later sandbox, Claude and Codex alike**; the same is true of the OpenAI OAuth secret.
`sbx-new` checks these by service name — `github`, `openai`, `anthropic`. The requirement isn't
"support ACP," it's **auth state that can be captured once on the host and injected into a fresh
machine.** Google's subscription login doesn't offer that shape.

**The generalizable lesson for the post:** as sandboxed, disposable agent environments become
normal, *how a vendor lets you authenticate becomes a first-class integration constraint* — as
important as model quality. A browser-only login is a soft lock-in to long-lived, hand-configured
machines. (Nice fossil of the decision, if you want it: `agy` is the literal string used as the
rejected-agent example in `sbx-new`'s CLI test suite, `cli.rs:129`.)

Secondary, and only relevant if auth were solved: `agy`'s one non-interactive mode, `-p/--print`,
emits a single opaque block with skip-permissions-only and no conversation state across
invocations — so it couldn't fill the cross-reviewer role either, which needs parseable output
and a session that survives multiple rounds.

---

## 9. Git and GitHub conventions — and why GitHub is the interface

- One GitHub **issue per run** = the durable, inspectable log.
- Work happens on `wip/dev-workflow-<run-id>`, always branched from `origin/<base>` so a run
  never inherits whatever branch you happened to be on.
- Every change lands through a PR — deploy keys can't bypass branch protection by design.
- Commit history is rewritten to be readable *before* review, not after.
- `/pr-review` posts reviews signed with the reviewing model, so cross-model review is visible
  in the PR conversation.
- **The dotfiles repo is developed with this workflow.** Its history is full of
  `Merge pull request #NN from nathaniel-may/wip/dev-workflow-<id>` — the workflow builds and
  improves itself. Good narrative spine.

**The strategic point:** GitHub is deliberately the coordination surface, not the tooling.
Collaborators can run a completely different personal setup — different editor, different
agent, no agent at all — and this workflow never has to know. Issues, PRs, and reviews are the
contract. That scales to teams *without* forcing everyone onto identical tools, which matters
especially across company boundaries. Forcing tool uniformity is the failure mode; a shared
interface is the fix.

---

## 10. Origin story — what this replaced

**Before: Zed as the agent host.** The problems, in the author's words:

- **No mobile continuation** — leaving the desk meant leaving the work.
- **Manual coordination between reviews** — no structured hand-off from one review to the next.
- **One window doing two jobs** — manual inspection *and* agent changes in the same place,
  which meant constantly resizing panels.

**After: a clean split of responsibilities.** Zed is now for *manual inspection* — reading
code as a human. herdr is for *agent management*. Neither pretends to be the other. That
separation, plus GitHub for coordination, is the actual insight; the rest is plumbing.

**Also inherited from an earlier iteration:** the workflow began as a **LangGraph-based Python
FSM** (`dev-agent-workflows`), then was ported to Claude Code skills to shed Python and
LangGraph while keeping the essential properties.

- Survived the port: stage structure, gate placement, critic-actor loops with a journal, the
  anti-sycophancy rule, deadlock escalation, worktree isolation.
- Changed: LangGraph checkpoints → GitHub issue comments; typed structured outputs →
  prompt-shaped markdown plus orchestrator post-validation; `interrupt()` → in-chat questions.
- There's a documented **spike** into Claude Code's `SubagentStop` hook concluding it gives
  exactly one retry per subagent and can't control subagent cwd — which is why every subagent
  uses absolute paths and enforcement lives in the orchestrator rather than in hooks.
- Later additions in rough order: cross-model review → warm pool + parallel setup for launch
  speed → propagating subagent definitions into sandboxes → Linux support → model
  self-reporting, stage summaries, and the PR recap.

---

## 11. The security lesson — no catastrophe, one good forcing function

No major incident. But **several API keys had to be rotated** because of how aggressively
agents grep through a filesystem. The response was not to clamp down on the agents — it was to
fix the underlying bad practice:

> **All keys now live in the macOS keyring. None in plaintext `.env` files — the way it should
> always have been, and the way most developers still don't do it.**

This is a strong, quotable beat for the post: *running agents on your machine is an honest
audit of your own secret hygiene.* The agent didn't create the exposure; it revealed it. And
the layered isolation (`sbx-new`'s disposable sandbox, per-repo deploy keys, no general-purpose
`~/.ssh` in the sandbox) is the structural half of the same lesson.

---

## 12. Design principles visible throughout

1. **Isolation by construction, not by discipline.** The host checkout is never mounted; the
   credential is scoped to one repo; the sandbox is disposable.
2. **Fail closed, fail early.** Wrong origin type, missing secret, missing tool → exit before
   creating anything, with the exact fix command.
3. **Never repair the human's state.** Dirty checkout? Fall back to a clean base and say so.
   Don't stash, don't reset, don't clean.
4. **Artifacts a human can read.** Markdown journals over JSON; GitHub issue comments over a
   checkpoint DB. The readers are an LLM and a human debugging a run.
5. **Trust but verify, mechanically.** Contract checks, post-validation, worktree-integrity
   checks. Prompts set intent; the harness enforces it.
6. **Human gates where judgment matters, autonomy everywhere else.** Exactly one mandatory
   gate (design), plus escalation on deadlock.
7. **Diversity beats redundancy.** A second opinion from a *different model family* catches
   what a same-family reviewer won't — and balances usage limits besides.
8. **Optional layers must be true no-ops.** herdr integration, cross-model review, and the
   quality gate all degrade gracefully when absent.
9. **Opinionated defaults over configuration.** One toolchain, no version pinning, one gate
   script per repo.
10. **Interoperate at the artifact layer, not the tool layer.** GitHub is the contract;
    everyone else's setup is their business.

---

## 13. Numbers and names a post might want

- Concurrency: **1–6 agents, typically 3.** Run length: **~5 min small / ~20 min typical /
  up to 1 hr large.**
- Design gate: rarely bites on small tasks; **2–5 rounds of human feedback** on anything
  bigger. Cross-model review turns up something **on nearly every run.**
- Review loops: **max 6 rounds**, journal compacted after **3**. Cross-model review: **max 3**
  rounds, 15-minute timeout per invocation. Contract-violation respawns: **max 3**.
- Run IDs: 6 hex chars. Branches: `wip/dev-workflow-<id>`. Working dirs: `/tmp/dev-workflow-<id>`.
- Quality gates live at `~/.claude/dev-workflow/quality-gates/<repo-name>.sh`, ordered
  format → lint → tests. The workflow *asks you to define one* the first time it meets a new
  repo, and offers to include an e2e/smoke job it spots in CI.
- Subscriptions: Claude Max 200 + Codex Pro. Gemini Pro cancelled (§8).
- Sandboxes are named per launch; host state lives under `~/.local/state/sbx-new/`.
- Bugs worth citing: [mosh#1364](https://github.com/mobile-shell/mosh/issues/1364) (mouse
  modes, Termux) and [antigravity-cli#31](https://github.com/google-antigravity/antigravity-cli/issues/31)
  (no ACP mode).
- Repo-internal bug color: prompt-echo poisoning the cross-review verdict parser; a `#` comment
  inside a YAML folded scalar silently swallowing the rest of an install script; a stale
  bundled CLI shadowing the fresh one on `PATH`; macOS `/tmp` → `/private/tmp` canonicalization
  silently defeating permission allow-rules.

---

## 14. Notes for the writer — what's settled, what's pending

**Settled** (all four earlier gaps are now answered in place): the `agy` rejection is an
**auth-model** story, not an ACP story (§8); cross-model review pays off on **nearly every
run**, most visibly at near-parity (§8); the design gate takes **2–5 rounds on non-trivial
tasks** (§7); and kills happen **at design time**, for hard blockers, unfounded premises, or
tech debt that needs handling first (§7).

**Pending — real data, deliberately not yet used.** The workflow only recently started
recording per-stage rounds, verdicts, models, and durations (the `run-metrics.tsv` file plus
the machine-readable stage-summary comments the agents post on each run's GitHub issue).
That means **the actual round counts and model attributions are scrapable from recent issue
comments** — but there isn't enough history yet to be meaningful. The author's call is to
**wait** rather than publish thin numbers.

Worth flagging as an opportunity: once there *is* a few months of data, this becomes a much
stronger, more unusual post — "here is measured data from N runs of my own agent workflow" is
a claim almost nobody in this genre can make. Either hold the post for it, or ship now and
plan a follow-up built on the numbers. Anything quantitative in the current draft should stay
framed as the author's experience, not as measured results.
