export async function uploadToGoogleDrive(
  file: File | Blob,
  accessToken: string,
  fileName: string,
  folderId: string,
  onProgress: (progress: number) => void
) {
  const metadata = {
    name: fileName,
    mimeType: file.type,
    parents: [folderId],
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", file);

  const xhr = new XMLHttpRequest();
  const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  return new Promise((resolve, reject) => {
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed due to a network error"));

    xhr.send(form);
  });
}
