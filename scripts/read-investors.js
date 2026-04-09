import ExcelJS from 'exceljs';

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('attached_assets/INVESTIDORES- SISTEMA  (1)_1763982560350.xlsx');
  const worksheet = workbook.worksheets[0];

  const headers = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cell.text || '';
  });

  const data = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      obj[header] = cell.value ?? null;
    });
    data.push(obj);
  });

  console.log('Total rows:', data.length);
  console.log('Columns:', Object.keys(data[0] || {}));
  console.log('\nFirst 3 rows:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));
}

main().catch(console.error);
