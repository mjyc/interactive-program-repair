# Interactive Program Repair

Interactive program repair in JavaScript.

This repo is based on "Iterative Repair of Social Robot Programs from Implicit User Feedback via Bayesian Inference" published in [RSS](https://roboticsconference.org/)2020.

## Examples

### Neck Exercise Program Repair

First, install nodejs (>= v10.16.0) and npm (>= 6.9.0). Then

1. Run the neck exercise program (or use [Codesandbox](https://codesandbox.io/s/github/mjyc/interactive-program-repair/tree/master/tools/robot)):
    ```
    cd tools/robot;
    npm install;
    npm build;
    npm start;
    ```

2. Follow the instructions. Once done, scroll down to find the "Download" button and click it to download the human-robot-interaction traces.
    - Note: you can review recorded data by running
      ```
      cd tools/dataplayer;
      npm install;
      echo '{ fileprefix: "prefix_to_downloaded_files" }' > src/settings.json
      npm start;
      ```

3. Run
    ```
    cd examples/example_program_repair
    node main.js downloaded_fileprefix/traces_{date}.json
    ```
    The output shows repaired program parameters.

### Testing Repair via a Human Simulator

Run

```
cd pkgs/callbag-fsm && npm install; # install dependencies
node demo4repair.js > path_to_simulated_human_inputs; # generate simulated data
cd ../../;
node examples/repair/main path_to_simulated_human_inputs # run repair with the generated data
```

See [`./pkgs/callbag-fsm/demo4repair.js`](./pkgs/callbag-fsm/demo4repair.js) for a human simulator implementation; details are available at [`./pkgs/callbag-fsm`](./pkgs/callbag-fsm).

## Thank you

- [Maya Cakmak](https://github.com/mayacakmak) for her support
- [Julie L. Newcomb](https://jn80842.github.io/) for inspiring discussions
- [Nicolas Dubien](https://github.com/dubzzz) for creating [fast-check](https://github.com/dubzzz/fast-check) where I learned about [model-based testing](https://github.com/dubzzz/fast-check/blob/master/documentation/1-Guides/Tips.md)
