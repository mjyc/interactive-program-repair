const { promisify } = require("es6-promisify");
const programs = require("./programs");
const simulators = require("./simulators");
const {
  runProgramAsFunctionCall,
  runProgramOffline,
  evaluateParams,
  repair,
  deriveExpectedStateTrace
} = require("./repair");

const logger = require("./logger");
const defaultRepairOptss = require("./testdata/defaultRepairOptss");

describe("runPrograms", () => {
  describe("withSimulatedData", () => {
    ["voice", "neck", "head", "eng", "turn"].map(name => {
      describe(name, () => {
        Array.from(Array(5).keys()).map(i => {
          describe(i, () => {
            test("the two runPrograms return the same 'state' output field", async () => {
              // use defaults
              const simArg = {};
              const progParams = {};

              const createProgram = programs[name];
              const simulatedTraces = simulators[name](simArg);
              const inputTraces = simulatedTraces.input;
              const outputs = await Promise.all([
                promisify(runProgramAsFunctionCall)({
                  createProgram,
                  progParams,
                  inputTraces
                }),
                promisify(runProgramOffline)({
                  createProgram,
                  progParams,
                  inputTraces
                })
              ]);

              logger.debug("true state trace", simulatedTraces.state);
              logger.debug("runProgramAsFunctionCall", outputs[0].state);
              logger.debug("runProgramOffline", outputs[1].state);
              expect(outputs[0].state).toEqual(outputs[1].state);
            });
          });
        });
      });
    });
  });

  describe("withRecordedData", () => {
    it("the two runPrograms return the same 'state' output field", async () => {
      const fs = require("fs");
      const path = "./data/voice.json";
      if (!fs.existsSync(path)) {
        logger.warn(`No test file '${path}'`);
        return;
      }
      const { settings, traces } = JSON.parse(fs.readFileSync(path));

      const createProgram = programs[settings.name];
      const inputTraces = traces;
      const instructions =
        programs.instructions[settings.name][settings.instIndex];
      const outputs = await Promise.all([
        promisify(runProgramAsFunctionCall)({
          createProgram,
          inputTraces,
          programOpts: {
            instructions,
            startImmediately: false
          }
        }),
        promisify(runProgramOffline)({
          createProgram,
          inputTraces,
          programOpts: {
            instructions,
            startImmediately: false
          }
        })
      ]);

      logger.debug("runProgramAsFunctionCall", outputs[0].state);
      logger.debug("runProgramOffline", outputs[1].state);
      logger.debug("recorded state trace", inputTraces.state); // IMPORTANT!! The inputTraces.state[0].stamp !== 0 because recordStreams cannot record events with stamp === 0
      expect(outputs[0].state).toEqual(outputs[1].state);
    });
  });
});
