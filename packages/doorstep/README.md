# @pidaka/doorstep

Distribution plugin for perishable posts.

**Rule:** when someone pastes (cooks), that item is placed on every other person's doorstep. They look when they open the door. Nothing is sampled. Nothing is ranked by popularity.

## Queue order

1. Live only (not expired)
2. Not the viewer's own item
3. Unseen before seen
4. Soonest expiry (first-expired, first-out)
5. Fewest witnesses
6. Oldest created (waited longest)

## Usage

```ts
import { queueForViewer, conservation } from "@pidaka/doorstep";

const queue = queueForViewer({
  items: pidakas,
  viewerId: currentUser.id,
  seenIds: ["already-met-id"],
  witnessCounts: { "quiet-id": 2, "loud-id": 80 },
});

const health = conservation({
  items: pidakas,
  viewerIds: allUserIds,
  witnessed: { "item-id": ["user-1", "user-2"] },
});
```

`conservation.required` is each item × (village size − 1). Coverage is witnessed / required.

This package is logic only. Storage, HTTP, and auth stay in the host app.

Published in git at [`packages/doorstep`](https://github.com/saysathwick/pidaka/tree/staging/packages/doorstep). Pidaka uses it as a local package:

```json
{
  "dependencies": {
    "@pidaka/doorstep": "file:packages/doorstep"
  }
}
```
