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

function* range(from, to) {
  let i = from;
  while (i <= to) {
    yield i;
    i++;
  }
}

const countToStateLabel = x => `S${x % 2}`;
const stateLabelToDuration = x => (x === "S0" ? 3 : 7);

const s1 = pipe(
  fromIter(range(0, Number.MAX_SAFE_INTEGER)),
  map(countToStateLabel),
  map(x => ({
    label: x,
    duration: stateLabelToDuration(x)
  })),
  take(10)
);

const s2 = pipe(
  fromIter(range(0, Number.MAX_SAFE_INTEGER)),
  map(countToStateLabel),
  map(x => ({
    label: x,
    duration: stateLabelToDuration(x)
  })),
  take(10)
);

forEach(x => console.log(x))(s1);
forEach(x => console.log(x))(s2);
