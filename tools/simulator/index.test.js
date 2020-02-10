const { forEach, interval, pipe, take } = require("callbag-basics");
const sample = require("callbag-sample");
const { fsm } = require("./index");

describe("fsm", () => {
  test("#0", done => {
    const actual = [];
    pipe(
      fsm(s => (s === "S1" ? "S2" : s === "S2" ? "S3" : "S1"), "S1"),
      take(10),
      fsm => {
        let talkback;
        fsm(0, (t, d) => {
          if (t === 0) talkback = d;
          if (t === 1) {
            actual.push(d);
          }
          if (t === 2) {
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
          if (t === 0) talkback(1);
        });
      }
    );
  });
});
