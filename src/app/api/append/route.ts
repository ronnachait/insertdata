// ✅ src/app/api/createDataSheet/route.ts (Next.js 13/14 app directory)
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { accessToken, spreadsheetId, sheetName, formData, uuid } = body;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing access token" },
      { status: 401 }
    );
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: "v4", auth });
  console.log(formData)
  const values = [
    [
      uuid,
      formData.prototype,
      formData.testTopic,
      formData.detail,
      formData.partNumber,
      formData.partName,
      formData.partType,
      formData.block,
      formData.gps,
      formData.mcHour,
      formData.partHour,
      formData.incharge,
      formData.pictureZoomOutRef? `=hyperlink("https://drive.google.com/file/d/${formData.pictureZoomOutRef}", image("https://lh3.google.com/u/0/d/${formData.pictureZoomOutRef}", 4, 150, 150))`:"",
      formData.pictureZoomInRef? `=hyperlink("https://drive.google.com/file/d/${formData.pictureZoomInRef}", image("https://lh3.google.com/u/0/d/${formData.pictureZoomInRef}", 4, 150, 150))`:"",
      formData.picturesRef? `=hyperlink("https://drive.google.com/drive/folders/${formData.picturesRef}","📁 Folder")`:"",
      formData.picturesRefAfter? `=hyperlink("https://drive.google.com/drive/folders/${formData.picturesRefAfter}","📁 Folder")`:"",
    ]
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED", // RAW = TEXT / USER_ENTERED = สูตร
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values,
    },
  });

  return NextResponse.json({ message: "Append Successfully!" });
}
