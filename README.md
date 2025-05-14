  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[name, email]],
    },
  });


await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: "Sheet1!A1:B1",  // กำหนด range ที่จะอัปเดต
  valueInputOption: "USER_ENTERED",
  requestBody: {
    values: [["Updated Name", "Updated Email"]], // ข้อมูลใหม่ที่ต้องการอัปเดต
  },
});


const response = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: "Sheet1!A1:B10",  // กำหนด range ที่ต้องการดึงข้อมูล
});

console.log(response.data.values); // ข้อมูลที่ดึงมา


await sheets.spreadsheets.values.clear({
  spreadsheetId,
  range: "Sheet1!A1:B10",  // กำหนด range ที่จะลบข้อมูล
});


await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: {
    requests: [
      {
        updateCells: {
          rows: [
            {
              values: [
                { userEnteredValue: { stringValue: "New Value" } },
              ],
            },
          ],
          fields: "*",
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 1,
          },
        },
      },
      // คุณสามารถเพิ่มการเปลี่ยนแปลงหลาย ๆ แบบได้ที่นี่
    ],
  },
});



const response = await sheets.spreadsheets.values.batchGet({
  spreadsheetId,
  ranges: ["Sheet1!A1:B10", "Sheet1!C1:D10"], // กำหนดหลาย range
});

console.log(response.data.valueRanges); // ข้อมูลที่ดึงมา
