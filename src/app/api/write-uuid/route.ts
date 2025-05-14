// app/api/generate-uuid/route.ts
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
    const { accessToken, spreadsheetId, sheetName } = body;
  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token" }, { status: 401 });
  }
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: 'v4', auth });

  // อ่านจำนวน row
  const read = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:A`,
  });

  const rowCount = read.data.values?.length || 0;
    return NextResponse.json({
    message: 'CreateUUID Success !',
    rowCount: `PART-ID-${rowCount}`,
  });
}
