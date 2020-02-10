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

module.exports = {
  run,
  subscribe
};
