const { promisify } = require("es6-promisify");
const mapValues = require("lodash/fp/mapValues");
const range = require("lodash/fp/range");
const rangeStep = require("lodash/fp/rangeStep");
const listrp = require("listrp");
const streams = require("listrp/streams");
const {
  convertRecordedStreamToStream,
  mockTimeSource
} = require("listrp/cyclebridge");
const { computeOverlap } = require("./utils");
const logger = require("./logger");

const runProgramOffline = (
  { createProgram, progParams, inputTraces, programOpts = {} },
  callback
) => {
  const Time = mockTimeSource();
  const inputStreams = Object.keys(inputTraces).reduce((prev, k) => {
    prev[k] = convertRecordedStreamToStream(Time, inputTraces[k]);
    return prev;
  }, {});

  streams.sdelay = Time.delay;
  streams.sdebounce = Time.debounce;
  // IMPORTANT!! this is just a placeholder
  streams.sbuffer = () => {
    return () => {
      return streams.sempty;
    };
  };
  const prog = createProgram(
    progParams,
    Object.assign(programOpts, { ss: streams })
  );
  const outputStreams = prog(inputStreams);

  const outputTraces = {};
  Object.keys(outputStreams).map(k => {
    Time.record(outputStreams[k])(x => {
      outputTraces[k] = x;
    });
  });

  Time.run(err => {
    callback(err, outputTraces);
  });
};

module.exports = {
  runProgramOffline
};
