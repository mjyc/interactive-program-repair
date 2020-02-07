import { run } from "@cycle/run";
import {
  createTabletFaceRobotSandboxDrivers,
  TabletFaceRobotSandbox
} from "tabletrobotface-starter-lib";
import programs from "interactive-program-repair/examples/programs";

// defaults to "dev" setting
const settings = {
  record: true,
  displayPoseViz: true,
  hideScroll: false,
  progName: "makeNeckExercise",
  progParams: {
    minLevel: -Number.MAX_VALUE,
    maxLevel: Number.MAX_VALUE,
    inactiveTimeout: 500,
    useFaceAngle: true,
    flipSign: false
  }
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
  return programs[settings.progName](settings.progParams);
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
