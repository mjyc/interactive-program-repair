const { promisify } = require("util");
const { makeNeckExercise } = require("./example_programs");
const { runProgramOffline } = require("./repair");

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

      const createProgram = makeNeckExercise;
      const output = await promisify(runProgramOffline)({
        createProgram,
        programParams: {},
        programOpts: {},
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
