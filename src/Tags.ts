export const TagStyle = {
  bbcode: "bbcode",
  xml: "xml",
};

export const TagBrackets = {
  bbcode: ["[", "]"],
  xml: ["<", ">"],
};

export const propertyRegex = new RegExp(
  `([A-Za-z0-9_\\-]+)=(?:"((?:[^"]+|\\\\")*)"|'((?:[^']+|\\\\')*)')`,
  "g"
);

export const bbcodePropertyRegex = new RegExp(
  `[A-Za-z0-9_\\-]+=([A-Za-z0-9_\\-\\#]+)`,
  "g"
);
