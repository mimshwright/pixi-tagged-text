import RichText from "../src/RichText";

describe("RichText", () => {
  describe("constructor", () => {
    it("Takes a string for the text content. Strings can be multi-line. Strings don't need to contain any tags to work.", () => {
      const t = new RichText("Hello,\nworld!");
      expect(t.text).toBe("Hello,\nworld!");
    });
    it("Takes an optional list of styles.", () => {
      const t = new RichText("Hello!", { b: { fontWeight: "700" } });
      expect(t.tagStyles).toHaveProperty("b");
    });
  });

  describe("untaggedText", () => {
    it("Returns the text with tags stripped out.", () => {
      const t = new RichText(
        "<b>Hello</b>. Is it <i>me</i> you're looking for?",
        { b: {}, i: {} }
      );
      expect(t).toHaveProperty(
        "untaggedText",
        "Hello. Is it me you're looking for?"
      );
    });
  });

  describe("styles", () => {
    const t = new RichText(`<b>Test</b>`, {
      default: { fontSize: 333 },
      b: { fontWeight: "bold" },
      i: { fontStyle: "italic" },
    });
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
        new RichText(`<b>Nested <i /> self-closing tag</b>`, {
          b: { fontWeight: "bold" },
          i: { fontStyle: "italic" },
        });
      }).not.toThrow();
    });
  });
});
