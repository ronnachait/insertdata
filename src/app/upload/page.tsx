"use client";

import { useEffect, useState } from "react";
import { uploadToGoogleDrive } from "../utils/uploadToGoogleDrive";
import { useSession } from "next-auth/react";

export default function UploadButton() {
  const [uploadedFiles, setUploadedFiles] = useState<FileDetails[]>([]);
  const { data: session } = useSession();
  const folderId = "1q30W5UdnedD2bTi4dmmSWzLk-pvqER2K";

  interface FileDetails {
    name: string;
    size: number;
    status: string;
    fileId: string;
    uploadProgress: number;
    fileObj: File | null;
  }

  useEffect(() => {
    const updateOnlineStatus = () => {
      if (!navigator.onLine) {
        alert("❌ อินเทอร์เน็ตขาดการเชื่อมต่อ");
      }
    };
    window.addEventListener("offline", updateOnlineStatus);
    window.addEventListener("online", () => alert("✅ กลับมาออนไลน์แล้ว"));

    return () => {
      window.removeEventListener("offline", updateOnlineStatus);
      window.removeEventListener("online", updateOnlineStatus);
    };
  }, []);

  const handleUpload = async (files: FileList) => {
    if (!session?.accessToken) return;

    const newFiles: FileDetails[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileDetail: FileDetails = {
        name: file.name,
        size: file.size,
        status: "Uploading",
        fileId: "",
        uploadProgress: 0,
        fileObj: file,
      };
      setUploadedFiles((prev) => [...prev, fileDetail]);

      try {
        const uploadedFile = await uploadToGoogleDrive(
          file,
          session.accessToken,
          file.name,
          folderId,
          (progress) => {
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.name === file.name
                  ? { ...f, uploadProgress: progress, status: "Uploading" }
                  : f
              )
            );
          }
        );

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? {
                  ...f,
                  status: "Uploaded",
                  fileId: uploadedFile.id,
                  uploadProgress: 100,
                }
              : f
          )
        );
      } catch (err) {
        const isOffline = !navigator.onLine;
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? {
                  ...f,
                  status: isOffline ? "Network Error" : "Failed",
                  uploadProgress: 0,
                  fileId: "",
                }
              : f
          )
        );
      }
    }
  };

  const retryUpload = async (file: FileDetails) => {
    if (!file.fileObj || !session?.accessToken) return;
    try {
      const uploadedFile = await uploadToGoogleDrive(
        file.fileObj,
        session.accessToken,
        file.name,
        folderId,
        (progress) => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, uploadProgress: progress, status: "Retrying..." }
                : f
            )
          );
        }
      );

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? {
                ...f,
                status: "Uploaded",
                fileId: uploadedFile.id,
                uploadProgress: 100,
              }
            : f
        )
      );
    } catch (err) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, status: "Failed", uploadProgress: 0, fileId: "" }
            : f
        )
      );
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <input
        type="file"
        multiple
        onChange={(e) => {
          const files = e.target.files;
          if (files) handleUpload(files);
        }}
        className="mb-4"
      />
      <h3 className="text-lg font-semibold mb-2">Uploaded Files:</h3>
      <table className="table-auto w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-2 py-1 text-left">Name</th>
            <th className="px-2 py-1">Size</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">File ID</th>
            <th className="px-2 py-1">Progress</th>
            <th className="px-2 py-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {uploadedFiles.map((file, index) => (
            <tr key={index} className="border-t">
              <td className="px-2 py-1">{file.name}</td>
              <td className="px-2 py-1">{file.size}</td>
              <td className="px-2 py-1">{file.status}</td>
              <td className="px-2 py-1 text-xs">{file.fileId || "N/A"}</td>
              <td className="px-2 py-1">
                <div className="w-full bg-gray-200 rounded">
                  <div
                    className="h-2 rounded"
                    style={{
                      width: `${file.uploadProgress}%`,
                      backgroundColor:
                        file.status === "Uploaded" ? "green" : "orange",
                    }}
                  ></div>
                </div>
              </td>
              <td className="px-2 py-1">
                {file.status !== "Uploaded" && (
                  <button
                    className="text-blue-600 underline"
                    onClick={() => retryUpload(file)}
                  >
                    Retry
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}