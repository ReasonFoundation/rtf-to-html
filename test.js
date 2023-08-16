const fs = require("fs");
const rtfToHTML = require("./index.js");
const inputFile = "test.rtf";
const outputFile = "output.html";
// fs.createReadStream("example.rtf").pipe(
//   rtfToHTML((err, html) => {
//     // …
//   })
// );
rtfToHTML.fromStream(fs.createReadStream(inputFile), (err, html) => {
  console.log("FINAL OUTPUT: ", html);
  fs.writeFileSync(outputFile, html);
});
// rtfToHTML.fromString(
//   "{\rtf1{\field{\*\fldinst{HYPERLINK "www.hi.me/"}}{\fldrslt oral arguments}}}",
//   (err, html) => {
//     console.log(html);
//     // prints a document containing:
//     // <p><strong>hi there</strong></p>
//   }
// );
