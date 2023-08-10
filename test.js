const fs = require("fs");
const rtfToHTML = require("./index.js");

// fs.createReadStream("example.rtf").pipe(
//   rtfToHTML((err, html) => {
//     // …
//   })
// );
rtfToHTML.fromStream(fs.createReadStream("test.rtf"), (err, html) => {
  console.log(html);
});
// rtfToHTML.fromString(
//   "{\rtf1{\field{\*\fldinst{HYPERLINK "www.hi.me/"}}{\fldrslt oral arguments}}}",
//   (err, html) => {
//     console.log(html);
//     // prints a document containing:
//     // <p><strong>hi there</strong></p>
//   }
// );
