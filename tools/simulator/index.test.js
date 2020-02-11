const { pipe, take } = require("callbag-basics");
const { run, subscribe, hrun } = require("./index");

describe("run", () => {
  test("#0", done => {
    const actual = [];
    pipe(
      run(s => (s === "S1" ? "S2" : s === "S2" ? "S3" : "S1"), "S1"),
      take(10),
      subscribe({
        next: d => actual.push(d),
        complete: () => {
          const expected = [
            "S1",
            "S2",
            "S3",
            "S1",
            "S2",
            "S3",
            "S1",
            "S2",
            "S3",
            "S1"
          ];
          expect(actual).toEqual(expected);
          done();
        }
      })
    );
  });
});

describe("hrun", () => {
  test("#0", done => {
    const actual = [];
    pipe(
      hrun(
        [
          run(s => (s === "S1" ? "S2" : s === "S2" ? "S3" : "S1"), "S1"),
          run(s => (s === "F1" ? "F2" : "F1"), "F1")
        ],
        s => {
          if (s.p === "H1" && s.c === "S3")
            return { p: "H2", c: "F1", start: 1, stop: 0 };
          if (s.p === "H2" && s.c === "F2")
            return { p: "H1", c: "S1", start: 0, stop: 1 };
          else
            return {
              p: s.p,
              c: s.c
            };
        },
        { p: "H1", c: "S1", start: 0 }
      ),
      take(10),
      subscribe({
        next: d => actual.push(d),
        complete: () => {
          const expected = [
            { p: "H1", c: "S1" },
            { p: "H1", c: "S2" },
            { p: "H1", c: "S3" },
            { p: "H2", c: "F1" },
            { p: "H2", c: "F2" },
            { p: "H1", c: "S1" },
            { p: "H1", c: "S2" },
            { p: "H1", c: "S3" },
            { p: "H2", c: "F1" },
            { p: "H2", c: "F2" }
          ];
          expect(actual).toEqual(expected);
          done();
        }
      })
    );
  });

  test("#1", done => {
    const actual = [];

    const runTiltedCenter = run(
      s => {
        console.log(s);
        if (s.label === "center")
          return {
            label: "left", // randomize it
            stamp: s.stamp + 5
          };
        if (s.label === "left")
          return {
            label: "center",
            stamp: s.stamp + 11
          };
        return s;
      },
      {
        label: "center",
        stamp: 0
      }
    );
    const runNeckExercise = run(
      s => {
        if (s.label === "center")
          return {
            label: "left",
            stamp: s.stamp + 5 // between 500-1000
          };
        if (s.label === "left")
          return {
            label: "center",
            stamp: s.stamp + 11
          };
        return s;
      },
      {
        label: "center",
        stamp: 0
      }
    );

    pipe(
      runNeckExercise,
      take(10),
      subscribe({
        next: d => actual.push(d),
        complete: () => {
          const expected = [
            "S1",
            "S2",
            "S3",
            "S1",
            "S2",
            "S3",
            "S1",
            "S2",
            "S3",
            "S1"
          ];
          // expect(actual).toEqual(expected);
          console.log(actual);
          done();
        }
      })
    );

    // const tiltedRight = run(s => {
    //   if (s === "HL_LEFT") return "HL_CENTER";
    //   if (s === "HL_CENTER") return "HL_LEFT";
    //   return s;
    // }, "HL_LEFT");

    // const htrans = s => {
    //   // const stamp +=
    //   if (s.p === "center" && s.c === "center")
    //     return { p: "H2", c: "F1", start: 1, stop: 0 };

    //   if (s.p === "H2" && s.c === "F2")
    //     return { p: "H1", c: "S1", start: 0, stop: 1 };
    //   else
    //     return {
    //       p: s.p,
    //       c: s.c,
    //     };
    // };
    // const hinitState = s => ({
    //   p: "center",
    //   c: "center",
    //   stamp: 0,
    //   duration: 10,
    //   start: 0
    // });

    // pipe(
    //   hrun(
    //     [
    //       run(s => (s === "S1" ? "S2" : s === "S2" ? "S3" : "S1"), "S1"),
    //       run(s => (s === "F1" ? "F2" : "F1"), "F1")
    //     ],
    //     s => {
    //       if (s.p === "H1" && s.c === "S3")
    //         return { p: "H2", c: "F1", start: 1, stop: 0 };
    //       if (s.p === "H2" && s.c === "F2")
    //         return { p: "H1", c: "S1", start: 0, stop: 1 };
    //       else
    //         return {
    //           p: s.p,
    //           c: s.c
    //         };
    //     },
    //     { p: "H1", c: "S1", start: 0 }
    //   ),
    //   take(10),
    //   subscribe({
    //     next: d => actual.push(d),
    //     complete: () => {
    //       const expected = [
    //         { p: "H1", c: "S1" },
    //         { p: "H1", c: "S2" },
    //         { p: "H1", c: "S3" },
    //         { p: "H2", c: "F1" },
    //         { p: "H2", c: "F2" },
    //         { p: "H1", c: "S1" },
    //         { p: "H1", c: "S2" },
    //         { p: "H1", c: "S3" },
    //         { p: "H2", c: "F1" },
    //         { p: "H2", c: "F2" }
    //       ];
    //       expect(actual).toEqual(expected);
    //       done();
    //     }
    //   })
    // );
  });
});
