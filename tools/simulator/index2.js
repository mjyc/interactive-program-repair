const {
  forEach,
  fromIter,
  pipe,
  scan,
  take,
  concat,
  interval
} = require("callbag-basics");
const latest = require("callbag-latest");
const pairwise = require("callbag-pairwise");
const sample = require("callbag-sample");
const sampleCombine = require("callbag-sample-combine");
const xs = require("xstream").default;
const { mockTimeSource } = require("@cycle/time");
const random = require("random");

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
    // x => (x === "F0" ? 3 : 7),
    x => 1,
    { state: "F0", stamp: 0 }
  ),
  take(100000)
);

// forEach(x => console.log(x))(fast);

const pausableInterval = pullable => (start, sink) => {
  if (start !== 0) return;
  let ptalkback;
  let pulling = false;
  pullable(0, (pt, pd) => {
    if (pt === 0) {
      ptalkback = pd;
    }
    if (pt === 1) {
      if (pulling) {
        setTimeout(() => {
          sink(1, pd);
          ptalkback(1);
        }, 0);
      } else {
        console.error("whaaat?", pt, pd);
      }
    }
    sink(0, t => {
      if (t === 1) {
        console.log("pulling", pulling);
        if (pulling) pulling = false;
        else {
          pulling = true;
          ptalkback(1);
        }
      }
      if (t === 2) ptalkback(2);
    });
  });
};

const sample2 = pullable => listenable => (start, sink) => {
  if (start !== 0) return;
  let ltalkback;
  let ptalkback;
  listenable(0, (lt, ld) => {
    if (lt === 0) {
      ltalkback = ld;
      pullable(0, (pt, pd) => {
        if (pt === 0) ptalkback = pd;
        if (pt === 1) sink(1, pd);
        if (pt === 2) {
          ltalkback(2);
          sink(2);
        }
      });
      sink(0, t => {
        if (t === 2) {
          ltalkback(2);
          ptalkback(2);
        }
      });
    }
    if (lt === 1) ptalkback(1);
    if (lt === 2) {
      ptalkback(2);
      sink(2);
    }
  });
};

// const hfsm = transition => sfsm => (start, sink) => {
//   if (start !== 0) return;
//   let talkback;
//   sfsm(0, (t, p) => {
//     if (t === 0) talkback = p;
//     if (t === 1) {
//       sink(1, p); // p is "state"
//       // if
//     }
//     if (t === 2) {
//       sink(2);
//     }
//   });
//   sink(0, t => {
//     if (t === 1) talkback(1);
//     if (t === 2) talkback(2);
//   });
// };

// pipe(
//   interval(10),
//   sample2(pausableInterval(fast)),
//   forEach(x => console.log(x))
// );
