import xs from "xstream";
import { run } from "@cycle/run";
import {
  createTabletFaceRobotSandboxDrivers,
  TabletFaceRobotSandbox
} from "tabletrobotface-starter-lib";
import { makeNeckExercise } from "./programs";

const settings = Object.assign(
  // defaults to "dev" setting
  { record: true, displayPoseViz: true, hideScroll: false },
  require("./settings.json")
);
if (settings.hideScroll) {
  document.body.style.overflow = "hidden";
}

const makeProgram = () => {
  return sources => {
    const ready$ = xs.combine(sources.tabletfaceLoaded, sources.poses.take(1));
    return Object.assign(
      {
        setMessage: ready$.mapTo("Do you want to start?"),
        askMultipleChoice: ready$.mapTo(["Yes"])
        // startRecording: sources.askMultipleChoiceFinished.take(1).mapTo(true)
      },
      makeNeckExercise()(sources)
    );
  };
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
