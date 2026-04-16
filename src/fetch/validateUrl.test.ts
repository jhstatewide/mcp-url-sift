import { test } from "node:test";
import assert from "node:assert/strict";
import { validateUrl } from "./validateUrl.js";

test("validateUrl blocks localhost when private hosts disabled", () => {
  assert.throws(() => validateUrl("http://localhost:3000", false));
});

test("validateUrl accepts https URL", () => {
  const parsed = validateUrl("https://example.com/path#fragment", false);
  assert.equal(parsed.toString(), "https://example.com/path");
});
