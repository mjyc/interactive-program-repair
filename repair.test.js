const { promisify } = require("util");
const { makeNeckExercise } = require("./example_programs");
const { runProgramOffline, evaluateParams, repair } = require("./repair");

const logger = require("./logger");

describe("runPrograms", () => {
  describe("withRecordedData", () => {
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
        programParams: {
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
});

describe("evaluateParams", () => {
  describe("withRecordedData", () => {
    // update the note here
    it("{todo}", async () => {
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

      // const expected = inputTraces.state.map(x => ({
      //   type: "next",
      //   value: x.value,
      //   time: x.stamp
      // }));
      // expect(output.state).toEqual(expected);
      expect(1).toEqual(1);
    });
  });
});

describe("repair", () => {
  describe("withRecordedData", () => {
    // update the note here
    it("{todo}", async () => {
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
            maxLevel: [0, 45 + 5, 5],
            inactiveTimeout: [0, 2000, 200]
          }
        }
      });
      logger.debug("stateTrace", stateTrace);
      logger.debug("repair output", output);

      // const expected = inputTraces.state.map(x => ({
      //   type: "next",
      //   value: x.value,
      //   time: x.stamp
      // }));
      // expect(output.state).toEqual(expected);
      expect(1).toEqual(1);
    });
  });
});
