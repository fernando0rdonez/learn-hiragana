import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STATIONS, TRAIN_SENTENCES, stationOf, chunksExercise, stationsExercise,
  choiceExercises, buildTrainSession, misplaced, TRAIN_SESSION_SIZE,
} from "./particleOrder";

const ORDER = STATIONS.map((s) => s.id);

test("the train has six cars, topic first and verb last", () => {
  assert.equal(STATIONS.length, 6);
  assert.equal(STATIONS[0].particle, "は");
  assert.equal(STATIONS[5].particle, "Verbo");
});

test("every sentence follows the train order with one chunk per station", () => {
  assert.ok(TRAIN_SENTENCES.length >= 12);
  for (const s of TRAIN_SENTENCES) {
    const stations = s.chunks.map((c) => ORDER.indexOf(stationOf(c.particle)));
    assert.ok(s.chunks.length >= 4, s.es);
    assert.equal(s.chunks[0].particle, "は", s.es);
    assert.equal(s.chunks[s.chunks.length - 1].particle, null, s.es);
    for (let i = 1; i < stations.length; i++) {
      assert.ok(stations[i] > stations[i - 1], `strictly increasing stations: ${s.es}`);
    }
  }
});

test("chunk exercises speak the sentence without spaces", () => {
  const ex = chunksExercise(TRAIN_SENTENCES[0]);
  assert.equal(ex.speech, "わたしはどようびにともだちとでんしゃでうみへいきます");
  assert.equal(ex.cards.length, 6);
});

test("choice exercises always include the answer and never a second right answer", () => {
  for (const ex of choiceExercises()) {
    assert.ok(ex.options.includes(ex.answer), ex.prompt);
    assert.equal(new Set(ex.options).size, ex.options.length);
  }
  const whereTo = choiceExercises().find((e) => e.prompt.startsWith("¿A dónde"))!;
  assert.ok(!whereTo.options.includes("に"));
  const ni = choiceExercises().find((e) => e.prompt === "に")!;
  assert.ok(!ni.options.includes("Destino"));
});

test("a session starts with the whole train and has the requested size", () => {
  for (let i = 0; i < 20; i++) {
    const session = buildTrainSession();
    assert.equal(session.length, TRAIN_SESSION_SIZE);
    assert.equal(session[0].type, "stations");
    assert.equal(session.filter((e) => e.type === "stations").length, 2);
    assert.ok(session.some((e) => e.type === "chunks"));
    assert.ok(session.some((e) => e.type === "choice"));
  }
});

test("misplaced reports the wrong positions", () => {
  const cards = stationsExercise("particles").cards;
  assert.deepEqual(misplaced(cards, cards), []);
  const swapped = [cards[1], cards[0], ...cards.slice(2)];
  assert.deepEqual(misplaced(swapped, cards), [0, 1]);
});
