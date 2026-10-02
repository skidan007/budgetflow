import test from "node:test";
import assert from "node:assert/strict";
import { firstName } from "./identity.mjs";

test("firstName returns the first word and handles missing names", () => {
  assert.equal(firstName("Daniel Victor"), "Daniel");
  assert.equal(firstName("Daniel Victor Bernard"), "Daniel");
  assert.equal(firstName("Daniel"), "Daniel");
  assert.equal(firstName("  Daniel Victor "), "Daniel");
  assert.equal(firstName(""), "");
});
