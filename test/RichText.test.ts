import * as PIXI from "pixi.js";
import RichText from "../src/RichText";

describe("RichText", () => {
  const style = {
    default: {
      fontSize: 10,
      fontFamily: "arial",
    },
    b: { fontWeight: "bold" },
    i: { fontStyle: "italic" },
  };

  const emptySpriteBounds = new PIXI.Rectangle(0, 0, 0, 0);
  const containerSpriteBounds = new PIXI.Rectangle(0, 0, 1, 1);

  describe("constructor", () => {
    it("Takes a string for the text content. Strings can be multi-line. Strings don't need to contain any tags to work.", () => {
      const t = new RichText("Hello,\nworld!");
      expect(t.text).toBe("Hello,\nworld!");
    });
    it("Takes an optional list of styles.", () => {
      const t = new RichText("Hello!", { b: { fontWeight: "700" } });
      expect(t.tagStyles).toHaveProperty("b");
    });

    describe("constructor takes a list of options.", () => {
      describe("debug", () => {
        const control = new RichText("Test <b>test</b>", style);
        const debug = new RichText("Test <b>test</b> test", style, {
          debug: true,
        });

        it("Should show debug information if you set debug to true. It should log debug info to console.", () => {
          expect(debug.debugContainer.children).toHaveLength(5);
          expect(debug.debugContainer.getBounds().width).toBeGreaterThan(100);
        });

        it("Should have debug set to false by default.", () => {
          expect(control.debugContainer.children).toHaveLength(0);
          expect(control.debugContainer.getBounds()).toMatchObject(
            emptySpriteBounds
          );
        });
      });

      describe("skipUpdates & skipDraw", () => {
        const text = "Test <b>test</b>";
        const control = new RichText(text, style);
        const skipUpdates = new RichText(text, style, {
          skipUpdates: true,
        });
        const skipDraw = new RichText(text, style, {
          skipDraw: true,
        });

        it("Should have the option to disable automatic calls to update().", () => {
          expect(skipUpdates.textContainer.children).toHaveLength(0);
          expect(skipUpdates.getBounds()).toMatchObject(containerSpriteBounds);
          skipUpdates.update();
          expect(skipUpdates.getBounds()).toMatchObject(control.getBounds());
          expect(skipUpdates.textFields).toHaveLength(2);
        });
        it("Should have the option to disable automatic calls to draw().", () => {
          expect(skipDraw.textContainer.children).toHaveLength(0);
          skipDraw.update();
          expect(skipDraw.textContainer.children).toHaveLength(0);
          skipDraw.draw();
          expect(skipDraw.tokens).toHaveLength(1);
          expect(skipDraw.tokens[0]).toHaveLength(2);
          expect(skipDraw.getBounds()).toMatchObject(control.getBounds());
        });
        it("Default should be to automatically call update.", () => {
          expect(control.textContainer.children).toHaveLength(2);
        });

        it("should allow you to force an update...", () => {
          expect(skipUpdates.textFields).toHaveLength(2);
          skipUpdates.setText("");
          expect(skipUpdates.textFields).toHaveLength(2);
          skipUpdates.setText("", false);
          expect(skipUpdates.textFields).toHaveLength(0);
        });
        it("...or draw...", () => {
          skipDraw.setText("");
          expect(skipDraw.textFields).toHaveLength(2);
          skipDraw.update(false);
          expect(skipDraw.textFields).toHaveLength(0);
        });
        it("...or force no update", () => {
          control.text = "";
          expect(control.textFields).toHaveLength(0);
          control.setText("abc def ghi", true);
          expect(control.textFields).toHaveLength(0);
          expect(control.tokens[0]).toHaveLength(0);
          control.update(true);
          expect(control.textFields).toHaveLength(0);
          expect(control.tokens[0]).toHaveLength(3);
          control.update(false);
          expect(control.textFields).toHaveLength(3);
        });

        describe("needsUpdate and needsDraw", () => {
          it("When your code skips an update, the needsUpdate flag will be set to true.", () => {
            const t = new RichText("test", style);
            expect(t.needsUpdate).toBeFalsy();
            t.setText("new!", true);
            expect(t.needsUpdate).toBeTruthy();
            t.update();
            expect(t.needsUpdate).toBeFalsy();
          });
          it("Setting text to the same value won't require an update.", () => {
            const t = new RichText("test", style);
            expect(t.needsUpdate).toBeFalsy();
            t.setText("test", true);
            expect(t.needsUpdate).toBeFalsy();
          });
          it("When your code skips a draw, the needsUpdate flag will be set to true.", () => {
            const t = new RichText("test", style);
            expect(t.needsDraw).toBeFalsy();
            t.update(true);
            expect(t.needsDraw).toBeTruthy();
            t.draw();
            expect(t.needsDraw).toBeFalsy();
          });
        });

        const REPS = 50;
        describe(`performace of skipping draw and updates. Updating string ${REPS} times.`, () => {
          // Performance
          const editText = (textField: RichText) => {
            textField.text = "";
            for (let i = 0; i < REPS; i++) {
              textField.text += `${i} `;
            }
          };

          const control = new RichText();
          const skipDraw = new RichText("", {}, { skipDraw: true });
          const skipUpdates = new RichText("", {}, { skipUpdates: true });

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

          it(`Default is slow AF! ${timeControl}ms`, () => {
            expect(timeControl).toBeGreaterThanOrEqual(500);
          });
          it(`skipDraw should be faster than default. ${timeSkipDraw}ms`, () => {
            expect(timeSkipDraw).toBeLessThan(timeControl);
          });
          it(`skipUpdates should be faster than control and skipDraw. ${timeSkipUpdates}ms < ${timeSkipDraw}ms < ${timeControl}ms`, () => {
            expect(timeSkipUpdates).toBeLessThan(timeControl);
            expect(timeSkipUpdates).toBeLessThan(timeSkipDraw);
          });
          it(`In fact, skipUpdates it's pretty fast! ${timeSkipUpdates}ms`, () => {
            expect(timeSkipUpdates).toBeLessThan(50);
          });

          console.log({ timeControl, timeSkipDraw, timeSkipUpdates });
        });
      });
    });
  });
  describe("text", () => {
    const singleLine = new RichText("Line 1", style);
    const doubleLine = new RichText(
      `Line 1
Line 2`,
      style
    );
    const tripleSpacedLines = new RichText("", style);

    describe("setText(), get text, & set text", () => {
      it("Implicit setter should set the text. Does not allow you to override the skipUpdate", () => {
        tripleSpacedLines.text = "temp";
        expect(tripleSpacedLines.text).toBe("temp");
      });
      it(`setText() sets the text and allows you to override the update.`, () => {
        tripleSpacedLines.setText(
          `<b>Line 1</b>


<b>Line 4</b>`,
          true
        );
        const heightBeforeUpdate = tripleSpacedLines.getBounds().height;
        tripleSpacedLines.update();
        const heightAfterUpdate = tripleSpacedLines.getBounds().height;
        expect(heightAfterUpdate).toBeGreaterThan(heightBeforeUpdate);
      });

      it("Implicit getter should return the text of the component with tags intact.", () => {
        expect(singleLine.text).toBe("Line 1");
        expect(tripleSpacedLines.text).toBe(`<b>Line 1</b>


<b>Line 4</b>`);
      });
    });

    // setText() is the same as text but allows you to skipUpdate.
    // text always uses default value for skipUpdate.

    describe("multiple lines", () => {
      it("Should support text with multiple lines.", () => {
        const H = singleLine.getBounds().height;
        const H2 = doubleLine.getBounds().height / H;
        const H3 = tripleSpacedLines.getBounds().height / H;

        expect(H).toBe(15);
        expect(H2).toBeCloseTo(2, 0);
        expect(H3).toBeCloseTo(3.5, 0);
      });
    });

    describe("untaggedText", () => {
      it("Returns the text with tags stripped out.", () => {
        const t = new RichText(
          "<b>Hello</b>... Is it <i>me</i> you're looking for?",
          { b: {}, i: {} }
        );
        expect(t).toHaveProperty(
          "untaggedText",
          "Hello... Is it me you're looking for?"
        );
      });
      it("Should present multiline text correctly.", () => {
        expect(tripleSpacedLines.untaggedText).toBe(`Line 1


Line 4`);
      });
    });
  });

  describe("styles", () => {
    const t = new RichText(`<b>Test</b>`, style);
    describe("getStyleForTag()", () => {
      it("Should return a style object for the tag.", () => {
        expect(t.getStyleForTag("b")).toHaveProperty("fontWeight", "bold");
      });
      it("Should return undefined when there is no tag defined.", () => {
        expect(t.getStyleForTag("bogus")).toBeUndefined();
      });
    });
    describe("removeStylesForTag()", () => {
      it("Should remove a style added to the text field.", () => {
        expect(t.getStyleForTag("b")).toBeDefined();
        t.removeStylesForTag("b");
        expect(t.getStyleForTag("b")).toBeUndefined();
      });
    });
  });

  describe("parsing", () => {
    it("Should allow nested self-closing tags.", () => {
      expect(() => {
        new RichText(`<b>Nested <i /> self-closing tag</b>`, style);
      }).not.toThrow();
    });
  });

  describe("update()", () => {
    const t = new RichText(`<b>Test</b>`, style);
    it("Should render the text as pixi text elements.", () => {
      const tokens = t.update();
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toHaveLength(1);
      expect(tokens[0][0].text).toBe("Test");
      expect(tokens[0][0].tags).toHaveLength(1);
      expect(tokens[0][0].tags[0]).toHaveProperty("tagName", "b");
    });
  });
});
