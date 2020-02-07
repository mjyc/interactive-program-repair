describe("test1", () => {
  test("#0", () => {
    expect(1).toBe(1);
  });
});

// const { simulateStateTrace } = require("./index");

// describe("simulateStateTrace", () => {
//   describe("level1", () => {
//     test("#0", () => {
//       const trace = simulateStateTrace({
//         initState: "a",
//         initStamp: 0,
//         getStateTrace: (state, stamp) => {
//           const next = {
//             a: "b",
//             b: "a"
//           };
//           const dur = {
//             a: stamp + 10,
//             b: stamp + 20
//           };
//           return [
//             {
//               stamp: dur[state],
//               value: next[state]
//             }
//           ];
//         },
//         stop: (_, stamp) => stamp > 30
//       });
//       expect(trace).toEqual([
//         { stamp: 0, value: "a" },
//         { stamp: 10, value: "b" },
//         { stamp: 30, value: "a" },
//         { stamp: 40, value: "b" }
//       ]);
//     });

//     test("#1", () => {
//       const trace = simulateStateTrace({
//         initState: "a",
//         initStamp: 0,
//         getStateTrace: (state, stamp) => {
//           const next = {
//             a: "b",
//             b: "a"
//           };
//           const dur = {
//             a: stamp + 10,
//             b: stamp + 20
//           };
//           return [
//             {
//               stamp: dur[state],
//               value: next[state]
//             }
//           ];
//         },
//         stop: (_, stamp) => stamp >= 30
//       });
//       expect(trace).toEqual([
//         { stamp: 0, value: "a" },
//         { stamp: 10, value: "b" },
//         { stamp: 30, value: "a" }
//       ]);
//     });

//     test("#2", () => {
//       const trace = simulateStateTrace({
//         initState: "a",
//         initStamp: 0,
//         getStateTrace: (state, stamp) => {
//           const next = {
//             a: "b",
//             b: "a"
//           };
//           const dur = {
//             a: stamp + 11,
//             b: stamp + 22
//           };
//           return [
//             {
//               stamp: dur[state],
//               value: next[state]
//             }
//           ];
//         },
//         stop: (_, stamp) => stamp >= 30
//       });
//       expect(trace).toEqual([
//         { stamp: 0, value: "a" },
//         { stamp: 11, value: "b" },
//         { stamp: 33, value: "a" }
//       ]);
//     });
//   });
// });
