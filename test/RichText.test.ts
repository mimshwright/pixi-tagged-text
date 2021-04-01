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

      describe("skipUpdates", () => {
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
    const tripleSpacedLines = new RichText(
      `<b>Line 1</b>


<b>Line 4</b>`,
      style
    );

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
