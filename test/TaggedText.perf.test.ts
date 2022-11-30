import TaggedText from "../src/TaggedText";

describe("TaggedText - performance", () => {
  describe("skipUpdates & skipDraw", () => {
    const REPS = 50;
    describe(`performace of skipping draw and updates. Updating string ${REPS} times.`, () => {
      // Performance
      const editText = (textField: TaggedText) => {
        textField.text = "";
        for (let i = 0; i < REPS; i++) {
          textField.text += `${i} `;
        }
      };

      const control = new TaggedText();
      const skipDraw = new TaggedText("", {}, { skipDraw: true });
      const skipUpdates = new TaggedText("", {}, { skipUpdates: true });

      let startTime = new Date().getTime();
      editText(control);
      let endTime = new Date().getTime();
      const timeControl = endTime - startTime;

      startTime = new Date().getTime();
      editText(skipDraw);
      skipDraw.draw();
      endTime = new Date().getTime();
      const timeSkipDraw = endTime - startTime;

      startTime = new Date().getTime();
      editText(skipUpdates);
      skipUpdates.update();
      endTime = new Date().getTime();
      const timeSkipUpdates = endTime - startTime;

      // Skipping since actual results will vary.
      // it(`Default is slow AF! ${timeControl}ms`, () => {
      //   expect(timeControl).toBeGreaterThanOrEqual(500);
      // });
      it(`skipDraw should be faster than default. ${timeSkipDraw}ms`, () => {
        expect(timeSkipDraw).toBeLessThan(timeControl);
      });
      it(`skipUpdates should be faster than control and skipDraw. ${timeSkipUpdates}ms < ${timeSkipDraw}ms < ${timeControl}ms`, () => {
        expect(timeSkipUpdates).toBeLessThan(timeControl);
        expect(timeSkipUpdates).toBeLessThan(timeSkipDraw);
      });
      // Skipping since actual results will vary.
      // it(`In fact, skipUpdates it's pretty fast! ${timeSkipUpdates}ms`, () => {
      //   expect(timeSkipUpdates).toBeLessThan(50);
      // });

      console.log({ timeControl, timeSkipDraw, timeSkipUpdates });
    });
  });
});
