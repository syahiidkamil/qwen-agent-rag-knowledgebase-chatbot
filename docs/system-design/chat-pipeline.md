# Chat pipeline — request lifecycle and latency analysis

This document follows one chat turn from FE keypress to last-token persistence, then ranks the steps that dominate the visible wait so we know what to tune first.

> All latencies in this doc are **estimates** based on typical Supabase pooler RTTs (ap-southeast-1) and DashScope International (Singapore) RTT and inference times. They are not measured. The last section explains how to convert them to real numbers in ten minutes if needed.

## What the user sees

```
User hits Enter
   │
   │   ~1.5 – 4.0 s of silence ("typing indicator")
   ▼
First token appears
   │
   │   answer streams in at ~30 – 60 tok/s
   ▼
Source chip(s) render with the answer
```

The ~1.5–4 s gap between Enter and the first token is the only part the user perceives as "slow". Everything that happens after the first token streams progressively, so it feels fast even when it takes a couple seconds in total.

## High-level flow

```mermaid
flowchart TD
  U([User hits Enter in ChatPanel]) --> API[POST /api/chat<br/>app/api/chat.py]
  API --> P1[Persist user message<br/>Postgres INSERT]
  P1 --> SES[/SSE: session event/]
  SES --> SA[stream_answer<br/>app/services/chat.py]

  subgraph Retrieval[Retrieval — app/services/retrieval.py]
    direction TB
    EMB[Embed query<br/>DashScope /embeddings] --> VEC[pgvector cosine top-25<br/>ivfflat index]
    VEC --> FTS[Postgres FTS top-25<br/>GIN on tsv]
    FTS --> RRF[Reciprocal Rank Fusion<br/>dedupe → top-8 chunks]
  end

  SA --> EMB
  RRF --> META[Look up filename + storage_path<br/>SELECT IN]
  META --> SRC[/SSE: sources event<br/>filename + public URL/]
  SRC --> ASS[Build Qwen-Agent Assistant<br/>system msg = grounding + chunks]
  ASS --> LLM[(DashScope<br/>qwen3.5-122b-a10b stream)]
  LLM --> TOK[/SSE: token deltas/]
  TOK -.repeats.-> LLM
  LLM --> DONE[/SSE: done event/]
  DONE --> P2[Persist assistant message + sources<br/>Postgres INSERT]
  P2 --> CLOSE[/SSE: data: \[DONE\] — stream closes/]

  classDef blocking fill:#ffe4c0,stroke:#b56b00,color:#000
  classDef instant fill:#e6f4ea,stroke:#1b5e20,color:#000
  class EMB,LLM blocking
  class RRF,SES,SRC,TOK,DONE,CLOSE instant
```

Orange boxes are the **blocking** network calls. Green boxes are either in-process work (microseconds) or SSE emissions the FE sees immediately. Read the latency table below to see how each of those orange boxes contributes to the visible wait.


## Step-by-step walk

Numbers cross-reference the sequence diagram above.

1. **Request enters FastAPI** at `app/api/chat.py:26` (`async def chat`). Body is `{messages, session_id?}`; the handler picks the last `user` message off the list as the query.
2. **Resolve or create the chat session** — `chat.py:43–51` opens a short-lived `AsyncSession` via `_sessionmaker()`, INSERTs a new `ChatSession` if `session_id` was omitted, commits, refreshes to read back the generated `id`. Each `_sessionmaker()` call goes through Supabase's session pooler.
3. **Persist the user turn** — `chat.py:54–62` opens *another* short-lived `AsyncSession`, INSERTs the user `ChatMessage`, commits.
4. **SSE: emit `session` event** — `chat.py:69` so the client can pin subsequent turns to this session.
5. **Hand off to `stream_answer`** — `chat.py:77` opens a third short-lived session and starts iterating events.
6. **Embed the query** — `stream_answer` (`app/services/chat.py:37`) calls `retrieve(session, query, top_k=8)`, which calls `embed_batch([query])` (`app/services/embedding.py:19`). One HTTPS POST to DashScope `/embeddings`, one 1024-d vector returned (`text-embedding-v3`). One serial network round-trip.
7. **Vector search** — `retrieval.py:38–46` formats the query embedding as a `vector` literal and runs `SELECT id, document_id, content FROM chunks WHERE embedding IS NOT NULL ORDER BY embedding <=> $q LIMIT 25` against the ivfflat cosine index.
8. **FTS search** — `retrieval.py:47–55` runs `SELECT … WHERE tsv @@ plainto_tsquery('english', $q) ORDER BY ts_rank(tsv, plainto_tsquery('english', $q)) DESC LIMIT 25` against the GIN index on `tsv`. **Sequential, not parallel** — `AsyncSession` is single-flight, so this fires only after step 7 returns.
9. **Reciprocal Rank Fusion** — `retrieval.py:62–84`, in-process Python: accumulate `1 / (RRF_K + rank)` across both rankings, dedupe by chunk id, take top 8.
10. **Document metadata lookup** — `chat.py:53–66` SELECTs `id, filename, storage_path` for the unique `document_id`s in the ranked chunks. One extra SELECT IN; used to attach `filename` + public URL to the SSE `sources` event.
11. **SSE: emit `sources` event** — `chat.py:71–84` sends `{document_id, filename, url, score}` per source. The FE caches these for the in-flight bubble; it doesn't display them yet (it waits for `done`).
12. **Build the Qwen-Agent Assistant** — `chat.py:88–93` instantiates `Assistant(llm=llm_cfg, system_message=...)`. The system message embeds the retrieved chunks plus the grounding instruction. First-request-after-reload pays a 3–5 s import cost because `from qwen_agent.agents import Assistant` is lazy at `chat.py:42`.
13. **Stream from DashScope chat** — `chat.py:97–106` iterates `bot.run(messages=...)`. Each iteration yields the full assistant message so far; we forward only the *delta* as a `token` SSE event. Time-to-first-token (TTFT) is the dominant user-visible cost.
14. **SSE: `done` event** — `chat.py:108` once the generator finishes. Carries `full_text` for the persistence step.
15. **Persist the assistant turn** — `app/api/chat.py:88–97` opens a fourth short-lived session and INSERTs the assistant `ChatMessage` (with the source list as JSONB).
16. **SSE: `[DONE]` sentinel** — `chat.py:99` tells the FE the stream is closed.

## Latency budget (estimated)

| # | Step | Where | Estimated | Notes |
|---|---|---|---|---|
| 2–3 | Persist user msg (2 round-trips) | Postgres pooler | 60 – 160 ms | Two separate INSERT commits, serial |
| 6 | Embed query | DashScope `/embeddings` | 250 – 600 ms | Indonesia/Vercel → Singapore RTT + model inference |
| 7 | pgvector cosine top-25 | Postgres | 20 – 80 ms | ivfflat (lists=100), cold could be slower |
| 8 | FTS top-25 | Postgres | 10 – 40 ms | GIN on `tsv` |
| 9 | RRF + dedupe | In-process Python | < 5 ms | Pure dict ops on 50 rows max |
| 10 | Document metadata | Postgres | 20 – 50 ms | SELECT IN over a handful of IDs |
| 12 | Qwen-Agent build | In-process | 5 – 50 ms (3 – 5 s cold) | First request after `uvicorn --reload` pays the import |
| 13 | **DashScope chat TTFT** | DashScope `/chat/completions` | **1.0 – 3.0 s** | **Dominant user-visible delay** |
| 13 | Token stream | DashScope | 30 – 60 tok/s | Visible progressively |
| 15 | Persist assistant msg | Postgres | 30 – 80 ms | After stream completes; user already sees full answer |

**Time-to-first-token totals to ~1.5–4 s** — the silence the user is asking about. After that, perceived latency tracks the token rate, not the pipeline.

## Bottleneck ranking and what to do

Ordered by ROI (cheapest, biggest-impact fix first).

### 1. DashScope chat TTFT (~1–3 s, biggest single contributor)

`qwen3.5-122b-a10b` is a 122B-parameter model. We feed it ~8 retrieved chunks × up to ~500 tokens each, plus the grounding instruction and history — typically 4–6 KB of system context. Large models on long contexts have non-trivial prefill before the first token emits.

Fixes, ranked:
- **Swap the chat model.** Try `qwen-plus` or `qwen-turbo` for the same prompt. Qwen-Agent's `llm_cfg` is one string change in `app/services/chat.py:92`. Measure quality drop on the seed PDF Qs before committing. Likely cuts TTFT to ~300–800 ms.
- **Drop `top_k` from 8 → 4** in `retrieval.retrieve()` (`app/services/retrieval.py:27`). Fewer chunks → shorter system prompt → faster prefill. Quality cost is small if `max_ref_token=500` keeps chunks focused.
- **Lower `QWEN_MAX_INPUT_TOKENS`** (currently 90 000). DashScope may pre-allocate KV cache to this ceiling. Effect is uncertain; worth A/B-ing with 8 000–16 000.

### 2. Query-embedding RTT (~250–600 ms, fully serial before any DB query)

Steps 7–13 all wait on step 6. Every chat request pays at least one round-trip to DashScope Singapore.

Fixes, ranked:
- **LRU-cache query embeddings.** Trivial in-process dict keyed on the query string (case-folded, whitespace-collapsed); cap at ~256 entries. Saves 100% of the RTT for repeat questions ("What's tuition?" gets asked a lot on a marketing page). Zero cost.
- **Co-locate the backend with Supabase + DashScope.** Both live in/near Singapore. Move Railway from its current region to `asia-southeast1` (or pick a region that minimizes both round-trips). Typical RTT drop: 80–150 ms.

### 3. Cold Qwen-Agent import on first request (~3–5 s, one-time)

`from qwen_agent.agents import Assistant` is lazy at `app/services/chat.py:42`. The first chat after a Railway cold start (or after `uvicorn --reload` triggers) eats the entire heavy-deps load.

Fix: hoist the import to module top. Trades startup time for first-request latency — strictly better for users; only mildly worse for Railway boot.

### 4. Four serial short-lived DB sessions per chat request (~120–280 ms)

`app/api/chat.py` opens a fresh sessionmaker session four times: session-create, user-msg insert, retrieve+stream, assistant-msg insert. Each pays a pooler round-trip.

Fixes, ranked:
- **Move assistant-msg persistence behind `[DONE]`.** The user has already seen the full answer; the INSERT can run in a `BackgroundTask` or `asyncio.create_task` and the stream can close immediately. Saves the final 30–80 ms from end-of-stream.
- **Combine session-create + user-msg insert in one session.** Currently two separate commits at `chat.py:44–49` and `chat.py:54–62`. One session, two `add()`s, one `commit()`. Saves ~30–80 ms.

### 5. Sequential vector + FTS queries (~10–40 ms)

`retrieval.py:58–59` runs vector then FTS on the same `AsyncSession`. Single-flight, so they serialize. Real fix would need two sessions or one fused SQL query. Lowest priority — the ms here barely register against the ~1.5–4 s TTFT above.

## Convert estimates to measurements (10-minute instrumentation)

If you want the latency table to reflect reality on Railway rather than my guess, instrument these eight points:

| Step | Where to insert `time.perf_counter()` |
|---|---|
| Embed query | Around the `embed_batch([query])` call in `app/services/chat.py:47` |
| Vector SQL | Around `session.execute(vector_sql, ...)` in `app/services/retrieval.py:58` |
| FTS SQL | Around `session.execute(fts_sql, ...)` in `app/services/retrieval.py:59` |
| RRF | From the start of `_accumulate(vector_rows)` to the end of the `sorted(...)` call |
| Doc metadata | Around the SELECT IN in `app/services/chat.py:55–66` |
| Assistant build | Around `Assistant(...)` in `app/services/chat.py:93` |
| TTFT | From entering the `for responses in bot.run(...)` loop to the first delta yield in `app/services/chat.py:97` |
| Total stream | From TTFT mark to the `yield {"type": "done", ...}` in `app/services/chat.py:108` |

Emit each delta with `log.info("perf chat %s=%.1fms", label, ms)`. One chat in production and you have the table.

Do **not** ship the instrumentation in the same PR as this doc — keep one concern per change.
