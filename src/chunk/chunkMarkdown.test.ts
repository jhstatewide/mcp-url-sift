import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkMarkdown } from "./chunkMarkdown.js";
import { RoughTokenEstimator } from "../estimate/estimateTokens.js";

test("chunkMarkdown splits heading sections", () => {
  const markdown = [
    "# Intro",
    "Hello world.",
    "",
    "## Details",
    "Paragraph one.",
    "",
    "Paragraph two.",
  ].join("\n");

  const chunks = chunkMarkdown(markdown, 10, new RoughTokenEstimator(0));
  assert.ok(chunks.length >= 2);
  assert.equal(chunks[0]?.meta.id, "chunk-1");
  assert.equal(chunks[1]?.meta.id, "chunk-2");
  assert.ok(chunks.some((chunk) => /## Details/.test(chunk.content)));
});
