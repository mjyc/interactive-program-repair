const { forEach, pipe, take } = require("callbag-basics");
const random = require("random");
const { run, subscribe, hrun } = require("./index");

const runTiltedCenter = run(
  s => {
    if (s.label === "center")
      return {
        label: "left", // or "right"
        stamp: s.stamp + 5 // duration of "center" higher than 0ms (activeTimeout)
      };
    if (s.label === "left")
      return {
        label: "center",
        stamp: s.stamp + 3 // duration of "left" lower than 500ms (inactiveTimeout)
      };
    return s;
  },
  {
    label: "center",
    stamp: 0
  }
);

const runTiltedLeft = run(
  s => {
    if (s.label === "left")
      return {
        label: "center",
        stamp: s.stamp + 5 // higher than 500ms
      };
    return s;
  },
  {
    label: "left",
    stamp: 0
  }
);

const neckExerciseFSM = hrun(
  [runTiltedCenter, runTiltedLeft],
  s => {
    if (s.label === "hcenter" && s.child.label === "left" && s.child.stamp > 20)
      return {
        label: "hleft",
        child: { label: "left", stamp: 0 },
        stamp: s.stamp + s.child.stamp,
        start: 1,
        stop: 0
      };
    if (s.label === "hleft" && s.child.label === "center")
      return {
        label: "hcenter",
        child: { label: "center", stamp: 0 },
        stamp: s.stamp + s.child.stamp,
        start: 0,
        stop: 1
      };
    else return Object.assign({}, s, { start: undefined, stop: undefined });
  },
  {
    label: "hcenter",
    child: { label: "center", stamp: 0 },
    stamp: 0,
    start: 0
  }
);

pipe(
  neckExerciseFSM,
  // runTiltedCenter,
  take(20),
  subscribe({
    next: d => {
      delete d.start;
      delete d.stop;
      console.log(d);
    },
    complete: () => {}
  })
);
