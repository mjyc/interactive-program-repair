#!/usr/bin/env node

const fs = require("fs");
const hpjs = require("hyperparameters");
const programs = require("../programs");
const { evaluateParams } = require("../..");

// load data
const { settings, traces: inputTraces } = JSON.parse(
  fs.readFileSync(process.argv[2])
);
const makeProgram = programs[settings.progName];
inputTraces.askMultipleChoiceFinished = inputTraces.askMultipleChoiceFinished.filter(
  (x) => x.value !== "Next" && x.value !== "Go back" && x.value !== "Done"
);
const stateTrace = inputTraces.state;

// use hpjs for repair
const fn = async (params) => {
  return -(
    await evaluateParams({
      makeProgram,
      progParams: params,
      inputTraces,
      stateTrace,
    })
  ).score;
};
const space = {
  minLevel: hpjs.uniform(-45, 45),
  maxLevel: hpjs.uniform(-45, 45),
  inactiveTimeout: hpjs.uniform(200, 1000),
  useFaceAngle: hpjs.choice([true, false]),
  flipSign: hpjs.choice([true, false]),
};
hpjs
  .fmin(fn, space, hpjs.search.randomSearch, 10000, {
    rng: new hpjs.RandomState(123456),
  })
  .then((trials) => console.log(trials.argmin));
