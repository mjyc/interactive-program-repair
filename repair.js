const { promisify } = require("util");
const mapValues = require("lodash/fp/mapValues");
const range = require("lodash/fp/range");
const rangeStep = require("lodash/fp/rangeStep");
const xs = require("xstream").default;
const { mockTimeSource } = require("@cycle/time");
const { computeOverlap } = require("./utils");

const logger = require("./logger");

const convertRecordedStreamToCycleTimeRecordedStream = recorded => {
  return recorded.map(x => ({
    type: "next",
    value: x.value,
    time: x.stamp
  }));
};

const convertRecordedStreamToXStream = (Time, recorded) => {
  const cycleTimeRecorded = convertRecordedStreamToCycleTimeRecordedStream(
    recorded
  );
  const schedule = Time._scheduler;
  return xs.create({
    start: listener => {
      cycleTimeRecorded.map(({ value, time }) => {
        schedule.next(listener, time, value);
      });
    },
    stop: () => {}
  });
};

const runProgramOffline = (
  { makeProgram, progParams, inputTraces },
  callback
) => {
  const Time = mockTimeSource();
  const inputStreams = Object.keys(inputTraces).reduce((prev, k) => {
    prev[k] = convertRecordedStreamToXStream(Time, inputTraces[k]);
    return prev;
  }, {});

  const prog = makeProgram(progParams);
  const outputStreams = prog(Object.assign({ Time }, inputStreams));

  const outputTraces = {};
  Object.keys(outputStreams).map(k => {
    Time.record(outputStreams[k]).addListener({
      next: x => (outputTraces[k] = x)
    });
  });

  Time.run(err => {
    callback(err, outputTraces);
  });
};

const evaluateParams = async ({
  makeProgram,
  progParams,
  inputTraces,
  stateTrace,
  options: { computeOverlapBinSize = 100 } = {}
} = {}) => {
  const outputTraces = await promisify(runProgramOffline)({
    makeProgram,
    progParams,
    inputTraces
  });
  Object.keys(outputTraces).reduce((prev, k) => {
    outputTraces[k] = outputTraces[k].map(x => ({
      stamp: x.time,
      value: x.value
    }));
  }, {});

  const score = computeOverlap(stateTrace, outputTraces.state, {
    binSize: computeOverlapBinSize
  });
  return {
    outputStateTrace: outputTraces.state,
    score
  };
};

const repair = async ({
  makeProgram,
  inputTraces,
  stateTrace,
  options: {
    computeOverlapBinSize = 100,
    method = "search", // "search" or "bayesian"
    domainSpace = {},
    prior = [] // used when method = "bayesian"
  } = {}
} = {}) => {
  const search = async (domainSpace, scoreFnc) => {
    const helper = (keys, state) => {
      if (keys.length === 0) {
        logger.warn("Object.keys(domainSpace) === 0");
        return {};
      }
      if (keys.length === 1) {
        const k = keys[0];
        return domainSpace[k].map(v => {
          return Object.assign({}, state, { [k]: v });
        });
      } else {
        const k = keys[0];
        return [].concat(
          ...domainSpace[k].map(v => {
            const newState = Object.assign({}, state, { [k]: v });
            return helper(keys.slice(1), newState);
          })
        );
      }
    };

    const space = helper(Object.keys(domainSpace), {});
    const priorSpace =
      prior.length > 0
        ? prior
        : Array.from(Array(space.length).keys()).map(() => 1 / space.length);
    const scores = [];
    const startTime = Date.now();
    for (let i = 0; i < space.length; i++) {
      const score = await scoreFnc(space[i]);
      const weightedScore =
        method === "bayesian" ? score * priorSpace[i] : score;
      scores.push(weightedScore);
    }
    if (method === "bayesian") {
      const sum = scores.reduce((prev, score) => prev + score, 0);
      for (let i = 0; i < scores.length; i++) {
        scores[i] /= sum;
      }
    }
    const elapsedTime = Date.now() - startTime;

    const maxIndex = scores.indexOf(Math.max(...scores));
    return {
      goal: space[maxIndex],
      score: scores[maxIndex],
      scores,
      elapsedTime
    };
  };

  const searchOutput = await search(domainSpace, async state => {
    // if inputTraces and stateTrace are Arrays, return a sum of scores
    if (Array.isArray(inputTraces)) {
      let score = 0;
      for (let i = 0; i < inputTraces.length; i++) {
        score += (await evaluateParams({
          makeProgram,
          progParams: state,
          inputTraces: inputTraces[i],
          stateTrace: stateTrace[i],
          options: {
            binSize: computeOverlapBinSize
          }
        })).score;
      }
      return score / inputTraces.length;
    }

    return (await evaluateParams({
      makeProgram,
      progParams: state,
      inputTraces,
      stateTrace,
      options: {
        binSize: computeOverlapBinSize
      }
    })).score;
  });

  return method === "bayesian"
    ? {
        progParams: searchOutput.goal,
        score: searchOutput.score,
        posterior: searchOutput.scores,
        elapsedTime: searchOutput.elapsedTime
      }
    : {
        progParams: searchOutput.goal,
        score: searchOutput.score,
        elapsedTime: searchOutput.elapsedTime
      };
};

module.exports = {
  runProgramOffline,
  evaluateParams,
  repair
};
