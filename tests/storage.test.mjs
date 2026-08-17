import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
} from "../storage.js";

const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "localStorage",
);

function setLocalStorage(value) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value,
  });
}

function namedError(name) {
  const error = new Error(name);
  error.name = name;
  return error;
}

afterEach(() => {
  if (originalLocalStorageDescriptor) {
    Object.defineProperty(
      globalThis,
      "localStorage",
      originalLocalStorageDescriptor,
    );
  } else {
    delete globalThis.localStorage;
  }
});

test("safe storage reads, writes, and removes values in normal storage", () => {
  const values = new Map();
  setLocalStorage({
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  });

  assert.equal(safeStorageSet("key", "value"), true);
  assert.equal(safeStorageGet("key", "fallback"), "value");
  assert.equal(safeStorageRemove("key"), true);
  assert.equal(safeStorageGet("key", "fallback"), "fallback");
});

test("safeStorageGet returns explicit and default fallbacks for a missing key", () => {
  setLocalStorage({ getItem: () => null });

  assert.equal(safeStorageGet("missing", "fallback"), "fallback");
  assert.equal(safeStorageGet("missing"), null);
});

test("safe storage returns fallbacks and false results when storage is unavailable", () => {
  delete globalThis.localStorage;

  assert.equal(safeStorageGet("key", "fallback"), "fallback");
  assert.equal(safeStorageSet("key", "value"), false);
  assert.equal(safeStorageRemove("key"), false);
});

test("safe storage contains SecurityError exceptions from storage methods", () => {
  setLocalStorage({
    getItem() {
      throw namedError("SecurityError");
    },
    setItem() {
      throw namedError("SecurityError");
    },
    removeItem() {
      throw namedError("SecurityError");
    },
  });

  assert.equal(safeStorageGet("key", "fallback"), "fallback");
  assert.equal(safeStorageSet("key", "value"), false);
  assert.equal(safeStorageRemove("key"), false);
});

test("safeStorageSet returns false when storage throws QuotaExceededError", () => {
  setLocalStorage({
    setItem() {
      throw namedError("QuotaExceededError");
    },
  });

  assert.equal(safeStorageSet("key", "value"), false);
});

test("safe storage treats a throwing localStorage getter as unavailable", () => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw namedError("SecurityError");
    },
  });

  assert.equal(safeStorageGet("key", "fallback"), "fallback");
  assert.equal(safeStorageSet("key", "value"), false);
  assert.equal(safeStorageRemove("key"), false);
});
