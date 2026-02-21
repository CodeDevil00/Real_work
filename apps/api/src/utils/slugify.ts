// module.exports = function slugify(text) {
//     return text
//         .toString()
//         .toLowerCase()
//         .trim()
//         .replace(/\s+/g, "-") // Replace spaces with -
//         .replace(/[^\w\-]+/g, "") // Remove all non-word chars
//         .replace(/\-\-+/g, "-"); // Replace multiple - with single -
// };

export default function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}