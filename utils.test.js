const {
  checkComputeOverlapInputs,
  discretizeTrace,
  computeOverlap
} = require("./utils");

describe("checkComputeOverlapInputs", () => {
  describe("throws error if t1.length < 2 || t2.length < 1:", () => {
    const t1s = [
      [],
      [
        {
          stamp: 0,
          value: true
        }
      ],
      [
        {
          stamp: 0,
          value: true
        },
        {
          stamp: 100,
          value: true
        }
      ]
    ];
    const t2s = [
      [],
      [
        {
          stamp: 0,
          value: true
        }
      ]
    ];
    for (let i = 0; i < t1s.length; i++) {
      for (let j = 0; j < t2s.length - 1; j++) {
        it(`t1.length=${t1s[i].length} t2.length=${t2s[j].length}`, () => {
          expect(() => checkComputeOverlapInputs(t1s[i], t2s[j])).toThrow(
            "t1.length < 2 || t2.length < 1"
          );
        });
      }
    }
  });

  it("throws error if t1[0].stamp !== t2[0].stamp", () => {
    expect(() =>
      checkComputeOverlapInputs(
        [{ stamp: 0, value: true }, { stamp: 100, value: true }],
        [{ stamp: 100, value: true }]
      )
    ).toThrow("t1[0].stamp !== t2[0].stamp");
    expect(() =>
      checkComputeOverlapInputs(
        [{ stamp: 50, value: true }, { stamp: 100, value: true }],
        [{ stamp: 0, value: true }]
      )
    ).toThrow("t1[0].stamp !== t2[0].stamp");
  });

  it("throws error if t1[t1.length-1].stamp < t2[t2.length-1].stamp", () => {
    expect(() =>
      checkComputeOverlapInputs(
        [{ stamp: 0, value: true }, { stamp: 50, value: true }],
        [{ stamp: 0, value: true }, { stamp: 100, value: true }]
      )
    ).toThrow("t1[t1.length-1].stamp < t2[t2.length-1].stamp");
  });
});

describe("discretizeTrace", () => {
  it("discretizes traces #1", () => {
    const trace = [
      { stamp: 0, value: "a" },
      { stamp: 3, value: "b" },
      { stamp: 6, value: "c" },
      { stamp: 9, value: "d" },
      { stamp: 12, value: "e" },
      { stamp: 15, value: "f" }
    ];
    const interval = 5;
    expect(discretizeTrace(trace, interval)).toEqual([
      { stamp: 0, value: "a" },
      { stamp: 5, value: "c" },
      { stamp: 10, value: "e" }
      // { stamp: 15, value: "f" } // ignores the last event!
    ]);
  });

  it("discretizes traces #2", () => {
    const trace = [
      { stamp: 0, value: "a" },
      { stamp: 3, value: "b" },
      { stamp: 6, value: "c" }
    ];
    const interval = 1;
    expect(discretizeTrace(trace, interval)).toEqual([
      { stamp: 0, value: "a" },
      { stamp: 1, value: "a" },
      { stamp: 2, value: "a" },
      { stamp: 3, value: "b" },
      { stamp: 4, value: "b" },
      { stamp: 5, value: "b" }
      // { stamp: 6, value: "c" } // ignores the last event!
    ]);
  });
});

describe("computeOverlap", () => {
  describe("computes overlaps correctly:", () => {
    const ts = [
      {
        1: [
          {
            stamp: 0,
            value: false
          },
          {
            stamp: 100,
            value: false
          }
        ],
        2: [
          {
            stamp: 0,
            value: false
          }
        ]
      },
      {
        1: [
          {
            stamp: 0,
            value: false
          },
          {
            stamp: 100,
            value: false
          }
        ],
        2: [
          {
            stamp: 0,
            value: true
          }
        ]
      },
      {
        1: [
          {
            stamp: 0,
            value: false
          },
          {
            stamp: 50,
            value: true
          },
          {
            stamp: 100,
            value: true
          }
        ],
        2: [
          {
            stamp: 0,
            value: false
          }
        ]
      },
      {
        1: [
          {
            stamp: 0,
            value: false
          },
          {
            stamp: 100,
            value: false
          }
        ],
        2: [
          {
            stamp: 0,
            value: false
          },
          {
            stamp: 50,
            value: true
          }
        ]
      },
      {
        1: [
          {
            stamp: 0,
            value: true
          },
          {
            stamp: 50,
            value: false
          },
          {
            stamp: 100,
            value: false
          }
        ],
        2: [
          {
            stamp: 0,
            value: false
          }
        ]
      },
      {
        1: [
          {
            stamp: 0,
            value: true
          },
          {
            stamp: 100,
            value: true
          }
        ],
        2: [
          {
            stamp: 0,
            value: true
          },
          {
            stamp: 50,
            value: false
          }
        ]
      }
    ];
    const expectets = [1, 0, 0.5, 0.5, 0.5, 0.5];
    for (let i = 0; i < ts.length; i++) {
      it(`#${i}`, () => {
        expect(computeOverlap(ts[i][1], ts[i][2])).toBe(expectets[i]);
      });
    }
  });
});
