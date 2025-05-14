"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { uploadToGoogleDrive } from "../utils/uploadToGoogleDrive";
import { createGoogleDriveFolder } from "../utils/createGoogleDriveFolder";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Spinner } from "@/components/Spinner";
import Image from "next/image";


const FormSheet = () => {
  type status = "loading" | "authenticated" | "unauthenticated";
  const { data: session, status } = useSession();
  const folderId = "1os4wEUAiMt9fCWbT5oQ-vrjgDuVGSNbE"; //Part change report ( Google Drive Folder )
  const [previewZoomOut, setPreviewZoomOut] = useState<string | null>(null);
  const [previewZoomIn, setPreviewZoomIn] = useState<string | null>(null);
  const [previewMultiple, setPreviewMultiple] = useState<string[]>([]);
  const [previewMultipleAfter, setPreviewMultipleAfter] = useState<string[]>(
    []
  );

  const pictureZoomOutRef = useRef<HTMLInputElement>(null);
  const pictureZoomInRef = useRef<HTMLInputElement>(null);
  const picturesRef = useRef<HTMLInputElement>(null);
  const picturesRefAfter = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    prototype: "",
    testTopic: "",
    detail: "",
    partNumber: "",
    partName: "",
    partType: "",
    block: "",
    gps: "",
    mcHour: "",
    partHour: "",
    incharge: "",
    pictureZoomOutRef: "",
    pictureZoomInRef: "",
    picturesRef: "",
    picturesRefAfter: "",
  });

  interface FileDetails {
    name: string;
    size: number;
    status: string;
    fileId: string;
    parentId: string;
    uploadProgress: number;
    fileObj: File | null;
    source:
      | "pictureZoomOutRef"
      | "pictureZoomInRef"
      | "picturesRef"
      | "picturesRefAfter";
  }
  const [uploadedFiles, setUploadedFiles] = useState<FileDetails[]>([]);
  const [loading, setLoading] = useState(false);
  console.log(status)
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (!files || files.length === 0) return;

    if (name === "pictureZoomOut") {
      setPreviewZoomOut(URL.createObjectURL(files[0]));
    } else if (name === "pictureZoomIn") {
      setPreviewZoomIn(URL.createObjectURL(files[0]));
    } else if (name === "pictures") {
      const fileArray = Array.from(files);
      const previews = fileArray.map((file) => URL.createObjectURL(file));
      setPreviewMultiple(previews);
    } else if (name === "picturesAfter") {
      const fileArrayAfter = Array.from(files);
      const previewsAfter = fileArrayAfter.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviewMultipleAfter(previewsAfter);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prototype || !formData.testTopic || !formData.partNumber) {
      toast.warning("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    
    if (status === "unauthenticated") {
      toast.error("Token หมดอายุ !");
      signOut();
      return;
    }

    if (!session?.accessToken) {
      toast.error("กรุณา Sign In ก่อนบันทึกข้อมูล");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/write-uuid", {
      method: "POST",
      body: JSON.stringify({
        accessToken: session.accessToken, // ต้องใส่ชื่อ key
        spreadsheetId: "1_7ZabRv5KJsGF-0mss9RWyHLG-IUh5PEsjcduF2PVLQ",
        sheetName: "logData",
      }),
    });

    if (!res.ok) {
      const error = await res.text(); // หรือ await res.json() ถ้าฝั่ง server ส่ง JSON error กลับมา
      throw new Error(`Request failed: ${error}`);
    }
    const uuid = await res.json(); // อ่านค่าที่ API ส่งกลับมา
    console.log("UUID :" + uuid.rowCount);
    const mainFolder = await createGoogleDriveFolder(
      uuid.rowCount,
      folderId,
      session.accessToken
    );
    const updatedForm = { ...formData }; // ตัวแปรกลาง
    if (
      pictureZoomOutRef.current &&
      pictureZoomOutRef.current.files &&
      pictureZoomOutRef.current.files.length > 0
    ) {
      const file = pictureZoomOutRef.current.files[0];
      const fileDetail: FileDetails = {
        name: file.name,
        size: file.size,
        status: "Uploading",
        fileId: "",
        parentId: mainFolder.id,
        uploadProgress: 0,
        fileObj: file,
        source: "pictureZoomOutRef", // หรือ "pictures", "zoomOut", "after", etc.
      };
      setUploadedFiles((prev) => [...prev, fileDetail]);

      try {
        const uploadedFile = (await uploadToGoogleDrive(
          file,
          session.accessToken,
          file.name,
          mainFolder.id,
          (progress) => {
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.name === file.name
                  ? { ...f, uploadProgress: progress, status: "Uploading" }
                  : f
              )
            );
          }
        )) as { id: string; name: string }; // ใช้ assert เพื่อระบุประเภทที่คาดหวัง;

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
        const newPictureId = uploadedFile.id;
        updatedForm.pictureZoomOutRef = newPictureId;
        console.log(updatedForm.pictureZoomOutRef);
      } catch (error) {
         console.error(error);
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

    if (
      pictureZoomInRef.current &&
      pictureZoomInRef.current.files &&
      pictureZoomInRef.current.files.length > 0
    ) {
      const file = pictureZoomInRef.current.files[0];
      const fileDetail: FileDetails = {
        name: file.name,
        size: file.size,
        status: "Uploading",
        fileId: "",
        parentId: mainFolder.id,
        uploadProgress: 0,
        fileObj: file,
        source: "pictureZoomInRef", // หรือ "pictures", "zoomOut", "after", etc.
      };
      setUploadedFiles((prev) => [...prev, fileDetail]);

      try {
        const uploadedFile = (await uploadToGoogleDrive(
          file,
          session.accessToken,
          file.name,
          mainFolder.id,
          (progress) => {
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.name === file.name
                  ? { ...f, uploadProgress: progress, status: "Uploading" }
                  : f
              )
            );
          }
        )) as { id: string; name: string }; // ใช้ assert เพื่อระบุประเภทที่คาดหวัง;;

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

        const newPictureId = uploadedFile.id;
        updatedForm.pictureZoomInRef = newPictureId;
        console.log(updatedForm.pictureZoomInRef);

      } catch (error) {
         console.error(error);
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

    if (
      picturesRef.current &&
      picturesRef.current.files &&
      picturesRef.current.files.length > 0
    ) {
      const files = picturesRef.current.files;
      const folderName = "picturesRef";
      const newFolder = await createGoogleDriveFolder(
        folderName,
        mainFolder.id,
        session.accessToken
      );

      console.log("New Folder : " + newFolder.id);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileDetail: FileDetails = {
          name: file.name,
          size: file.size,
          status: "Uploading",
          fileId: "",
          parentId: newFolder.id,
          uploadProgress: 0,
          fileObj: file,
          source: "picturesRef", // หรือ "pictures", "zoomOut", "after", etc.
        };
        setUploadedFiles((prev) => [...prev, fileDetail]);

        try {
          const uploadedFile = (await uploadToGoogleDrive(
            file,
            session.accessToken,
            file.name,
            newFolder.id,
            (progress) => {
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.name === file.name
                    ? { ...f, uploadProgress: progress, status: "Uploading" }
                    : f
                )
              );
            }
          )) as { id: string; name: string }; // ใช้ assert เพื่อระบุประเภทที่คาดหวัง;;

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
        } catch (error) {
           console.error(error);
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

      const newPictureId = newFolder.id;
      updatedForm.picturesRef = newPictureId;
      console.log(updatedForm.picturesRef);
    }

    if (
      picturesRefAfter.current &&
      picturesRefAfter.current.files &&
      picturesRefAfter.current.files.length > 0
    ) {
      const files = picturesRefAfter.current.files;
      const folderName = "picturesRefAfter";
      const newFolder = await createGoogleDriveFolder(
        folderName,
        mainFolder.id,
        session.accessToken
      );

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileDetail: FileDetails = {
          name: file.name,
          size: file.size,
          status: "Uploading",
          fileId: "",
          parentId: newFolder.id,
          uploadProgress: 0,
          fileObj: file,
          source: "picturesRefAfter", // หรือ "pictures", "zoomOut", "after", etc.
        };
        setUploadedFiles((prev) => [...prev, fileDetail]);

        try {
          const uploadedFile = (await uploadToGoogleDrive(
            file,
            session.accessToken,
            file.name,
            newFolder.id,
            (progress) => {
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.name === file.name
                    ? { ...f, uploadProgress: progress, status: "Uploading" }
                    : f
                )
              );
            }
          )) as { id: string; name: string }; // ใช้ assert เพื่อระบุประเภทที่คาดหวัง;

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
        } catch (error) {
           console.error(error);
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

      const newPictureId = newFolder.id;
      updatedForm.picturesRefAfter = newPictureId;
      console.log(updatedForm.picturesRefAfter);
    }

    /// POST -> DATA TO GOOGLE SHEET
    setFormData(updatedForm);

    try {
       await fetch("/api/append", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: session.accessToken, // ต้องใส่ชื่อ key
          spreadsheetId: "1_7ZabRv5KJsGF-0mss9RWyHLG-IUh5PEsjcduF2PVLQ",
          sheetName: "logData",
          formData: updatedForm,
          uuid: uuid.rowCount,
        }),
      });

      toast.success("อัปโหลดและบันทึกข้อมูลสำเร็จ!");
      const form = e.target as HTMLFormElement;
      form.reset();

      setFormData({
        prototype: "",
        testTopic: "",
        detail: "",
        partNumber: "",
        partName: "",
        partType: "",
        block: "",
        gps: "",
        mcHour: "",
        partHour: "",
        incharge: "",
        pictureZoomOutRef: "",
        pictureZoomInRef: "",
        picturesRef: "",
        picturesRefAfter: "",
      });

      setPreviewZoomOut(null);
      setPreviewZoomIn(null);
      setPreviewMultiple([]);
      setPreviewMultipleAfter([]);

      // Clear file inputs
      if (pictureZoomOutRef.current) pictureZoomOutRef.current.value = "";
      if (pictureZoomInRef.current) pictureZoomInRef.current.value = "";
      if (picturesRef.current) picturesRef.current.value = "";
      if (picturesRefAfter.current) picturesRefAfter.current.value = "";
      setUploadedFiles([]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("❌ บันทึกข้อมูลลง Google Sheet ไม่สำเร็จ");
      setLoading(false);
    }
  };

  const retryUpload = async (file: FileDetails) => {
    if (!file.fileObj || !session?.accessToken) return;

    try {
      const uploadedFile = (await uploadToGoogleDrive(
        file.fileObj,
        session.accessToken,
        file.name,
        file.parentId,
        (progress) => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, uploadProgress: progress, status: "Retrying..." }
                : f
            )
          );
        }
      )) as { id: string; name: string }; // ใช้ assert เพื่อระบุประเภทที่คาดหวัง;

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
       console.error(err);
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, status: "Failed", uploadProgress: 0, fileId: "" }
            : f
        )
      );
    }
  };

  useEffect(() => {
    const updateOnlineStatus = () => {
      if (!navigator.onLine) {
        toast.error("❌ อินเทอร์เน็ตขาดการเชื่อมต่อ");
      }
    };
    window.addEventListener("offline", updateOnlineStatus);
    window.addEventListener("online", () =>
      toast.success("✅ กลับมาออนไลน์แล้ว")
    );

    return () => {
      window.removeEventListener("offline", updateOnlineStatus);
      window.removeEventListener("online", updateOnlineStatus);
    };
  }, []);


  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow mt-4">
      {!session && (
        <div className="text-center text-red-500">
          กรุณา{" "}
          <button className="underline" onClick={() => signIn("google")}>
            เข้าสู่ระบบด้วย Google
          </button>{" "}
          ก่อนกรอกแบบฟอร์ม
        </div>
      )}

      {session && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="prototype"
              className="input"
              onChange={handleChange}
              value={formData.prototype}
              required
            >
              <option value="">-- เลือก Prototype --</option>
              <option value="2.9">2.9</option>
              <option value="3.6">3.6</option>
            </select>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <textarea
              name="testTopic"
              placeholder="Test Topic"
              className="input h-15"
              value={formData.testTopic}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <textarea
              name="detail"
              placeholder="Detail"
              className="input h-15"
              value={formData.detail}
              onChange={handleChange}
              required
            />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="partNumber"
              placeholder="Part number"
              className="input"
              onChange={handleChange}
              required
            />
            <input
              name="partName"
              placeholder="Part name"
              className="input"
              onChange={handleChange}
              required
            />
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <select
                name="partType"
                className="input"
                onChange={handleChange}
                value={formData.partType}
                required
              >
                <option value="">-- เลือก PartType --</option>
                <option value="ไทย (TH)">ไทย (TH)</option>
                <option value="ญี่ปุ่น (JPN)">ญี่ปุ่น (JPN)</option>
                <option value="NSK">NSK</option>
              </select>
            </div>
            <select
              name="block"
              onChange={(e) => handleChange(e)}
              className="border rounded px-3 py-2 w-full"
              required
            >
              <option value="">-- เลือก Block --</option>
              <option value="EG">EG</option>
              <option value="Auto Loader">Auto Loader</option>
              <option value="Cover/Step">Cover/Step</option>
              <option value="Cabin">Cabin</option>
              <option value="Chopper">Chopper</option>
              <option value="Divider">Divider</option>
              <option value="Feeder">Feeder</option>
              <option value="Blower">Blower</option>
              <option value="Base Cutter">Base Cutter</option>
              <option value="Header">Header</option>
              <option value="F-tire">F-tire</option>
              <option value="R-tire">R-tire</option>
              <option value="Operation">Operation</option>
              <option value="Harness">Harness</option>
              <option value="Fuel">Fuel</option>
              <option value="Frame">Frame</option>
              <option value="Hydraulic">Hydraulic</option>
              <option value="Cooling">Cooling</option>
              <option value="Topper">Topper</option>
              <option value="Label">Label</option>
              <option value="TM">TM</option>
              <option value="EG-Cover">EG-Cover</option>
              <option value="Etc">Etc</option>
            </select>

            <input
              name="gps"
              placeholder="GPS LINK.."
              className="input"
              onChange={handleChange}
            />
          </div>
          <hr />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ZoomOut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📸 Picture ZoomOut
              </label>
              <input
                type="file"
                name="pictureZoomOut"
                ref={pictureZoomOutRef}
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0 file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
              />
              {previewZoomOut && (
                <Image
                  src={previewZoomOut}
                  alt="ZoomOut Preview"
                  className="mt-2 w-full max-w-xs rounded border"
                />
              )}
            </div>

            {/* ZoomIn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📸 Picture ZoomIn
              </label>
              <input
                type="file"
                name="pictureZoomIn"
                ref={pictureZoomInRef}
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0 file:text-sm file:font-semibold
            file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            required
              />
              {previewZoomIn && (
                <Image
                  src={previewZoomIn}
                  alt="ZoomIn Preview"
                  className="mt-2 w-full max-w-xs rounded border"
                />
              )}
            </div>

            {/* Multiple Pictures */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📁 Picture (หลายไฟล์ได้)
              </label>
              <input
                type="file"
                name="pictures"
                accept="image/*"
                ref={picturesRef}
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0 file:text-sm file:font-semibold
            file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {previewMultiple.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-4">
                  {previewMultiple.map((src, index) => (
                    <Image
                      key={index}
                      src={src}
                      alt={`Multiple Preview ${index + 1}`}
                      className="w-32 h-32 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <hr />
          {/* Time and causes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="mcHour"
              placeholder="M/C hour (hrs)"
              className="input"
              type="number"
              onChange={handleChange}
              required
            />
            <input
              name="partHour"
              placeholder="Part hour (hrs)"
              className="input"
              type="number"
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="partType"
              className="input"
              onChange={handleChange}
              value={formData.partType}
            >
              <option value="">-- Part ที่นำมาใช่ --</option>
              <option value="2.8 Prototype">2.8 Prototype</option>
              <option value="3.1 Prototype">3.1 Prototype</option>
              <option value="Part New (JPN)">Part New (JPN)</option>
              <option value="Part New (TH)">Part New (TH)</option>
              <option value="Part Modify">Part Modify</option>
              <option value="3.0 Prototype (JPN)">3.0 Prototype (JPN)</option>
            </select>
          </div>
          <hr />
          {/* Multiple Pictures */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📁 Picture (After change) (หลายไฟล์ได้)
            </label>
            <input
              type="file"
              name="picturesAfter"
              // accept="image/*"
              ref={picturesRefAfter}
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0 file:text-sm file:font-semibold
            file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {previewMultipleAfter.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-4">
                {previewMultipleAfter.map((src, index) => (
                  <Image
                    key={index}
                    src={src}
                    alt={`Multiple Preview ${index + 1}`}
                    className="w-32 h-32 object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </div>
          <hr />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="incharge"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                👤 Incharge
              </label>
              <select
                name="incharge"
                id="incharge"
                value={formData.incharge}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- เลือกผู้รับผิดชอบ --</option>
                <option value="Tom">Tom</option>
                <option value="Tong">Tong</option>
                <option value="Drive">Drive</option>
                <option value="Mos">Mos</option>
                <option value="Mik">Mik</option>
                <option value="Nate">Nate</option>
                <option value="Eat">Eat</option>
                <option value="Add">Add</option>
                <option value="Hann">Hann</option>
                <option value="Khan">Khan</option>
                <option value="Pu">Pu</option>
                <option value="Biw">Biw</option>
                <option value="Wat">Wat</option>
                <option value="Est">Est</option>
                <option value="Win">Win</option>
                <option value="Aey">Aey</option>
                <option value="Max">Max</option>
              </select>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-8 border rounded-lg shadow-lg overflow-x-auto bg-gradient-to-r from-blue-50 via-white to-blue-50">
              <h3 className="text-lg font-semibold px-4 pt-4 text-gray-700">
                Uploaded Files:
              </h3>
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm mt-2 min-w-[600px]">
                  <thead>
                    <tr className="bg-blue-200 text-gray-700 border-b">
                      <th className="px-4 py-2 text-left w-1/3">Name</th>
                      <th className="px-2 py-2 text-center w-24">Size</th>
                      <th className="px-2 py-2 text-center w-24">Status</th>
                      <th className="px-2 py-2 text-center w-40">Progress</th>
                      <th className="px-2 py-2 text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.map((file, index) => (
                      <tr
                        key={index}
                        className={`${
                          file.status === "Uploading"
                            ? "bg-yellow-100"
                            : file.status === "Uploaded"
                            ? "bg-green-100"
                            : "bg-white"
                        } hover:bg-gray-50 transition-all duration-300`}
                      >
                        <td className="px-4 py-2 font-medium text-gray-800 truncate max-w-xs">
                          {file.name}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-600 whitespace-nowrap">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </td>
                        <td
                          className={`px-2 py-2 text-center font-semibold whitespace-nowrap ${
                            file.status === "Uploaded"
                              ? "text-green-600"
                              : file.status === "Uploading"
                              ? "text-orange-500"
                              : "text-red-600"
                          }`}
                        >
                          {file.status}
                        </td>
                        <td className="px-2 py-2 w-40">
                          <div className="relative h-2 bg-gray-200 rounded-lg">
                            <div
                              className="absolute left-0 top-0 h-full rounded-lg transition-all duration-300"
                              style={{
                                width: `${file.uploadProgress || 0}%`,
                                backgroundColor:
                                  file.status === "Uploading"
                                    ? "#f97316"
                                    : "#22c55e",
                              }}
                            />
                            <span className="absolute inset-0 text-[10px] text-center text-gray-700 font-semibold leading-[0.5rem] flex items-center justify-center">
                              {file.uploadProgress?.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {file.status !== "Uploaded" && (
                            <button
                              className="text-sm text-blue-600 hover:underline hover:text-blue-800"
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
            </div>
          )}

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            
             {loading ? <Spinner /> : <p>บันทึกข้อมูล</p>}
          </button>
        </form>
      )}

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default FormSheet;
