export const normalize = (s = "") =>
  String(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.\-가-힣]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

export default function slugify(text = "") {
  return normalize(text);
}
