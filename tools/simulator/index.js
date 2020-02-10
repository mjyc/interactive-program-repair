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

const fsm = (transition, initState) => (start, sink) => {
  if (start !== 0) return;
  let state = null;
  let id = null;

  const stop = () => {
    clearInterval(id);
    id = null;
    state = null;
  };
  const play = () => {
    id = setInterval(() => {
      if (state === null) state = initState;
      else state = transition(state);
      sink(1, state);
    }, 0);
  };
  sink(0, (t, d) => {
    if (t === 1) {
      if (id) stop();
      else play();
    }
    if (t === 2) stop();
  });
};

const hfsm = (fsms, transition, initState) => (start, sink) => {
  if (start !== 0) return;
  let state = initState;
  let talkbacks = [];
  sink(0, t => {
    if (t === 2) {
      talkbacks.map(talkback => talkback(2));
      talkbacks = [];
    }
  });
  fsms.map((fsm, i) => {
    fsm(0, (t, d) => {
      if (t === 0) {
        talkbacks[i] = d;
        if (talkbacks.length === fsms.length) {
          if (typeof state.start !== "undefined") talkbacks[state.start](1);
          if (typeof state.stop !== "undefined") talkbacks[state.stop](2);
        }
      }
      if (t === 1) {
        const curState = Object.assign({}, state, { c: d });
        sink(1, curState);
        state = transition(curState);
        if (talkbacks.length === fsms.length) {
          if (typeof state.stop !== "undefined") talkbacks[state.stop](2);
          if (typeof state.start !== "undefined") talkbacks[state.start](1);
        }
      }
      // t === 2 does not happen for fsms
    });
  });
};

// // sub fsms
// const a = fsm(s => {
//   s === "S1" ? "S2" : s === "S2" ? "S3" : "S1";
// }, "S1");
// const b = fsm(s => (s === "F1" ? "F2" : "F1"), "F1");

// pipe(
//   hfsm(
//     [a, b],
//     s => {
//       if (s.p === "H1" && s.c === "S3")
//         return { p: "H2", c: "F1", start: 1, stop: 0 };
//       if (s.p === "H2" && s.c === "F2")
//         return { p: "H1", c: "S1", start: 0, stop: 1 };
//       else
//         return {
//           p: s.p,
//           c: s.c
//         };
//     },
//     { p: "H1", c: "S1", start: 0 }
//   ),
//   take(20),
//   forEach(x => console.log(x))
// );

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

module.exports = {
  fsm
};
