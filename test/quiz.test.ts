import { describe, expect, it } from "vitest";
import { generate } from "../src/data/generate.ts";
import { DERIVATIONS, commuteSpeed } from "../src/quiz/derive.ts";
import { QUESTIONS } from "../src/quiz/questions.ts";

const data = generate();

describe("quiz", () => {
  it("has between 6 and 8 questions, each with two hints and its answer among the options", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(6);
    expect(QUESTIONS.length).toBeLessThanOrEqual(8);
    for (const q of QUESTIONS) {
      expect(q.hints).toHaveLength(2);
      expect(q.options.map((o) => o.id)).toContain(q.answer);
    }
  });

  it.each(QUESTIONS.map((q) => [q.id, q] as const))("%s: the traces lead to the expected answer", (id, q) => {
    expect(DERIVATIONS[id](data)).toBe(q.answer);
  });

  it("tells walking, cycling and driving apart by speed", () => {
    expect(commuteSpeed(data, "tom")).toBeLessThan(7);
    expect(commuteSpeed(data, "ines")).toBeGreaterThan(12);
    expect(commuteSpeed(data, "ines")).toBeLessThan(20);
    expect(commuteSpeed(data, "malik")).toBeGreaterThan(40);
  });
});
