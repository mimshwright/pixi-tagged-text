import * as tags from "../src/tags";
import { LINE_BREAK_TAG_NAME } from "../src/types";

describe("tags module", () => {
  describe("replaceSelfClosingTags()", () => {
    let input, expected, actual;
    it("should replace any tags that close themselves with an empty pair of tags.", () => {
      input = "a <b/> c";
      expected = "a <b></b> c";
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });
    it("should keep attributes.", () => {
      input = `a <b attribute="value"    /> c`;
      expected = `a <b attribute="value"></b> c`;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);

      input = `a <b c="d"
      e="f"
      g="hijk1235"
      l="" /> m`;
      expected = `a <b c="d" e="f" g="hijk1235" l=""></b> m`;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });

    it("should work when there are self-closing tags inside a non-self-closing tag.", () => {
      input = `<foo>123 <bar attribute="value"/> 456</foo>`;
      expected = `<foo>123 <bar attribute="value"></bar> 456</foo>`;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);

      input = `<a>123 <c/> <b attribute="value">456 <c/> 789</b>abc</a> def`;
      expected = `<a>123 <c></c> <b attribute="value">456 <c></c> 789</b>abc</a> def`;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });

    it("should work when there are multple self-closing tags in the string.", () => {
      input = `<a/> <b attribute="value"/> <c
/>`;
      expected = `<a></a> <b attribute="value"></b> <c></c>`;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });

    it("should ignore normal tags", () => {
      input = `a <b>b</b> c`;
      expected = input;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);

      input = `<foo bar="baz">lorem ipsum</foo> <bar>baz</bar>`;
      expected = input;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });

    it("should ignore unclosed tags and partial pieces of self closing tags.", () => {
      input = `a <b> c`;
      expected = input;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);

      input = `a /> <b`;
      expected = input;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });
    it("Allows numbers in tags but not for the first character.", () => {
      input = `<a1/>`;
      expected = `<a1></a1>`;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);

      input = `<1a/>`;
      expected = input;
      actual = tags.replaceSelfClosingTags(input);
      expect(actual).toEqual(expected);
    });
  });

  describe("replaceLineBreaks()", () => {
    it("should replace line breaks in multi-line text with tags.", () => {
      const BR = LINE_BREAK_TAG_NAME;
      const s = tags.replaceLineBreaks(`Multi-\nline\nTEXT!`);
      expect(s).toEqual(`Multi-<${BR}></${BR}>line<${BR}></${BR}>TEXT!`);
    });
  });

  /*
  describe("Token identifier functions", () => {
    describe("isTextToken()", () => {
      it("Should return true if the token is text.", () => {
        expect(tags.isTextToken("Foo")).toBeTruthy();
        expect(tags.isTextToken(" ")).toBeTruthy();
        expect(tags.isTextToken("\n")).toBeTruthy();
        expect(tags.isTextToken("👍")).toBeTruthy();
        expect(tags.isTextToken("Hello, world!")).toBeTruthy();
        expect(tags.isTextToken("")).toBeTruthy();
      });
      it("Should return false if the token is not.", () => {
        expect(
          tags.isTextToken({ tag: "b", children: ["a", "b", "c"] })
        ).toBeFalsy();
      });
    });
    describe("isNewlineToken()", () => {
      it("Should return true if the token is a newline.", () => {
        expect(tags.isNewlineToken("\n")).toBeTruthy();
      });
      it("Should return false if the token is not.", () => {
        expect(tags.isNewlineToken("")).toBeFalsy();
        expect(tags.isNewlineToken("F")).toBeFalsy();
        expect(tags.isNewlineToken("   \n")).toBeFalsy();
        expect(tags.isNewlineToken("\n\n")).toBeFalsy();
        expect(tags.isNewlineToken({ tag: "b", children: ["\n"] })).toBeFalsy();
      });
    });
    describe("isCompositeToken()", () => {
      it("Should return true if the token is a group of child tokens.", () => {
        expect(
          tags.isCompositeToken({ children: ["a", "b", "c"] })
        ).toBeTruthy();
        expect(tags.isCompositeToken({ children: [""] })).toBeTruthy();
        expect(
          tags.isCompositeToken({ tag: "b", children: ["a"] })
        ).toBeTruthy();
        expect(
          tags.isCompositeToken({
            tag: "b",
            children: [{ children: ["a", "b", { tag: "i", children: ["c"] }] }],
          })
        ).toBeTruthy();
      });
      it("Should return false if the token is not.", () => {
        expect(tags.isCompositeToken("")).toBeFalsy();
        expect(tags.isCompositeToken("F")).toBeFalsy();
        expect(tags.isCompositeToken("\n")).toBeFalsy();
      });
    });
  });
*/

  describe("parseAttributes()", () => {
    it("Extracts keys and values from an HTML-ish attribute string.", () => {
      expect(tags.parseAttributes("foo='bar'")).toMatchObject({ foo: "bar" });
    });
    it("Doesn't care about whitespace between well formed attributes.", () => {
      expect(tags.parseAttributes("foo='bar'     bar='baz'")).toMatchObject({
        foo: "bar",
        bar: "baz",
      });
    });
    it("Can't handle whitespace near the =.", () => {
      expect(() => tags.parseAttributes("foo   = 'bar  '")).toThrow();
    });
    it("Matches single and double quotes but not ticks.", () => {
      expect(tags.parseAttributes(`foo="bar" bar='baz'`)).toMatchObject({
        foo: "bar",
        bar: "baz",
      });
      expect(tags.parseAttributes("foo=`bar`")).toMatchObject({});
    });
    it.skip("Shouldn't handle mixed up quotes.", () => {
      expect(tags.parseAttributes(`foo='bar" bar="baz'`)).toMatchObject({
        foo: `bar" bar="baz`,
      });
    });
    it("Should return empty object for an empty string.", () => {
      expect(tags.parseAttributes("")).toMatchObject({});
    });
  });

  describe("parseTagsNew()", () => {
    describe("Simple", () => {
      it("Should parse simple text.", () => {
        expect(tags.parseTagsNew("Hello")).toMatchObject({
          children: ["Hello"],
        });

        expect(tags.parseTagsNew("Hello, World!")).toMatchObject({
          children: ["Hello, World!"],
        });
      });
      it("Should keep newlines.", () => {
        expect(tags.parseTagsNew("Hello\nWorld\n\n!")).toMatchObject({
          children: ["Hello\nWorld\n\n!"],
        });
      });

      it("Should handle a single tag that surrounds everything.", () => {
        expect(tags.parseTagsNew("<a>b</a>", ["a"])).toMatchObject({
          children: [{ tag: "a", children: ["b"] }],
        });
      });

      it("Should handle a single tag in the middle of the text.", () => {
        expect(tags.parseTagsNew("a <b>c</b> d", ["b"])).toMatchObject({
          children: [
            "a ",
            {
              tag: "b",
              children: ["c"],
            },
            " d",
          ],
        });
      });
      it("Should handle multiple tags.", () => {
        expect(
          tags.parseTagsNew("<A>A</A> <B>B</B>", ["A", "B"])
        ).toMatchObject({
          children: [
            {
              tag: "A",
              children: ["A"],
            },
            " ",
            {
              tag: "B",
              children: ["B"],
            },
          ],
        });
      });
    });

    describe("Nested", () => {
      it("Should handle nested tags.", () => {
        expect(
          tags.parseTagsNew("<a><b><c><d>e</d></c></b></a>", [
            "a",
            "b",
            "c",
            "d",
          ])
        ).toMatchObject({
          children: [
            {
              tag: "a",
              children: [
                {
                  tag: "b",
                  children: [
                    { tag: "c", children: [{ tag: "d", children: ["e"] }] },
                  ],
                },
              ],
            },
          ],
        });

        expect(
          tags.parseTagsNew("<a><b>c</b><d>e</d></a>", ["a", "b", "d"])
        ).toMatchObject({
          children: [
            {
              tag: "a",
              children: [
                { tag: "b", children: ["c"] },
                { tag: "d", children: ["e"] },
              ],
            },
          ],
        });

        expect(
          tags.parseTagsNew("a <b>c <d>e</d> c</b> a", ["b", "d"])
        ).toMatchObject({
          children: [
            "a ",
            {
              tag: "b",
              children: ["c ", { tag: "d", children: ["e"] }, " c"],
            },
            " a",
          ],
        });
      });
    });
    describe("Self-closing tags", () => {
      it("Should handle self-closing tags.", () => {
        expect(tags.parseTagsNew("a <b /> c", ["b"])).toMatchObject({
          children: [
            "a ",
            {
              tag: "b",
              children: [],
            },
            " c",
          ],
        });
        expect(tags.parseTagsNew("a<b>c<d/></b>", ["b", "d"])).toMatchObject({
          children: [
            "a",
            {
              tag: "b",
              children: ["c", { tag: "d", children: [] }],
            },
          ],
        });
        expect(
          tags.parseTagsNew(
            "1<a>11 22\n3</a>33 444 <a>55<b>55\n6</b>6</a> 77",
            ["a", "b"]
          )
        ).toMatchObject({
          children: [
            "1",
            {
              tag: "a",
              children: ["11 22\n3"],
            },
            "33 444 ",
            {
              tag: "a",
              children: ["55", { tag: "b", children: ["55\n6"] }, "6"],
            },
            " 77",
          ],
        });
      });
    });

    describe("Attributes", () => {
      it("Should parse attributes correctly.", () => {
        expect(tags.parseTagsNew("<a c='d'>b</a>", ["a"])).toMatchObject({
          children: [
            {
              tag: "a",
              children: ["b"],
              attributes: {
                c: "d",
              },
            },
          ],
        });
        expect(tags.parseTagsNew("<a c='d' e='f'>b</a>", ["a"])).toMatchObject({
          children: [
            {
              tag: "a",
              children: ["b"],
              attributes: {
                c: "d",
                e: "f",
              },
            },
          ],
        });
        expect(() => tags.parseTagsNew("<a c=>b</a>", ["a"])).toThrow();
      });
    });

    describe("Edge Cases", () => {
      it("Should allow multiple nested tags of the same type.", () => {
        expect(
          tags.parseTagsNew("<A><A><A>A</A></A></A>", ["A"])
        ).toMatchObject({
          children: [
            {
              tag: "A",
              children: [
                {
                  tag: "A",
                  children: [
                    {
                      tag: "A",
                      children: ["A"],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it("Should ignore tags not mentioned in the tag list.", () => {
        expect(tags.parseTagsNew("<A>A</A> <B>B</B>", ["A"])).toMatchObject({
          children: [
            {
              tag: "A",
              children: ["A"],
            },
            " <B>B</B>",
          ],
        });
      });
      it("Should allow tags that start with numbers or non alphabet glyphs as long as they're passed in a tagNames.", () => {
        expect(tags.parseTagsNew("<1>2</1>", ["1"])).toMatchObject({
          children: [{ tag: "1", children: ["2"] }],
        });
        expect(tags.parseTagsNew("<🔥>😎</🔥>", ["🔥"])).toMatchObject({
          children: [{ tag: "🔥", children: ["😎"] }],
        });
      });
      it("Should throw when there are badly formed tags", () => {
        expect(() => {
          tags.parseTagsNew("<a></b>", ["a", "b"]);
        }).toThrow();
      });
    });
  });

  describe("createToken()", () => {
    it("should create a new Token (partial)", () => {
      expect(
        tags.createToken("Hello", [
          { tagName: "b", attributes: { fontWeight: "700" } },
        ])
      ).toMatchObject({
        text: "Hello",
        tags: [{ tagName: "b", attributes: { fontWeight: "700" } }],
      });
    });
    it("should provide empty string and empty array as default values", () => {
      expect(tags.createToken()).toMatchObject({
        text: "",
        tags: [],
      });
    });
  });
});
