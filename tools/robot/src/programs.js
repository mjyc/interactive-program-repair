const xs = require("xstream").default;
const dropRepeats = require("xstream/extra/dropRepeats").default;
const pairwise = require("xstream/extra/pairwise").default;
const extractPoseFeatures = require("./extractPoseFeatures");

const makeStateDetector = (
  {
    minLevel = Number.MIN_VALUE,
    maxLevel = Number.MAX_VALUE,
    activeTimeout = 0,
    inactiveTimeout = 0
  } = {},
  { initState = -1 } = {}
) => {
  if (activeTimeout < 0)
    throw new RangeError(`activeTimeout < 0; ${activeTimeout}`);
  if (inactiveTimeout < 0)
    throw new RangeError(`inactiveTimeout < 0; ${inactiveTimeout}`);

  return ({ level = xs.never(), Time } = {}) => {
    const instState$ = level
      .map(x => {
        return x < minLevel ? -1 : x > maxLevel ? 1 : 0;
      })
      .compose(dropRepeats());
    const state$ = instState$
      .map(x => {
        return xs
          .of(x)
          .compose(Time.delay(x === 0 ? activeTimeout : inactiveTimeout));
      })
      .flatten()
      .startWith(initState)
      .compose(dropRepeats());
    return state$;
  };
};

const makeInstructor = ({
  instructions = [],
  computeDelta = (detectorVal, i) => 0
} = {}) => {
  if (instructions.length === 0)
    throw new RangeError(`instructions.length === 0`);
  return ({
    start = xs.never(),
    detector = xs.never(),
    user = xs.never()
  } = {}) => {
    const intent$ = xs.merge(
      start.take(1).mapTo({ type: "start", value: null }),
      detector.map(x => ({ type: "detector", value: x })),
      user.map(x => ({ type: "user", value: x }))
    );

    const model$ = intent$.fold(
      (model, intent) => {
        const started = intent.type === "start" ? true : model.started;
        const tmpi =
          model.started &&
          !model.hold &&
          (intent.type === "detector" || intent.type === "user")
            ? model.i + computeDelta(intent.value, model.i)
            : model.i;
        const i =
          tmpi >= 0 && (instructions.length === 0 || tmpi < instructions.length)
            ? tmpi
            : model.i;
        // const lastHumanInput =
        //   intent === "Next" ||
        //   intent === "Go back" ||
        //   intent === "Yes" ||
        //   intent === "No" ||
        //   intent === "What's next?" ||
        //   intent === "Done! Let's move on" // defined in "tools/robot/src/index.js"
        //     ? intent
        //     : model.lastHumanInput;
        // const hold = lastHumanInput === "Go back";
        return {
          started,
          i
          // lastUserIntent,
          // hold
        };
      },
      {
        started: false,
        i: 0
        // lastUserIntent: "",
        // hold: false
      }
    );
    const i$ = model$
      .filter(x => x.started)
      .compose(dropRepeats((a, b) => a.i === b.i));

    const setMessage$ = xs.merge(
      start.take(1).mapTo("Hello! Are you ready?"),
      i$.map(x => instructions[x.i])
    );
    const askMultipleChoice$ = i$.map(x =>
      x.i === 0
        ? ["Next"]
        : x.i === instructions.length - 1
        ? ["Go back", "Done"]
        : ["Go back", "Next"]
    );

    return { setMessage: setMessage$, askMultipleChoice: askMultipleChoice$ };
  };
};

const makeNeckExercise = () => {
  const Instructor = makeInstructor({
    instructions: [
      "Tilt your head to LEFT (1/6)",
      "Tilt your head to RIGHT (2/6)",
      "Tilt your head to LEFT (3/6)",
      "Tilt your head to RIGHT (4/6)",
      "Tilt your head to LEFT (5/6)",
      "Tilt your head to RIGHT (6/6)",
      "Great!"
    ],
    computeDelta: (detectorVal, i) => {
      return (i % 2 === 0 && detectorVal === -1) ||
        (i % 2 === 1 && detectorVal === 1)
        ? 1
        : 0;
    }
  });

  return ({ tabletfaceLoaded, poses, askMultipleChoiceFinished, Time }) => {
    const ready$ = xs.combine(tabletfaceLoaded, poses.take(1));

    // setup StateDetector
    const poseFeatures$ = poses.map(poses =>
      poses.length === 0 ? {} : extractPoseFeatures(poses[0])
    );
    const faceAngle$ = poseFeatures$.map(({ faceAngle }) => faceAngle);
    const state$ = makeStateDetector(
      {
        minLevel: -15,
        maxLevel: 15,
        activeTimeout: 0,
        inactiveTimeout: 500
      },
      { initState: 0 }
    )({ level: faceAngle$, Time });

    // setup Instructor
    const instructorSink = Instructor({
      start: askMultipleChoiceFinished.filter(x => x === "I'm ready").take(1),
      detector: state$
        .compose(pairwise)
        .filter(([a, b]) => a === 0 && (b === -1 || b === 1))
        .map(([a, b]) => b)
      // user: askMultipleChoice.filter().map()
    });

    // setup outputs
    const setMessage$ = ready$.mapTo("Ready?");
    const askMultipleChoice$ = ready$.mapTo(["I'm ready"]);

    return Object.assign({}, instructorSink, {
      setMessage: xs.merge(setMessage$, instructorSink.setMessage),
      askMultipleChoice: xs.merge(
        askMultipleChoice$,
        instructorSink.askMultipleChoice
      )
    });
  };
};

module.exports = {
  makeStateDetector,
  makeInstructor,
  makeNeckExercise
};
