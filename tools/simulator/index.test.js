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
});
