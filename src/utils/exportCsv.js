/**
 * Exports an array of objects to a downloadable CSV file.
 * 
 * @param {Array<Object>} data - Array of row objects to export
 * @param {string} filename - Output filename (e.g. 'chrad_users_export.csv')
 * @param {Array<{ key: string, label: string }>} columns - Column key & header label mappings
 */
export function exportToCSV(data = [], filename = 'chrad_export.csv', columns = []) {
  if (!data || data.length === 0) {
    alert('No data records available to export.');
    return;
  }

  // Derive columns if not provided
  const cols = columns.length > 0
    ? columns
    : Object.keys(data[0]).map((key) => ({ key, label: key.toUpperCase() }));

  // Header row
  const headerRow = cols.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');

  // Value rows
  const valueRows = data.map((row) => {
    return cols
      .map((col) => {
        let val = row[col.key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...valueRows].join('\r\n'); // Add UTF-8 BOM for Excel
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
