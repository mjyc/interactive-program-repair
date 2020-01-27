const { promisify } = require("util");
const xs = require("xstream").default;
const { mockTimeSource } = require("@cycle/time");
const { computeOverlap } = require("./utils");

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

module.exports = {
  runProgramOffline,
  evaluateParams
};
