import { test } from "node:test";
import assert from "node:assert/strict";
import { buildStandings, countedReps, machineScore } from "./scoring";

test("clamp de repeticiones a 15", () => {
  assert.equal(countedReps(20), 15);
  assert.equal(countedReps(8), 8);
  assert.equal(countedReps(0), 0);
});

test("fórmula de puntaje por máquina", () => {
  // 300 kg, 75 kg corporal, 15 reps → 4 × 1.5 = 6
  assert.equal(machineScore(300, 75, 15), 6);
  assert.equal(machineScore(300, 75, 40), 6);
  assert.equal(machineScore(100, 80, 3), 1.375);
});

test("ranking: suma de mejores, desempate por menor peso", () => {
  const machines = ["a", "b"];
  const s = buildStandings(
    [
      { userId: "u1", machineId: "a", score: 2 },
      { userId: "u1", machineId: "a", score: 3 },
      { userId: "u1", machineId: "b", score: 1 },
      { userId: "u2", machineId: "a", score: 4 },
      { userId: "u3", machineId: "b", score: 4 },
    ],
    new Map([["u1", 80], ["u2", 90], ["u3", 70]]),
    machines,
  );
  assert.deepEqual(s.map((x) => x.userId), ["u3", "u1", "u2"]);
  assert.equal(s[1].total, 4);
  assert.equal(s[1].eligible, true);
  assert.equal(s[0].eligible, false);
});
