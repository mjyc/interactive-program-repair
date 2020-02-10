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

const fsm = (transition, initState) => (start, sink) => {
  if (start !== 0) return;
  let state = initState;
  let id = null;
  const stop = () => {
    console.log("stop");
    clearInterval(id);
    id = null;
    state = initState;
  };
  const play = () => {
    console.log("play");
    // sink(1, Object.assign(state, { init: true }));
    id = setInterval(() => {
      state = transition(state);
      sink(1, state);
    }, 0);
  };
  sink(0, t => {
    if (t === 1) {
      if (id) stop();
      else play();
    }
    if (t === 2) clearInterval(id);
  });
};

// pipe(
//   interval(5),
//   sample(fsm(s => (s === "S1" ? "S2" : "S1"), "S1")),
//   take(100),
//   forEach(x => console.log(x))
// );

const hfsm = (fsms, transition, initState) => (start, sink) => {
  if (start !== 0) return;

  let state = initState;

  let talkbacks = [];
  sink(0, t => {
    if (t === 2) talkbacks.map(talkback => talkback(2));
  });
  fsms.map((fsm, i) => {
    fsm(0, (t, d) => {
      if (t === 0) {
        talkbacks[i] = d;
        console.log(
          "i, talkbacks.length, fsms.length",
          i,
          talkbacks.length,
          fsms.length
        );
        if (talkbacks.length === fsms.length) {
          // sink(1, state);
          talkbacks[state.i](1);
        }
      }
      if (t === 1) {
        console.log("state", state);
        sink(1, state);
        state.c = d;
        const previ = state.i;
        state = transition(state);
        if (state.i !== previ) {
          talkbacks[previ](1);
          talkbacks[state.i](1);
        }
      }
      if (t === 2) sink(2);
    });
  });
};

const a = fsm(s => (s === "S1" ? "S2" : s === "S2" ? "S3" : "S1"), "S1");
const b = fsm(s => (s === "F1" ? "F2" : "F1"), "F1");

pipe(
  hfsm(
    [a, b],
    s => {
      if (s.p === "H1" && s.c === "S3") return { p: "H2", c: "F1", i: 1 };
      if (s.p === "H2" && s.c === "F2") return { p: "H1", c: "S1", i: 0 };
      else return s;
    },
    { p: "H2", c: "S1", i: 0 }
  ),
  take(50),
  forEach(x => console.log(x))
);

// const createStateTraceStream = (transition, duration, initStateStamped) => {
//   const init = {
//     state: initStateStamped.state,
//     duration: duration(initStateStamped.state)
//   };
//   return concat(
//     fromIter([initStateStamped]),
//     pipe(
//       fromIter(range(0, Number.MAX_SAFE_INTEGER)),
//       scan((prev, x) => {
//         const state = transition(prev.state);
//         return {
//           state,
//           duration: duration(state)
//         };
//       }, init),
//       scan(
//         (prev, x) => ({
//           state: x.state,
//           stamp: prev.stamp + x.duration
//         }),
//         initStateStamped
//       )
//     )
//   );
// };

// const fast = pipe(
//   createStateTraceStream(
//     x => (x === "F0" ? "F1" : "F0"),
//     // x => (x === "F0" ? 3 : 7),
//     x => 1,
//     { state: "F0", stamp: 0 }
//   ),
//   take(1000)
// );

// forEach(x => console.log(x))(fast);

// const hfsm = (sfsm1, transition, init) => sfsm => (start, sink) => {
//   if (start !== 0) return;
//   let talkback;
//   sfsm(0, (t, d) => {
//     if (t === 0) talkback = d;
//     if (t === 1) {
//       sink(1, transition(d));
//       //
//     }
//     if (t === 2) sink(2);
//   });
//   sink(0, t => {
//     // start when sink registers
//     if (t === 1) talkback(1);
//     if (t === 2) talkback(2);
//   });
// };

// pipe(
//   fast,
//   hfsm(i => {
//     return i.stamp < 100 ? "SS1" : "SS2";
//   }),
//   forEach(x => console.log(x))
// );
