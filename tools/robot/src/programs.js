const xs = require("xstream").default;
const dropRepeats = require("xstream/extra/dropRepeats").default;
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

const makeNeckExercise = () => {
  return sources => {
    const poseFeatures$ = sources.poses.map(poses =>
      poses.length === 0 ? {} : extractPoseFeatures(poses[0])
    );
    const faceAngle$ = poseFeatures$.map(({ faceAngle }) => faceAngle);
    const state$ = makeStateDetector(
      {
        minLevel: -15,
        maxLevel: 15,
        activeTimeout: 500,
        inactiveTimeout: 2000
      },
      { initState: 0 }
    )({ level: faceAngle$, Time: sources.Time });

    return { setMessage: state$.map(x => `${x}`) };
  };
};

// const makeInstructor = ({
//   instructions = [],
//   isNext = intent => intent === 0,
//   isReady = intent => intent === 1 || intent === "Next",
//   isDetecting = intent => intent === 1,
//   mode = "default", // "default" or "yesno"
//   ss = streams
// } = {}) => {
//   return sources => {
//     if (typeof sources.detector === "undefined") sources.detector = ss.sempty();
//     if (typeof sources.askMultipleChoiceFinished === "undefined")
//       sources.askMultipleChoiceFinished = ss.sempty();
//     if (typeof sources.tabletfaceLoaded === "undefined")
//       sources.tabletfaceLoaded = ss.sempty();

//     const intent$ = ss.smerge(
//       sources.detector,
//       ss.sfilter(x => x !== null, sources.askMultipleChoiceFinished)
//     );
//     const model$ = ss.sscan(
//       (model, intent) => {
//         const started =
//           intent === "Let's do this!"
//             ? true
//             : model.started;
//         const delta =
//           intent === "Next" ||
//           intent === "Yes" ||
//           intent === "No" ||
//           (isNext(intent, model.i) &&
//             (model.ready || ignoreReady) &&
//             !model.hold)
//             ? 1
//             : intent === "Go back"
//             ? -1
//             : 0;
//         const tmpi = Math.floor(model.i) + delta; // need Math.floor to handle 'mode = "yesno"' case
//         const i =
//           started &&
//           tmpi >= 0 &&
//           (instructions.length === 0 || tmpi < instructions.length)
//             ? mode === "yesno"
//               ? tmpi +
//                 (intent === "Yes" || intent === "nod"
//                   ? 0.75 // yes
//                   : intent === "No" || intent === "shake"
//                   ? 0.25 // not
//                   : 0)
//               : tmpi
//             : model.i;
//         const ready = i === model.i && isReady(intent);
//         const detecting = isDetecting(intent, i);
//         const lastHumanInput =
//           intent === "Next" ||
//           intent === "Go back" ||
//           intent === "Yes" ||
//           intent === "No" ||
//           intent === "What's next?" ||
//           intent === "Done! Let's move on" // defined in "tools/robot/src/index.js"
//             ? intent
//             : model.lastHumanInput;
//         const hold = lastHumanInput === "Go back";
//         return {
//           started,
//           i,
//           ready,
//           detecting,
//           lastHumanInput,
//           hold
//         };
//       },
//       {
//         started: false,
//         i: 0,
//         ready: false,
//         detecting: false,
//         lastHumanInput: "Let's do this!", // defined in 'askMultipleChoice$' definition
//         hold: false
//       },
//       intent$
//     );

//     const state$ = ss.sdistinctUntilChanged(
//       (a, b) => a === b,
//       ss.smap(m => m.i, model$)
//     );

//     const setMessage$ = ss.smerge(
//       ss.smapTo("Hello! Are you ready?", sources.tabletfaceLoaded),
//       ss.smap(
//         x =>
//           x.i === -1
//             ? ""
//             : instructions.length === 0
//             ? `instruction#${x.i}`
//             : instructions[Math.floor(x.i)], // need Math.floor to handle 'mode = "yesno"' case
//         ss.sfilter(
//           x =>
//             !!x.started &&
//             x.lastHumanInput !== "What's next?" &&
//             x.lastHumanInput !== "Done! Let's move on",
//           model$
//         )
//       )
//     );
//     const askMultipleChoice$ = ss.smerge(
//       ss.smapTo(["Let's do this!"], sources.tabletfaceLoaded),
//       ss.smap(
//         x =>
//           x.i === 0
//             ? mode === "yesno"
//               ? ["Yes", "No"]
//               : ["Next"]
//             : Math.floor(x.i) === instructions.length - 1 // need Math.floor to handle 'mode = "yesno"' case
//             ? ["Go back", "What's next?"]
//             : mode === "yesno"
//             ? ["Go back", "Yes", "No"]
//             : ["Go back", "Next"],
//         ss.sfilter(
//           x =>
//             !!x.started &&
//             x.lastHumanInput !== "What's next?" &&
//             x.lastHumanInput !== "Done! Let's move on",
//           model$
//         )
//       )
//     );

//     return Object.assign(
//       {},
//       {
//         detector: sources.detector,
//         state: state$,
//         setMessage: setMessage$,
//         askMultipleChoice: askMultipleChoice$,
//         followFace: ss.smap(
//           x => x.started && x.detecting && x.i !== instructions.length - 1,
//           model$
//         ),
//         express: ss.sdistinctUntilChanged(
//           // smile with the last instruction
//           (a, b) => a === b,
//           ss.smap(
//             () => "HAPPY",
//             ss.sfilter(x => x.i === instructions.length - 1, model$)
//           )
//         )
//       },
//       mode === "yesno"
//         ? {
//             say: ss.smap(
//               intent => `I got ${intent}`,
//               ss.sfilter(
//                 intent => intent === "Yes" || intent === "No",
//                 ss.smap(
//                   intent =>
//                     intent === "nod"
//                       ? "Yes"
//                       : intent === "shake"
//                       ? "No"
//                       : intent,
//                   intent$
//                 )
//               )
//             )
//           }
//         : {}
//     );
//   };
// };

module.exports = {
  makeStateDetector,
  makeNeckExercise
};
