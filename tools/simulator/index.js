const {
  forEach,
  fromIter,
  map,
  filter,
  pipe,
  scan,
  take,
  interval,
  concat
} = require("callbag-basics");
const pairwise = require("callbag-pairwise");
const xs = require("xstream").default;
const sampleCombine = require("xstream/extra/sampleCombine").default;
const { mockTimeSource } = require("@cycle/time");

function* range(from, to) {
  let i = from;
  while (i <= to) {
    yield i;
    i++;
  }
}

const createStateTraceStream = (transition, duration, initStateStamped) => {
  const init = {
    state: initStateStamped.state,
    duration: duration(initStateStamped.state)
  };
  return concat(
    fromIter([initStateStamped]),
    pipe(
      fromIter(range(0, Number.MAX_SAFE_INTEGER)),
      scan((prev, x) => {
        const state = transition(prev.state);
        return {
          state,
          duration: duration(state)
        };
      }, init),
      scan(
        (prev, x) => ({
          state: x.state,
          stamp: prev.stamp + x.duration
        }),
        initStateStamped
      )
    )
  );
};

const fast = pipe(
  createStateTraceStream(
    x => (x === "F0" ? "F1" : "F0"),
    x => (x === "F0" ? 3 : 7),
    { state: "F0", stamp: 0 }
  ),
  take(10)
);

const slow = pipe(
  createStateTraceStream(
    x => (x === "S0" ? "S1" : "S0"),
    x => (x === "S0" ? 10 : 15),
    { state: "S0", stamp: 0 }
  ),
  take(10)
);

// forEach(x => console.log(x))(fast);
// forEach(x => console.log(x))(slow);

const callbagToXs = timeSource => pullable =>
  xs.create({
    start(listener) {
      let talkback;
      let schedule;
      let currentTime;
      let startStamp;
      let lastStamp;
      pullable(0, (t, d) => {
        if (t === 0) {
          const op = timeSource.createOperator();
          schedule = op.schedule;
          currentTime = op.currentTime;
          startStamp = currentTime();
          lastStamp = startStamp;
          talkback = d;
        }
        if (t === 1) {
          lastStamp = startStamp + d.stamp;
          schedule.next(listener, lastStamp, d);
        }
        if (t === 2)
          typeof d === "undefined"
            ? schedule.complete(listener, lastStamp)
            : schedule.error(listener, lastStamp, d);
        if (t === 0 || t === 1) talkback(1);
      });
    },
    stop() {}
  });

const xsToCallbag = xstream => (start, sink) => {
  if (start !== 0) return;
  xstream.addListener({
    next: x => sink(1, x),
    error: x => sink(2, x),
    complete: () => sink(2)
  });
  sink(0, t => {
    if (t === 2) sink(2);
  });
};

const Time = mockTimeSource();

callbagToXs(Time)(fast)
  .compose(sampleCombine(callbagToXs(Time)(slow)))
  .addListener({
    next: console.log
  });

Time.run();
