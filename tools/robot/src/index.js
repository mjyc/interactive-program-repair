import { run } from "@cycle/run";
import {
  createTabletFaceRobotSandboxDrivers,
  TabletFaceRobotSandbox
} from "tabletrobotface-starter-lib";
import { makeNeckExercise } from "interactive-program-repair/example_programs";

// defaults to "dev" setting
const settings = {
  record: true,
  displayPoseViz: true,
  hideScroll: false
};
try {
  Object.assign(settings, require("./settings.json"));
} catch (err) {
  console.warn(err);
}
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
