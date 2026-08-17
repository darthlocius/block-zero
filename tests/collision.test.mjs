import test from "node:test";
import assert from "node:assert/strict";

import { segmentRectIntersection } from "../geometry.js";

const rect = Object.freeze({ x: 10, y: 10, w: 4, h: 4 });

function assertClose(actual, expected, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );
}

function assertFiniteHit(hit) {
  assert.ok(hit);
  assert.equal(Number.isFinite(hit.x), true);
  assert.equal(Number.isFinite(hit.y), true);
  assert.equal(Number.isFinite(hit.t), true);
}

test("segmentRectIntersection detects a horizontal segment crossing a rectangle", () => {
  const hit = segmentRectIntersection(0, 10, 20, 10, rect);

  assertFiniteHit(hit);
  assertClose(hit.x, 8);
  assertClose(hit.y, 10);
  assertClose(hit.t, 0.4);
  assert.equal(hit.solid, rect);
});

test("segmentRectIntersection detects a vertical segment crossing a rectangle", () => {
  const hit = segmentRectIntersection(10, 0, 10, 20, rect);

  assertFiniteHit(hit);
  assertClose(hit.x, 10);
  assertClose(hit.y, 8);
  assertClose(hit.t, 0.4);
});

test("segmentRectIntersection detects a diagonal segment crossing a rectangle", () => {
  const hit = segmentRectIntersection(0, 0, 20, 20, rect);

  assertFiniteHit(hit);
  assertClose(hit.x, 8);
  assertClose(hit.y, 8);
  assertClose(hit.t, 0.4);
});

test("segmentRectIntersection returns null when a segment misses the rectangle", () => {
  assert.equal(segmentRectIntersection(0, 5, 20, 5, rect), null);
});

test("segmentRectIntersection does not extend a segment past its endpoint", () => {
  assert.equal(segmentRectIntersection(0, 10, 7, 10, rect), null);
});

test("segmentRectIntersection returns the segment start when it begins inside", () => {
  const hit = segmentRectIntersection(10, 10, 20, 10, rect);

  assertFiniteHit(hit);
  assertClose(hit.x, 10);
  assertClose(hit.y, 10);
  assertClose(hit.t, 0);
});

test("segmentRectIntersection counts touching a rectangle edge as a hit", () => {
  const hit = segmentRectIntersection(0, 8, 20, 8, rect);

  assertFiniteHit(hit);
  assertClose(hit.x, 8);
  assertClose(hit.y, 8);
  assertClose(hit.t, 0.4);
});

test("segmentRectIntersection handles a near-zero direction component without non-finite values", () => {
  const hit = segmentRectIntersection(10, 0, 10 + 1e-10, 20, rect);

  assertFiniteHit(hit);
  assertClose(hit.x, 10, 1e-8);
  assertClose(hit.y, 8);
  assertClose(hit.t, 0.4);
});

test("segmentRectIntersection reports the nearest entry point on a known segment", () => {
  const knownRect = { x: 30, y: 0, w: 10, h: 10 };
  const hit = segmentRectIntersection(0, 0, 100, 0, knownRect);

  assertFiniteHit(hit);
  assertClose(hit.x, 25);
  assertClose(hit.y, 0);
  assertClose(hit.t, 0.25);
});
