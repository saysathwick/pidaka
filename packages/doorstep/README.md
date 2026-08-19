# doorstep

Distribution plugin for perishable items. **Not a Pidaka package.** No product names, no TypeScript logic.

When someone creates an item, it is placed on every other person's doorstep. They look when they open the door. Nothing is sampled. Nothing is ranked by popularity.

The source of truth is **Rust**. Other languages call it through JSON, WASM, a C ABI, or a CLI.

## Queue order

1. Live only (not expired)
2. Not the viewer's own item
3. Unseen before seen
4. Soonest expiry (first-expired, first-out)
5. Fewest witnesses
6. Oldest created (waited longest)

## Item shape

Any project can use this. An item is only:

| field | meaning |
| --- | --- |
| `id` | stable id |
| `creator_id` | who made it (`creatorId` also accepted) |
| `created_at` | unix millis or RFC3339 (`createdAt` also accepted) |
| `expires_at` | unix millis or RFC3339 (`expiresAt` also accepted) |

## Rust

```rust
use doorstep::{queue_for_viewer, Item, QueueInput};
```

```bash
cargo test
cargo build --release
```

## CLI (any language)

```bash
cargo install --path .
echo '{"items":[...],"viewer_id":"user-1"}' | doorstep queue
```

## Node / browsers

Prebuilt WASM, no native compiler:

```bash
npm install github:saysathwick/doorstep
```

```js
const { queueForViewer, conservation } = require("doorstep");

const ids = queueForViewer({
  items,
  viewerId: "user-1",
  seenIds: ["already-met-id"],
  witnessCounts: { "quiet-id": 2 },
});
```

`queueForViewer` returns ordered **ids**. Rejoin your own records in the host app.

## C / C++ / Go / Java / Swift

```c
#include "include/doorstep.h"

char *out = doorstep_queue("{\"items\":[],\"viewer_id\":\"x\"}");
doorstep_string_free(out);
```

Build a shared library:

```bash
cargo build --release
```

## Python

```bash
cargo install --path .
pip install -e bindings/python
```

```python
from doorstep import queue_for_viewer, conservation

ids = queue_for_viewer(items, viewer_id="user-1", seen_ids=["already-met-id"])
```

This package is logic only. Storage, HTTP, and auth stay in the host app.
