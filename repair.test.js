const { promisify } = require("util");
const example_programs = require("./example_programs");
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

      console.log("settings.progName", settings.progName);
      const makeProgram = example_programs[settings.progName];
      const progParams = settings.progParams;
      const output = await promisify(runProgramOffline)({
        makeProgram,
        progParams,
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

      const makeProgram = example_programs[settings.progName];
      const progParams = {
        minLevel: -15,
        maxLevel: 15
      };
      inputTraces.askMultipleChoiceFinished = inputTraces.askMultipleChoiceFinished.filter(
        x => x.value !== "Next" && x.value !== "Go back" && x.value !== "Done"
      );
      const stateTrace = inputTraces.state;
      const output = await evaluateParams({
        makeProgram,
        progParams,
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
      const { traces: inputTraces } = JSON.parse(fs.readFileSync(path));
      const desiredStateTrace = example_programs.deriveNeckExerciseDesiredState(
        inputTraces
      );
      expect(desiredStateTrace).toEqual(inputTraces.state);
    });
  });

  describe("repair", () => {
    it("finds reasonable prog params that yields score > 0.8", async () => {
      const fs = require("fs");
      const path = "./testdata/recorded.json";
      if (!fs.existsSync(path)) {
        logger.warn(`No test file '${path}'`);
        return;
      }
      const { settings, traces: inputTraces } = JSON.parse(
        fs.readFileSync(path)
      );

      const makeProgram = example_programs[settings.progName];
      inputTraces.askMultipleChoiceFinished = inputTraces.askMultipleChoiceFinished.filter(
        x => x.value !== "Next" && x.value !== "Go back" && x.value !== "Done"
      );
      const stateTrace = inputTraces.state;
      const output = await repair({
        makeProgram,
        inputTraces,
        stateTrace,
        options: {
          domainSpace: {
            minLevel: Array.from({ length: 19 }, (x, i) => -45 + 5 * i),
            maxLevel: Array.from({ length: 19 }, (x, i) => -45 + 5 * i),
            useFaceAngle: [true, false]
          }
        }
      });
      logger.debug("stateTrace", stateTrace);
      logger.debug("repair output", output);

      // expect(output.progParams.minLevel).toBeLessThan(-15);
      expect(output.score).toBeGreaterThan(0.8);
      expect(1).toBe(1);
    });
  });
});
