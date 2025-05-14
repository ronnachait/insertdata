import { google } from "googleapis";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token || !token.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email } = await req.json();

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token.accessToken as string });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
  const range = "data!A1";

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[name, email]],
    },
  });
  

  return NextResponse.json({ success: true });
}
