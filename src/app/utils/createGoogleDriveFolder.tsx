export async function createGoogleDriveFolder(
  folderName: string,
  parentFolderId: string,
  accessToken: string
): Promise<{ id: string; name: string }> {
  // ✅ 1. ลองค้นหาโฟลเดอร์ที่มีชื่อและ parent เดียวกัน
  const query = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentFolderId}' in parents and trashed=false`
  );

  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const searchResult = await searchResponse.json();

  if (!searchResponse.ok) {
    throw new Error(`Search folder failed: ${JSON.stringify(searchResult)}`);
  }

  if (searchResult.files && searchResult.files.length > 0) {
    // ✅ เจอโฟลเดอร์แล้ว ใช้อันเดิม
    return searchResult.files[0];
  }

  // ❌ ไม่เจอ -> สร้างใหม่
  const createResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    }),
  });

  const createResult = await createResponse.json();

  if (!createResponse.ok) {
    throw new Error(`Create folder failed: ${JSON.stringify(createResult)}`);
  }

  return createResult;
}
