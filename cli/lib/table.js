const { colors } = require('./api');

// Unicode box-drawing characters
const BOX = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  teeLeft: '├',
  teeRight: '┤',
  cross: '┼',
};

/**
 * Calculate column widths based on headers and rows.
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {number[]} [minWidths]
 * @returns {number[]}
 */
function calcWidths(headers, rows, minWidths = []) {
  const widths = headers.map((h, i) => Math.max(
    minWidths[i] || 0,
    String(h).length
  ));

  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const cell = String(row[i] || '');
      widths[i] = Math.max(widths[i] || 0, cell.length);
    }
  }

  return widths;
}

/**
 * Truncate a string to fit within maxWidth.
 * @param {string} str
 * @param {number} maxWidth
 * @returns {string}
 */
function truncate(str, maxWidth) {
  const s = String(str || '');
  if (s.length <= maxWidth) return s;
  return s.slice(0, maxWidth - 1) + '…';
}

/**
 * Create a horizontal separator line.
 * @param {number[]} widths
 * @param {object} chars
 * @returns {string}
 */
function separator(widths, chars = { left: BOX.teeLeft, right: BOX.teeRight, cross: BOX.cross }) {
  const parts = widths.map(w => BOX.horizontal.repeat(w + 2));
  return chars.left + parts.join(chars.cross) + chars.right;
}

/**
 * Create a top or bottom border.
 * @param {number[]} widths
 * @param {string} left
 * @param {string} right
 * @returns {string}
 */
function border(widths, left, right) {
  const parts = widths.map(w => BOX.horizontal.repeat(w + 2));
  return left + parts.join(BOX.horizontal) + right;
}

/**
 * Render a formatted table.
 * @param {string[]} headers - Column headers
 * @param {string[][]} rows - Array of row arrays
 * @param {object} [options]
 * @param {number[]} [options.minWidths] - Minimum column widths
 * @param {boolean} [options.boldHeaders] - Bold headers (default: true)
 * @returns {string} Formatted table string
 */
function renderTable(headers, rows, options = {}) {
  const { boldHeaders = true, minWidths = [] } = options;

  if (headers.length === 0) {
    return colors.dim('(no data)');
  }

  const widths = calcWidths(headers, rows, minWidths);

  // Truncate rows to fit
  const fittedRows = rows.map(row =>
    row.map((cell, i) => truncate(cell, widths[i]))
  );

  const lines = [];

  // Top border
  lines.push(border(widths, BOX.topLeft, BOX.topRight));

  // Header row
  const headerCells = headers.map((h, i) => {
    const content = boldHeaders ? colors.bold(h) : h;
    return ` ${content.padEnd(widths[i])} `;
  });
  lines.push(BOX.vertical + headerCells.join(BOX.vertical) + BOX.vertical);

  // Separator
  lines.push(separator(widths));

  // Data rows
  for (const row of fittedRows) {
    const cells = row.map((cell, i) => ` ${cell.padEnd(widths[i])} `);
    lines.push(BOX.vertical + cells.join(BOX.vertical) + BOX.vertical);
  }

  // Bottom border
  lines.push(border(widths, BOX.bottomLeft, BOX.bottomRight));

  return lines.join('\n');
}

/**
 * Print a table (convenience wrapper that also handles empty data).
 */
function printTable(headers, rows, options = {}) {
  if (rows.length === 0) {
    console.log(colors.dim('(no results)'));
    return;
  }
  console.log(renderTable(headers, rows, options));
}

module.exports = {
  renderTable,
  printTable,
  truncate,
  calcWidths,
  BOX,
};
