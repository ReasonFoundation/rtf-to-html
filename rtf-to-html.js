"use strict";

const { RTFA } = require("@reason-dev/rtf-parser/rtf-interpreter");
const RTFParagraph = require("rtf-parser/rtf-paragraph");
const RTFSpan = require("rtf-parser/rtf-span");

module.exports = rtfToHTML;

function outputTemplate(doc, defaults, content) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
    body {
      margin-left: ${doc.marginLeft / 20}pt;
      margin-right: ${doc.marginRight / 20}pt;
      margin-top: ${doc.marginTop / 20}pt;
      margin-bottom: ${doc.marginBottom / 20}pt;
      font-size: ${defaults.fontSize / 2}pt;
      text-indent: ${defaults.firstLineIndent / 20}pt;
    }
    </style>
  </head>
  <body>
    ${content.replace(/\n/, "\n    ")}
  </body>
</html>
`;
}

function rtfToHTML(doc, options) {
  // console.log("BEFORE: ", JSON.stringify(doc));
  const defaults = Object.assign(
    {
      font: doc.style.font || { name: "Times", family: "roman" },
      fontSize: doc.style.fontSize || 24,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      foreground: { red: 0, blue: 0, green: 0 },
      background: { red: 255, blue: 255, green: 255 },
      firstLineIndent: doc.style.firstLineIndent || 0,
      indent: 0,
      align: "left",
      valign: "normal",

      paraBreaks: "\n\n",
      paraTag: "p",
      template: outputTemplate,
    },
    options || {}
  );
  const content = doc.content
    .map((el) => {
      // console.log("ELEMENT :", el);
      const isP = el instanceof RTFParagraph;
      const type = typeof el;
      if (el.constructor.name === "RTFParagraph") {
        return renderPara(el ? el : { content: [para], style: {} }, defaults);
      } else if (el.constructor.name === "RTFA") {
        if (el.content && el.content.length > 0) {
          console.log("THIS LINK HAS CONTENT");
        } else {
          return renderA(el, defaults);
        }
      } else if (el.constructor.name === "RTFSpan") {
        console.log("SPAN");
        if (el.content.length && el.content.length > 0) {
          console.log("THIS SPAN HAS CONTENT");
        }
        return renderSpan(el, defaults);
      } else {
        console.log("ELSE: ", el);
      }

      // return el.href
      //   ? renderA(el.content ? el : { content: [el], style: {} }, defaults)
      //   : renderPara(
      //       el.content ? el : { content: [para], style: {} },
      //       defaults
      //     );
    })
    .filter((html) => {
      console.log("HTML: ", html);
      return html != null;
    })
    .join(defaults.paraBreaks);
  return defaults.template(doc, defaults, content);
}

function font(ft) {
  const name = ft.name.replace(/-\w+$/, "");
  const family = genericFontMap[ft.family];
  if (name === "ZapfDingbatsITC") return "";
  return "font-family: " + name + (family ? `, ${family}` : "");
}

const genericFontMap = {
  roman: "serif",
  swiss: "sans-serif",
  script: "cursive",
  decor: "fantasy",
  modern: "sans-serif",
  tech: "monospace",
  bidi: "serif",
};

function colorEq(aa, bb) {
  return aa.red === bb.red && aa.blue === bb.blue && aa.green === bb.green;
}

function CSS(chunk, defaults) {
  let css = "";
  if (
    chunk.style.foreground != null &&
    !colorEq(chunk.style.foreground, defaults.foreground)
  ) {
    css += `color: rgb(${chunk.style.foreground.red}, ${chunk.style.foreground.green}, ${chunk.style.foreground.blue});`;
  }
  if (
    chunk.style.background != null &&
    !colorEq(chunk.style.background, defaults.background)
  ) {
    css += `background-color: rgb(${chunk.style.background.red}, ${chunk.style.background.green}, ${chunk.style.background.blue});`;
  }
  if (
    chunk.style.firstLineIndent != null &&
    chunk.style.firstLineIndent > 0 &&
    chunk.style.firstLineIndent !== defaults.firstLineIndent
  ) {
    css += `text-indent: ${chunk.style.firstLineIndent / 20}pt;`;
  }
  if (chunk.style.indent != null && chunk.style.indent !== defaults.indent) {
    css += `padding-left: ${chunk.style.indent / 20}pt;`;
  }
  if (chunk.style.align != null && chunk.style.align !== defaults.align) {
    css += `text-align: ${chunk.style.align};`;
  }
  if (
    chunk.style.fontSize != null &&
    chunk.style.fontSize !== defaults.fontSize
  ) {
    css += `font-size: ${chunk.style.fontSize / 2}pt;`;
  }
  if (
    !defaults.disableFonts &&
    chunk.style.font != null &&
    chunk.style.font.name !== defaults.font.name
  ) {
    css += font(chunk.style.font);
  }
  return css;
}

function styleTags(chunk, defaults) {
  let open = "";
  let close = "";
  if (chunk.style.italic != null && chunk.style.italic !== defaults.italic) {
    open += "<em>";
    close = "</em>" + close;
  }
  if (chunk.style.bold != null && chunk.style.bold !== defaults.bold) {
    open += "<strong>";
    close = "</strong>" + close;
  }
  if (
    chunk.style.strikethrough != null &&
    chunk.style.strikethrough !== defaults.strikethrough
  ) {
    open += "<s>";
    close = "</s>" + close;
  }
  if (
    chunk.style.underline != null &&
    chunk.style.underline !== defaults.underline
  ) {
    open += "<u>";
    close = "</u>" + close;
  }
  if (chunk.style.valign != null && chunk.style.valign !== defaults.valign) {
    if (chunk.style.valign === "super") {
      open += "<sup>";
      close = "</sup>" + close;
    } else if (chunk.style.valign === "sub") {
      open += "<sup>";
      close = "</sup>" + close;
    }
  }
  return { open, close };
}

function renderPara(para, defaults) {
  if (!para.content || para.content.length === 0) return;
  const style = CSS(para, defaults);
  const tags = styleTags(para, defaults);
  const pdefaults = Object.assign({}, defaults);
  for (let item of Object.keys(para.style)) {
    if (para.style[item] != null) pdefaults[item] = para.style[item];
  }
  const paraTag = defaults.paraTag;
  return `<${paraTag}${style ? ' style="' + style + '"' : ""}>${
    tags.open
  }${para.content
    .map((el) => (el.href ? renderA(el, pdefaults) : renderSpan(el, pdefaults)))
    .join("")}${tags.close}</${paraTag}>`;
}
// function renderA(para, defaults) {
//   console.log("para: ", para);
//   if (!para.content || para.content.length === 0) return;
//   const style = CSS(para, defaults);
//   const tags = styleTags(para, defaults);
//   const pdefaults = Object.assign({}, defaults);
//   for (let item of Object.keys(para.style)) {
//     if (para.style[item] != null) pdefaults[item] = para.style[item];
//   }
//   const elTag =
//     typeof para.content[0].href !== "undefined" ? "a" : defaults.paraTag;
//   // console.log("PARATAG: ", paraTag);
//   const outputElement = `<${elTag} href=${para.content[0].href} ${
//     style ? ' style="' + style + '"' : ""
//   }>${tags.open}${
//     para.content.length === 1
//       ? para.content[0].value
//       : para.content
//           .map((el) =>
//             el.href ? renderA(el, pdefaults) : renderSpan(el, pdefaults)
//           )
//           .join("")
//   }${tags.close}</${elTag}>`;

//   return outputElement;
// }
function renderA(para, defaults) {
  console.log("para: ", para);
  const el = para.content ? para.content[0] : para;
  // if (!para.content || para.content.length === 0) return;
  const style = CSS(el, defaults);
  const tags = styleTags(para, defaults);
  const pdefaults = Object.assign({}, defaults);
  for (let item of Object.keys(para.style)) {
    if (para.style[item] != null) pdefaults[item] = para.style[item];
  }
  const elTag = el.href ? "a" : defaults.paraTag;
  // console.log("PARATAG: ", paraTag);
  // for (let el of para.content) {
  //   const outputElement = `<${elTag} href=${el.href} ${
  //     style ? ' style="' + style + '"' : ""
  //   }>${el.value}</${elTag}>`;
  // }
  const outputElement = `<${elTag} href=${el.href} ${
    style ? ` style="${style} "` : ""
  }>${tags.open}${el.value}${tags.close}</${elTag}>`;

  return outputElement;
}

function renderSpan(span, defaults) {
  console.log("SPAN VALUE: ", value);
  const style = CSS(span, defaults);
  const tags = styleTags(span, defaults);
  const value = `${tags.open}${span.value}${tags.close}`;
  if (style) {
    return `<span style="${style}">${value}</span>`;
  } else {
    return value;
  }
}
// function renderA(span, defaults) {
//   const style = CSS(span, defaults);
//   const tags = styleTags(span, defaults);
//   const value = `${tags.open}${span.value}${tags.close}`;
//   if (style) {
//     return `<a style="${style}">${value}</a>`;
//   } else {
//     return value;
//   }
// }
