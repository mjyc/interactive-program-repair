const { pipe, take } = require("callbag-basics");
const { run, subscribe } = require("./fsm");

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
