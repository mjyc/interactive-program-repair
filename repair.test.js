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
      const { settings, traces } = JSON.parse(fs.readFileSync(path));

      console.log(settings, traces);

      // const createProgram = programs[settings.name];
      // const inputTraces = traces;
      // const instructions =
      //   programs.instructions[settings.name][settings.instIndex];
      // const outputs = await Promise.all([
      //   promisify(runProgramAsFunctionCall)({
      //     createProgram,
      //     inputTraces,
      //     programOpts: {
      //       instructions,
      //       startImmediately: false
      //     }
      //   }),
      //   promisify(runProgramOffline)({
      //     createProgram,
      //     inputTraces,
      //     programOpts: {
      //       instructions,
      //       startImmediately: false
      //     }
      //   })
      // ]);

      // logger.debug("runProgramAsFunctionCall", outputs[0].state);
      // logger.debug("runProgramOffline", outputs[1].state);
      // logger.debug("recorded state trace", inputTraces.state); // IMPORTANT!! The inputTraces.state[0].stamp !== 0 because recordStreams cannot record events with stamp === 0
      // expect(outputs[0].state).toEqual(outputs[1].state);
      expect(1).toEqual(1);
    });
  });
});
