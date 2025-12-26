export function insertEllipsis(str, startSlice = 4, endSlice = 3, stripHexPrefix = false) {
  if (!str) {
    return '';
  }

  let strToAbbrv = str;

  if (stripHexPrefix) {
    strToAbbrv = strToAbbrv.replace('0x', '');
  }

  if (str.length <= 7) {
    return str; // No need to shorten
  }

  const start = strToAbbrv.slice(0, startSlice);
  const end = strToAbbrv.slice(-1 * endSlice);

  return `${start}...${end}`;
}
