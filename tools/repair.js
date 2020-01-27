#!/usr/bin/env node

const fs = require("fs");
const { makeNeckExercise } = require("../example_programs");
const { repair } = require("../repair.js");

const { settings, traces: inputTraces } = JSON.parse(
  fs.readFileSync(process.argv[2])
);
const makeProgram = makeNeckExercise;
inputTraces.askMultipleChoiceFinished = inputTraces.askMultipleChoiceFinished.filter(
  x => x.value !== "Next" && x.value !== "Go back" && x.value !== "Done"
);
const stateTrace = inputTraces.state;
repair({
  makeProgram,
  inputTraces,
  stateTrace,
  options: {
    domainSpace: {
      minLevel: Array.from({ length: 19 }, (x, i) => -45 + 5 * i),
      maxLevel: Array.from({ length: 19 }, (x, i) => -45 + 5 * i),
      inactiveTimeout: Array.from({ length: 6 }, (x, i) => 200 * i),
      // minLevel: Array.from({ length: 11 }, (x, i) => -50 + 10 * i),
      // maxLevel: Array.from({ length: 11 }, (x, i) => -50 + 10 * i),
      // inactiveTimeout: Array.from({ length: 11 }, (x, i) => 200 * i),
      useFaceAngle: [true, false],
      flipSign: [true, false]
    }
  }
}).then(output => {
  console.log("stateTrace", stateTrace);
  console.log("repair output", output);
});
