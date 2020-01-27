const { promisify } = require("util");
const {
  makeNeckExercise,
  deriveNeckExerciseDesiredState
} = require("./example_programs");
const { runProgramOffline, evaluateParams, repair } = require("./repair");

const logger = require("./logger");

describe("withRecordedData", () => {
  describe("runPrograms", () => {
    // update the note here
    it("the two runPrograms return the same 'state' output field", async () => {
      const fs = require("fs");
      const path = "./testdata/recorded.json";
      if (!fs.existsSync(path)) {
        logger.warn(`No test file '${path}'`);
        return;
      }
      const { settings, traces: inputTraces } = JSON.parse(
        fs.readFileSync(path)
      );

      const makeProgram = makeNeckExercise;
      const output = await promisify(runProgramOffline)({
        makeProgram,
        progParams: {
          minLevel: -Number.MAX_VALUE,
          maxLevel: Number.MAX_VALUE
        },
        inputTraces
      });
      logger.debug("runProgramOffline", output.state);
      logger.debug("recorded state trace", inputTraces.state);

      const expected = inputTraces.state.map(x => ({
        type: "next",
        value: x.value,
        time: x.stamp
      }));
      expect(output.state).toEqual(expected);
    });
  });

  describe("evaluateParams", () => {
    it("outputs eval score > 0.5 when using reasonable prog params", async () => {
      const fs = require("fs");
      const path = "./testdata/recorded.json";
      if (!fs.existsSync(path)) {
        logger.warn(`No test file '${path}'`);
        return;
      }
      const { settings, traces: inputTraces } = JSON.parse(
        fs.readFileSync(path)
      );

      const makeProgram = makeNeckExercise;
      inputTraces.askMultipleChoiceFinished = inputTraces.askMultipleChoiceFinished.filter(
        x => x.value !== "Next" && x.value !== "Go back" && x.value !== "Done"
      );
      const stateTrace = inputTraces.state;
      const output = await evaluateParams({
        makeProgram,
        programParams: {
          minLevel: -15,
          maxLevel: 15
        },
        inputTraces,
        stateTrace
      });
      logger.debug("stateTrace", stateTrace);
      logger.debug("evaluateParams output", output);

      expect(output.score).toBeGreaterThan(0.5);
    });
  });

  describe("deriveNeckExerciseDesiredState", () => {
    it("desiredStateTrace === stateTrace", async () => {
      const fs = require("fs");
      const path = "./testdata/recorded.json";
      if (!fs.existsSync(path)) {
        logger.warn(`No test file '${path}'`);
        return;
      }
      const { settings, traces: inputTraces } = JSON.parse(
        fs.readFileSync(path)
      );
      const desiredStateTrace = deriveNeckExerciseDesiredState(inputTraces);
      expect(desiredStateTrace).toEqual(inputTraces.state);
    });
  });

  describe("repair", () => {
    it("finds reasonable prog params", async () => {
      const fs = require("fs");
      const path = "./testdata/recorded.json";
      if (!fs.existsSync(path)) {
        logger.warn(`No test file '${path}'`);
        return;
      }
      const { settings, traces: inputTraces } = JSON.parse(
        fs.readFileSync(path)
      );

      const makeProgram = makeNeckExercise;
      inputTraces.askMultipleChoiceFinished = inputTraces.askMultipleChoiceFinished.filter(
        x => x.value !== "Next" && x.value !== "Go back" && x.value !== "Done"
      );
      const stateTrace = inputTraces.state;
      const output = await repair({
        makeProgram,
        inputTraces,
        stateTrace,
        options: {
          domains: {
            minLevel: [0, -(45 + 5), -5],
            maxLevel: [0, 45 + 5, 5]
          }
        }
      });
      logger.debug("stateTrace", stateTrace);
      logger.debug("repair output", output);

      expect(output.progParams.minLevel).toBeLessThan(-15);
      expect(output.progParams.maxLevel).toBeGreaterThan(15);
    });
  });
});
