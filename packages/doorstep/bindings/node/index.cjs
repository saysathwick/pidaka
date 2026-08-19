const fs = require("node:fs");
const path = require("node:path");

const wasmPath = path.join(__dirname, "doorstep.wasm");
const wasmModule = new WebAssembly.Module(fs.readFileSync(wasmPath));
const { exports: wasm } = new WebAssembly.Instance(wasmModule, {});

function writeCString(text) {
  const bytes = Buffer.from(text, "utf8");
  const size = bytes.length + 1;
  const ptr = wasm.doorstep_alloc(size);
  if (!ptr) {
    throw new Error("doorstep alloc failed");
  }
  const memory = new Uint8Array(wasm.memory.buffer);
  memory.set(bytes, ptr);
  memory[ptr + bytes.length] = 0;
  return { ptr, size };
}

function readCString(ptr) {
  const memory = new Uint8Array(wasm.memory.buffer);
  let end = ptr;
  while (memory[end] !== 0) end += 1;
  return Buffer.from(memory.subarray(ptr, end)).toString("utf8");
}

function call(fn, payload) {
  const json = JSON.stringify(payload);
  const input = writeCString(json);
  const outPtr = fn(input.ptr);
  wasm.doorstep_free(input.ptr, input.size);
  if (!outPtr) {
    throw new Error("doorstep returned null");
  }
  const text = readCString(outPtr);
  wasm.doorstep_string_free(outPtr);
  const parsed = JSON.parse(text);
  if (parsed && parsed.error) {
    throw new Error(parsed.error);
  }
  return parsed;
}

function toMillis(value) {
  if (value == null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(String(value));
  if (Number.isNaN(parsed)) {
    throw new Error(`invalid time: ${value}`);
  }
  return parsed;
}

function normalizeItem(item) {
  return {
    id: item.id,
    creator_id: item.creator_id ?? item.creatorId,
    created_at: toMillis(item.created_at ?? item.createdAt),
    expires_at: toMillis(item.expires_at ?? item.expiresAt),
  };
}

function queueForViewer({
  items,
  viewerId,
  viewer_id,
  seenIds,
  seen_ids,
  witnessCounts,
  witness_counts,
  now,
} = {}) {
  const counts = witnessCounts ?? witness_counts ?? {};
  const payload = {
    items: (items ?? []).map(normalizeItem),
    viewer_id: viewerId ?? viewer_id,
    seen_ids: Array.from(seenIds ?? seen_ids ?? []),
    witness_counts: counts instanceof Map ? Object.fromEntries(counts) : counts,
  };
  payload.now = toMillis(now ?? Date.now());
  return call(wasm.doorstep_queue, payload).ids;
}

function conservation({ items, viewerIds, viewer_ids, witnessed, now } = {}) {
  const payload = {
    items: (items ?? []).map(normalizeItem),
    viewer_ids: viewerIds ?? viewer_ids ?? [],
    witnessed: witnessed instanceof Map
      ? Object.fromEntries(
          Array.from(witnessed.entries()).map(([key, value]) => [key, Array.from(value)]),
        )
      : witnessed ?? {},
  };
  payload.now = toMillis(now ?? Date.now());
  return call(wasm.doorstep_conservation, payload);
}

module.exports = { queueForViewer, conservation };
module.exports.default = module.exports;
