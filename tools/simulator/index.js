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
const startWith = require("callbag-start-with");

function* range(from, to) {
  let i = from;
  while (i <= to) {
    yield i;
    i++;
  }
}

// const pred

const sample = fastpullable => slowpullable => (start, sink) => {
  if (start !== 0) return;
  let stalkback;
  let ftalkback;
  let cursd;
  let curfd;
  slowpullable(0, (st, sd) => {
    if (st === 0) {
      stalkback = sd;
      fastpullable(0, (ft, fd) => {
        if (ft === 0) ftalkback = fd;
        if (ft === 1) {
          curfd = fd;
          sink(1, { cursd, curfd });
        }
        if (ft === 2) {
          stalkback(2);
          sink(2);
        }
      });
      sink(0, t => {
        if (t === 2) {
          stalkback(2);
          ftalkback(2);
        }
      });
      console.log("stalkback(1); first");
      stalkback(1); // very first trigger
    }
    if (st === 1) {
      // TODO:
      cursd = sd;
      while (typeof curfd === "undefined" || cursd.stamp > curfd[1].stamp)
        ftalkback(1);
      console.log("stalkback(1); new", cursd);
      stalkback(1);
    }
    if (st === 2) {
      ftalkback(2);
      sink(2);
    }
  });
};

const countToStateLabel = x => `F${x % 2}`;
const stateLabelToDuration = x => (x === "F0" ? 3 : 7);

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

// pipe(
//   slow,
//   sample(
//     pipe(
//       fast,
//       pairwise
//     )
//   ),
//   forEach(x => console.log("out", x))
// );
