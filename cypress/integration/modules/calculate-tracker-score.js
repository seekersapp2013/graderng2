import Tracker from "../../../src/modules/tracker/tracker";
import calcTrackerScore from "../../../src/modules/scoring/score-tracker";

const mood = new Tracker({
  tag: "mood",
  type: "range",
  color: "#369DD3",
  math: "mean",
  ignore_zeros: false,
  uom: "num",
  emoji: "😉",
  default: "3",
  max: "10",
  min: "1",
  score: "custom",
  score_calc: [
    {
      if: "value",
      is: "gt",
      v: "5",
      sc: "1",
    },
    {
      if: "value",
      is: "lt",
      v: "5",
      sc: "-1",
    },
  ],
  goal: null,
  one_tap: false,
  label: "Mood",
});

describe("Calculate Tracker Score", () => {
  it("should calculate a dynamic score", () => {
    let score = calcTrackerScore(6, mood);
    expect(score).to.equal(1);
  });
});
