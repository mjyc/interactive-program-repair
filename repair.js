const xs = require("xstream").default;
const { mockTimeSource } = require("@cycle/time");

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
  { createProgram, progParams, programOpts = {}, inputTraces },
  callback
) => {
  const Time = mockTimeSource();
  console.log("Time", Time);
  const inputStreams = Object.keys(inputTraces).reduce((prev, k) => {
    prev[k] = convertRecordedStreamToXStream(Time, inputTraces[k]);
    return prev;
  }, {});

  const prog = createProgram(progParams, programOpts);
  const outputStreams = prog(inputStreams);

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

module.exports = {
  runProgramOffline
};
