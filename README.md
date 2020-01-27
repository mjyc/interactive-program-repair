# Interactive Program Repair

Interactive program repair in JavaScript.

## Examples

### Neck Exercise Program Repair

First, install nodejs (>= v10.16.0) and npm (>= 6.9.0). Then

1. Run the neck exercise program (or use [Codesandbox](https://codesandbox.io/s/github/mjyc/interactive-program-repair/tree/master/tools/robot)):
  ```
  cd tools/robot;
  npm install;
  npm start;
  ```

2. Follow the instructions. Once done, scroll down to find the "Download" button and click it to download the human-robot-interaction traces.

3. Run
  ```
  cd examples/example_program_repair
  node main.js downloaded_fileprefix/traces_{date}.json
  ```
  The output shows repaired program parameters
