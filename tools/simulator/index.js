const {
  forEach,
  fromIter,
  map,
  filter,
  pipe,
  scan,
  take,
  interval
} = require("callbag-basics");
const pairwise = require("callbag-pairwise");

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
      while (typeof curfd === "undefined" || cursd.stamp > curfd.stamp)
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

const fast = pipe(
  fromIter(range(0, Number.MAX_SAFE_INTEGER)),
  map(countToStateLabel),
  map(x => ({
    label: x,
    duration: stateLabelToDuration(x)
  })),
  scan(
    (prev, x) => ({
      label: x.label,
      stamp: prev.stamp + x.duration
    }),
    { stamp: 0 }
  ),
  take(10)
);

const slow = pipe(
  fromIter(range(0, Number.MAX_SAFE_INTEGER)),
  map(x => `S${x % 2}`),
  map(x => ({
    label: x,
    duration: x === "S0" ? 10 : 15
  })),
  scan(
    (prev, x) => ({
      label: x.label,
      stamp: prev.stamp + x.duration
    }),
    { stamp: 0 }
  ),
  take(10)
);

// forEach(x => console.log(x))(fast);
// forEach(x => console.log(x))(slow);

pipe(
  slow,
  sample(fast),
  forEach(console.log)
);
