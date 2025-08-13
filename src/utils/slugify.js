export default function slugify(text = "") {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[^\w\s-]/g, "")        // non-word
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}
