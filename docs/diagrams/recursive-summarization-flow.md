# Recursive Summarization Flow Diagram

## Simple Flow (Text Fits in Context Window)

```
┌─────────────────┐
│  Large Text     │
│  (User Input)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Token     │
│ Limit           │
└────────┬────────┘
         │
         │ Text < 4000 tokens
         ▼
┌─────────────────┐
│ Direct          │
│ Summarization   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Final Summary   │
└─────────────────┘
```

## Recursive Flow (Text Exceeds Context Window)

```
┌─────────────────────────────────────────────────────────────┐
│                    Very Large Text                          │
│                    (e.g., 50,000 chars)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ Check Token    │
                  │ Limit          │
                  └────────┬───────┘
                           │
                           │ Text > 4000 tokens
                           ▼
                  ┌────────────────┐
                  │ Split Text     │
                  │ (Recursive     │
                  │  Splitter)     │
                  └────────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌────────┐         ┌────────┐        ┌────────┐
   │ Chunk 1│         │ Chunk 2│   ...  │ Chunk N│
   └───┬────┘         └───┬────┘        └───┬────┘
       │                  │                  │
       ▼                  ▼                  ▼
   ┌────────┐         ┌────────┐        ┌────────┐
   │Summarize│        │Summarize│       │Summarize│
   └───┬────┘         └───┬────┘        └───┬────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │  Concatenate   │
                 │   Summaries    │
                 └────────┬───────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ Still too      │
                 │ large?         │
                 └────────┬───────┘
                          │
                ┌─────────┴─────────┐
                │                   │
           YES  │                   │  NO
                ▼                   ▼
         ┌──────────────┐    ┌──────────────┐
         │   RECURSE    │    │    Final     │
         │  (Depth + 1) │    │ Summarization│
         └──────────────┘    └──────┬───────┘
                │                   │
                └───────────────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ Final Summary  │
                 └────────────────┘
```

## Text Splitting Strategy

```
Original Text (Too Large)
│
├─ Try Split by: "\n\n" (Paragraphs)
│  │
│  ├─ Chunk 1: Paragraph 1 + 2
│  ├─ Chunk 2: Paragraph 3 + 4 (with overlap)
│  └─ Chunk 3: Paragraph 5 + 6 (with overlap)
│
├─ If chunks still too large, try: "\n" (Lines)
│
├─ If still too large, try: ". " (Sentences)
│
├─ If still too large, try: " " (Words)
│
└─ Last resort: Character count
```

## Example: Processing a 100,000 Character Document

```
Step 1: Initial Split
┌──────────────────────────────────────────────────────────┐
│ 100,000 chars → Split into 7 chunks (~14,000 chars each) │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
Step 2: First Level Summaries
┌──────────────────────────────────────────────────────────┐
│ 7 chunks → 7 summaries (~500 chars each = 3,500 total)  │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
Step 3: Check Size
┌──────────────────────────────────────────────────────────┐
│ 3,500 chars < 16,000 char limit ✓                       │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
Step 4: Final Summary
┌──────────────────────────────────────────────────────────┐
│ Concatenated summaries → Final summary (~200 chars)     │
└──────────────────────────────────────────────────────────┘
```

## Streaming Mode Flow

```
┌─────────────────┐
│  Large Text     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Split into      │
│ Chunks          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Summarize       │
│ Chunks          │
│ (Non-streaming) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Concatenate     │
│ Summaries       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Final Summary   │
│ (STREAMING)     │◄─── Chunks sent to UI in real-time
└────────┬────────┘
         │
         ▼
    User sees
    progressive
    output
```

## Safety Mechanisms

```
┌─────────────────────────────────────────┐
│         Recursion Depth Check           │
│                                         │
│  Depth 0: Original text                │
│  Depth 1: First level summaries        │
│  Depth 2: Summary of summaries         │
│  ...                                   │
│  Depth 10: MAX DEPTH REACHED           │
│            ↓                           │
│         Truncate & Return              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Text Splitter Safety Check         │
│                                         │
│  Chunk Count < 10,000 ✓                │
│  Chunk Count ≥ 10,000 ✗                │
│            ↓                           │
│    Throw Error: "Exceeded limit"       │
└─────────────────────────────────────────┘
```
