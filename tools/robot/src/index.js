import { run } from "@cycle/run";
import {
  createTabletFaceRobotSandboxDrivers,
  TabletFaceRobotSandbox
} from "tabletrobotface-starter-lib";
import { makeNeckExercise } from "interactive-program-repair/example_programs";

const settings = Object.assign(
  // defaults to "dev" setting
  { record: true, displayPoseViz: true, hideScroll: false },
  require("./settings.json")
);
if (settings.hideScroll) {
  document.body.style.overflow = "hidden";
}

const makeProgram = () => {
  return makeNeckExercise();
};

const main = TabletFaceRobotSandbox(makeProgram, {
  record: settings.record,
  displayPoseViz: settings.displayPoseViz
});

const drivers = createTabletFaceRobotSandboxDrivers({
  record: settings.record,
  settings
});

run(main, drivers);
