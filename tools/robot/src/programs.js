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

const makeInstructor = ({ instructions = [] } = {}) => {
  if (instructions.length === 0)
    throw new RangeError(`instructions.length === 0`);
  return ({
    start = xs.never(),
    detector = xs.never(),
    user = xs.never()
  } = {}) => {
    const intent$ = xs.merge(
      start.take(1).mapTo({ type: "start", value: null }), // TODO: take the first one only...
      detector.map(x => ({ type: "detector", value: x })), // TODO:
      user.map(x => ({ type: "user", value: x }))
    );

    intent$.addListener({ next: console.log });

    // const model$ = ss.sscan(
    //   (model, intent) => {
    //     const started = intent.type === "start" ? true : model.started;
    //     const tmpi =
    //       model.started &&
    //       !model.hold &&
    //       (intent.type === "detector" || intent.type === "user")
    //         ? i + intent.value
    //         : i;
    //     const i =
    //       tmpi >= 0 && (instructions.length === 0 || tmpi < instructions.length)
    //         ? tmpi
    //         : model.i;

    //     // const lastHumanInput =
    //     //   intent === "Next" ||
    //     //   intent === "Go back" ||
    //     //   intent === "Yes" ||
    //     //   intent === "No" ||
    //     //   intent === "What's next?" ||
    //     //   intent === "Done! Let's move on" // defined in "tools/robot/src/index.js"
    //     //     ? intent
    //     //     : model.lastHumanInput;
    //     // const hold = lastHumanInput === "Go back";
    //     return {
    //       started,
    //       i,
    //       ready,
    //       lastUserIntent,
    //       hold
    //     };
    //   },
    //   {
    //     started: false,
    //     i: 0,
    //     ready: false,
    //     detecting: false,
    //     lastHumanInput: "Let's do this!", // defined in 'askMultipleChoice$' definition
    //     hold: false
    //   },
    //   intent$
    // );

    // const state$ = ss.sdistinctUntilChanged(
    //   (a, b) => a === b,
    //   ss.smap(m => m.i, model$)
    // );

    // const setMessage$ = ss.smerge(
    //   ss.smapTo("Hello! Are you ready?", sources.tabletfaceLoaded),
    //   ss.smap(
    //     x =>
    //       x.i === -1
    //         ? ""
    //         : instructions.length === 0
    //         ? `instruction#${x.i}`
    //         : instructions[Math.floor(x.i)], // need Math.floor to handle 'mode = "yesno"' case
    //     ss.sfilter(
    //       x =>
    //         !!x.started &&
    //         x.lastHumanInput !== "What's next?" &&
    //         x.lastHumanInput !== "Done! Let's move on",
    //       model$
    //     )
    //   )
    // );
    // const askMultipleChoice$ = ss.smerge(
    //   ss.smapTo(["Let's do this!"], sources.tabletfaceLoaded),
    //   ss.smap(
    //     x =>
    //       x.i === 0
    //         ? mode === "yesno"
    //           ? ["Yes", "No"]
    //           : ["Next"]
    //         : Math.floor(x.i) === instructions.length - 1 // need Math.floor to handle 'mode = "yesno"' case
    //         ? ["Go back", "What's next?"]
    //         : mode === "yesno"
    //         ? ["Go back", "Yes", "No"]
    //         : ["Go back", "Next"],
    //     ss.sfilter(
    //       x =>
    //         !!x.started &&
    //         x.lastHumanInput !== "What's next?" &&
    //         x.lastHumanInput !== "Done! Let's move on",
    //       model$
    //     )
    //   )
    // );

    return {};
    // return Object.assign(
    //   {},
    //   {
    //     detector: sources.detector,
    //     state: state$,
    //     setMessage: setMessage$,
    //     askMultipleChoice: askMultipleChoice$,
    //     followFace: ss.smap(
    //       x => x.started && x.detecting && x.i !== instructions.length - 1,
    //       model$
    //     ),
    //     express: ss.sdistinctUntilChanged(
    //       // smile with the last instruction
    //       (a, b) => a === b,
    //       ss.smap(
    //         () => "HAPPY",
    //         ss.sfilter(x => x.i === instructions.length - 1, model$)
    //       )
    //     )
    //   },
    //   mode === "yesno"
    //     ? {
    //         say: ss.smap(
    //           intent => `I got ${intent}`,
    //           ss.sfilter(
    //             intent => intent === "Yes" || intent === "No",
    //             ss.smap(
    //               intent =>
    //                 intent === "nod"
    //                   ? "Yes"
    //                   : intent === "shake"
    //                   ? "No"
    //                   : intent,
    //               intent$
    //             )
    //           )
    //         )
    //       }
    //     : {}
    // );
  };
};

const makeNeckExercise = () => {
  const Instructor = makeInstructor({
    instructions: [
      [
        "Tilt your head to LEFT (1/6)",
        "Tilt your head to RIGHT (2/6)",
        "Tilt your head to LEFT (3/6)",
        "Tilt your head to RIGHT (4/6)",
        "Tilt your head to LEFT (5/6)",
        "Tilt your head to RIGHT (6/6)",
        "Great!"
      ]
    ]
  });

  return ({ tabletfaceLoaded, poses, Time }) => {
    // setup StateDetector
    const poseFeatures$ = poses.map(poses =>
      poses.length === 0 ? {} : extractPoseFeatures(poses[0])
    );
    const faceAngle$ = poseFeatures$.map(({ faceAngle }) => faceAngle);
    const state$ = makeStateDetector(
      {
        minLevel: -15,
        maxLevel: 15,
        activeTimeout: 500,
        inactiveTimeout: 500
      },
      { initState: 0 }
    )({ level: faceAngle$, Time });

    // setup Instructor
    const instructorSink = Instructor({
      start: tabletfaceLoaded.take(1).mapTo(true), // TODO; do this at upper layer
      detector: state$
        .compose(pairwise)
        .filter(([a, b]) => a === 0 && (b === -1 || b === 1))
        .map(([a, b]) => b)
      // user: askMultipleChoice.filter().map()
    });

    return { setMessage: state$.map(x => `${x}`) };
  };
};

module.exports = {
  makeStateDetector,
  makeInstructor,
  makeNeckExercise
};
