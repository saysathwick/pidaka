import assert from "node:assert/strict";
import test from "node:test";
import { conservation, queueForViewer, type DoorstepItem } from "./index.ts";

function item(
  id: string,
  creatorId: string,
  hoursLeft: number,
  hoursAgo = 1,
): DoorstepItem {
  const now = Date.now();
  return {
    id,
    creatorId,
    createdAt: new Date(now - hoursAgo * 3600000),
    expiresAt: new Date(now + hoursLeft * 3600000),
  };
}

test("every other person's item is on the viewer's doorstep", () => {
  const items = [
    item("a", "cook-a", 40),
    item("b", "cook-b", 20),
    item("c", "viewer", 30),
  ];
  const queued = queueForViewer({ items, viewerId: "viewer" });
  assert.deepEqual(
    queued.map((i) => i.id).sort(),
    ["a", "b"],
  );
});

test("unseen comes before seen; dying unseen comes first", () => {
  const items = [
    item("fresh", "x", 40),
    item("dying", "y", 1),
    item("mid", "z", 10),
  ];
  const queued = queueForViewer({
    items,
    viewerId: "viewer",
    seenIds: ["fresh"],
  });
  assert.deepEqual(
    queued.map((i) => i.id),
    ["dying", "mid", "fresh"],
  );
});

test("least witnessed breaks expiry ties", () => {
  const items = [item("popular", "a", 10), item("quiet", "b", 10)];
  const queued = queueForViewer({
    items,
    viewerId: "viewer",
    witnessCounts: { popular: 80, quiet: 2 },
  });
  assert.equal(queued[0].id, "quiet");
});

test("expired items never leave the kitchen", () => {
  const items = [item("dead", "a", -1), item("live", "b", 12)];
  const queued = queueForViewer({ items, viewerId: "viewer" });
  assert.deepEqual(
    queued.map((i) => i.id),
    ["live"],
  );
});

test("conservation counts required meetings excluding the cook", () => {
  const items = [item("curry", "cook", 10)];
  const stats = conservation({
    items,
    viewerIds: ["cook", "p1", "p2"],
    witnessed: { curry: ["p1"] },
  });
  assert.equal(stats.required, 2);
  assert.equal(stats.witnessed, 1);
  assert.equal(stats.expiredUnseen, 0);
});
