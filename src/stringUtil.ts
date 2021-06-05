// modified from: https://github.com/h26k2/capitalize-text/blob/master/index.js
export const capitalize = (str: string): string => {
  const chars = str.split(" ");
  let converted = ``;

  for (let i = 0; i < chars.length; i++) {
    converted += `${chars[i].charAt(0).toUpperCase()}${chars[i].substr(1)} `;
  }

  return converted.trim();
};
