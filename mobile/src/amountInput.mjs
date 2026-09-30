const NUMBER_FORMATTER = new Intl.NumberFormat(undefined, { useGrouping: true, maximumFractionDigits: 2 });
const NUMBER_PARTS = NUMBER_FORMATTER.formatToParts(12345.6);
const NUMBER_GROUP = NUMBER_PARTS.find((part) => part.type === "group")?.value || ",";
const NUMBER_DECIMAL = NUMBER_PARTS.find((part) => part.type === "decimal")?.value || ".";
export const AMOUNT_DECIMAL_SEPARATOR = NUMBER_DECIMAL;
const INTEGER_GROUPS = new Intl.NumberFormat(undefined, { useGrouping: true, maximumFractionDigits: 0 })
  .formatToParts(123456789012345)
  .filter((part) => part.type === "integer")
  .map((part) => part.value.length);
const PRIMARY_GROUP_SIZE = INTEGER_GROUPS[INTEGER_GROUPS.length - 1] || 3;
const SECONDARY_GROUP_SIZE = INTEGER_GROUPS[INTEGER_GROUPS.length - 2] || PRIMARY_GROUP_SIZE;

function groupIntegerDigits(value) {
  let end = value.length;
  let size = PRIMARY_GROUP_SIZE;
  const chunks = [];
  while (end > size) {
    chunks.unshift(value.slice(end - size, end));
    end -= size;
    size = SECONDARY_GROUP_SIZE;
  }
  chunks.unshift(value.slice(0, end));
  return chunks.join(NUMBER_GROUP);
}

function normalizeEditableAmount(value) {
  if (value === "") return "";
  const parts = value.split(NUMBER_DECIMAL);
  if (parts.length > 2) return null;
  const whole = (parts[0] || "0").replace(/^0+(?=\d)/, "") || "0";
  const fraction = parts[1] || "";
  if (!/^\d*$/.test(whole) || !/^\d{0,2}$/.test(fraction)) return null;
  return `${whole}${parts.length === 2 ? `${NUMBER_DECIMAL}${fraction}` : ""}`;
}

export function parseEditableAmount(value, currencySymbol, allowInProgressFormatting = false) {
  let input = value;
  if (currencySymbol && input.startsWith(currencySymbol)) input = input.slice(currencySymbol.length);
  if (input === "") return { value: "" };
  if (/\s/.test(input.split(NUMBER_GROUP).join(""))) return { error: "Remove spaces from the amount." };

  const parts = input.split(NUMBER_DECIMAL);
  if (parts.length > 2) return { error: "Enter only one decimal separator." };
  let integer = parts[0] || "0";
  const fraction = parts[1] || "";
  if (!/^\d*$/.test(fraction) || fraction.length > 2)
    return { error: "Use no more than 2 decimal places." };

  if (allowInProgressFormatting) {
    integer = integer.split(NUMBER_GROUP).join("");
  } else if (integer.includes(NUMBER_GROUP)) {
    const groups = integer.split(NUMBER_GROUP);
    const valid = groups[0].length >= 1 && groups[0].length <= SECONDARY_GROUP_SIZE &&
      groups.slice(1, -1).every((group) => group.length === SECONDARY_GROUP_SIZE) &&
      groups[groups.length - 1].length === PRIMARY_GROUP_SIZE;
    if (!valid) return { error: "Check the digit grouping in the amount." };
    integer = groups.join("");
  }

  if (!/^\d*$/.test(integer)) return { error: "Use digits and the correct decimal separator only." };
  const normalized = normalizeEditableAmount(`${integer}${parts.length === 2 ? `${NUMBER_DECIMAL}${fraction}` : ""}`);
  return normalized === null
    ? { error: "Use digits and the correct decimal separator only." }
    : { value: normalized };
}

export function validateEditableAmount(value) {
  if (!String(value || "").trim() || !Number.isFinite(Number(value)) || Number(value) <= 0)
    return "Enter an amount greater than zero.";
  return parseEditableAmount(String(value), "").error || null;
}

export function formatEditableAmount(value) {
  if (!value) return "";
  const parts = String(value).split(NUMBER_DECIMAL);
  const grouped = groupIntegerDigits(parts[0] || "0");
  return `${grouped}${parts.length === 2 ? `${NUMBER_DECIMAL}${parts[1]}` : ""}`;
}

export function editedTextRange(previous, next) {
  let prefix = 0;
  while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix]) prefix++;
  let suffix = 0;
  while (suffix < previous.length - prefix && suffix < next.length - prefix && previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]) suffix++;
  return { prefix, inserted: next.slice(prefix, next.length - suffix), removed: previous.slice(prefix, previous.length - suffix) };
}

export function amountCursorForEdit(input, currencySymbol, cursorPosition, value) {
  if (cursorPosition >= input.length) return formatEditableAmount(value).length;
  let prefix = input.slice(0, cursorPosition);
  if (currencySymbol && prefix.startsWith(currencySymbol)) prefix = prefix.slice(currencySymbol.length);
  prefix = prefix.split(NUMBER_GROUP).join("");
  const normalizedPrefix = normalizeEditableAmount([...prefix].filter((character) => /\d/.test(character) || character === NUMBER_DECIMAL).join(""));
  const ordinal = normalizedPrefix?.length || 0;
  const display = formatEditableAmount(value);
  let seen = 0;
  for (let index = 0; index < display.length; index++) {
    if (/\d/.test(display[index]) || display[index] === NUMBER_DECIMAL) seen++;
    if (seen >= ordinal && ordinal > 0) return index + 1;
  }
  return 0;
}
