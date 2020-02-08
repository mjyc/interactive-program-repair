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

forEach(x => console.log(x))(fast);
forEach(x => console.log(x))(slow);
