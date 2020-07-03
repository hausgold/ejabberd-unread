const format = require('xml-formatter');
const hljs = require('highlight.js');
const h2c = require('./hljs-console');

module.exports = (xml, indentation = '') => {
  let formatted = format(xml, { indentation: '  ' });
  let level = 0;

  // Break all attributes on a new line
  formatted = formatted.replace(/(=['"][^'"]+)(['"])/g, "$1$2\n");

  // Fix the attribute indentation level
  formatted = formatted.split("\n").map((line, idx) => {
    // Tag line
    if (/^\s*</.test(line)) {
      let indent = line.match(/^(\s*)[^\s]/)[1];
      level = line.trim().indexOf(' ');
      level += indent.length;
      if (level !== 0) { level += 2; }
    // Attribute line
    } else if (/\S=['"]/.test(line)) {
      let pad = Array(level).join(' ');
      line = pad + line.trim();
    }

    return line;
  }).join("\n");

  // Correct possition of ending tags (>, />)
  formatted = formatted.replace(/(['"])\s*>/g, '$1>');
  formatted = formatted.replace(/(['"])\s*\/>/g, '$1/>');
  formatted = formatted.replace(/\/>/g, ' />');

  // Highlight the formatted XML
  let highlighted = hljs.highlightAuto(formatted, ['xml']);

  // Good styles: androidstudio hybrid obsidian solarized-dark
  highlighted = h2c.convert(highlighted.value, 'androidstudio');

  return highlighted.split("\n").map((line, idx) => {
    return indentation + line;
  }).join("\n");
};
