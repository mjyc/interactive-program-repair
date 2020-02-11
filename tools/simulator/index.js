const run = (transition, initState) => (start, sink) => {
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

const subscribe = ({ next, complete }) => fsm => {
  let talkback;
  fsm(0, (t, d) => {
    if (t === 0) talkback = d;
    if (t === 1) next(d);
    if (t === 2) complete();
    if (t === 0) talkback(1);
  });
};

// TODO: update to make it behave like run
const hrun = (fsms, transition, initState) => (start, sink) => {
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
        const curState = Object.assign({}, state, { child: d });
        if (curState.stop !== i) sink(1, curState);
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

module.exports = {
  run,
  subscribe,
  hrun
};
