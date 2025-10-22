"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useCallback, useMemo, memo } from "react";

import { motion } from "framer-motion";
import { lato } from "@/app/ui/fonts";
import Loading from "@/app/loading";

// Memoized file icon component
const FileIcon = memo(({ mimeType }) => {
  const iconConfig = useMemo(() => {
    if (mimeType.includes("image/png") || mimeType.includes("image/jpeg")) {
      return { icon: "fas fa-file-image", color: "text-cyan-500" };
    }
    if (mimeType.includes("mp4")) {
      return { icon: "fas fa-file-video", color: "text-indigo-500" };
    }
    if (mimeType.includes("pdf")) {
      return { icon: "fas fa-file-pdf", color: "text-red-500" };
    }
    if (mimeType.includes("documentml")) {
      return { icon: "fas fa-file-word", color: "text-blue-500" };
    }
    if (mimeType.includes("spreadsheetml")) {
      return { icon: "fas fa-file-excel", color: "text-green-500" };
    }
    if (mimeType.includes("presentationml")) {
      return { icon: "fas fa-file-powerpoint", color: "text-orange-500" };
    }
    if (mimeType.includes("folder")) {
      return { isFolder: true };
    }
    return { icon: "fas fa-file", color: "text-gray-500" };
  }, [mimeType]);

  if (iconConfig.isFolder) {
    return (
      <Image
        src="/images/folder.svg"
        alt="Folder"
        width={25}
        height={25}
        loading="lazy"
      />
    );
  }

  return <i className={`${iconConfig.icon} ${iconConfig.color}`}></i>;
});

FileIcon.displayName = "FileIcon";

// Memoized file item component
const FileItem = memo(({ file, index, onFolderClick, onPreview }) => {
  const isFolder = file.mimeType.includes("folder");

  const handleClick = useCallback(() => {
    if (isFolder) {
      onFolderClick(file.id);
    }
  }, [isFolder, file.id, onFolderClick]);

  const handlePreview = useCallback(
    (e) => {
      e.stopPropagation();
      onPreview(file.id);
    },
    [file.id, onPreview]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
      viewport={{ once: true, margin: "50px" }}
      className="px-2 py-4 lg:p-4 border-b border-gray-200 dark:border-gray-700 flex"
    >
      <div className="flex-1 flex items-center gap-1">
        <span className="text-gray-600 dark:text-gray-300 mr-1.5 lg:mr-2 xl:mr-3 text-lg">
          {index + 1}.
        </span>

        <div className="text-xl lg:text-2xl mr-0.5">
          <FileIcon mimeType={file.mimeType} />
        </div>

        <h3
          onClick={handleClick}
          className={`${
            isFolder
              ? "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              : ""
          } text-lg text-gray-700 dark:text-gray-300 text-wrap truncate transition-colors`}
        >
          {file.name}
        </h3>
      </div>

      {file.webContentLink && (
        <div className="flex items-center justify-between gap-2 lg:gap-4">
          <Link
            href={file.webContentLink}
            className="flex-1 border-2 border-blue-600 hover:bg-blue-600 transition-colors grid place-items-center text-gray-700 dark:text-gray-200 w-10 h-10 rounded-full"
            aria-label={`Download ${file.name}`}
          >
            <i className="fas fa-download text-[13px]"></i>
          </Link>
          <button
            onClick={handlePreview}
            className="flex-1 border-2 border-blue-600 hover:bg-blue-600 transition-colors grid place-items-center text-gray-700 dark:text-gray-200 w-10 h-10 rounded-full"
            aria-label={`Preview ${file.name}`}
          >
            <i className="fas fa-eye text-[13px]"></i>
          </button>
        </div>
      )}
    </motion.div>
  );
});

FileItem.displayName = "FileItem";

export default function DrivePage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewID, setPreviewId] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);

  const fetchFiles = useCallback(
    async (folderId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/drive/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folderId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setFiles(data.files || []);
        setBreadcrumb(data.breadcrumb || []);
        setCurrentFolder(data.currentFolder || null);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching files:", err);
      } finally {
        setLoading(false);
      }
    },
    [setFiles, setBreadcrumb, setCurrentFolder]
  );

  useEffect(() => {
    if (resolvedParams.id) {
      fetchFiles(resolvedParams.id);
    }
  }, [resolvedParams.id, fetchFiles]);

  const handleFolderClick = useCallback(
    (folderId) => {
      router.push(`/drive/${folderId}`);
    },
    [router]
  );

  const handlePreview = useCallback(
    (fileId) => {
      setPreviewId((prev) => (prev === fileId ? null : fileId));
    },
    [setPreviewId]
  );

  const handleClosePreview = useCallback(() => {
    setPreviewId(null);
  }, [setPreviewId]);

  // Separate folders and files for better UX
  const { folders, regularFiles } = useMemo(() => {
    const folders = files.filter((f) => f.mimeType.includes("folder"));
    const regularFiles = files.filter((f) => !f.mimeType.includes("folder"));
    return { folders, regularFiles };
  }, [files]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => fetchFiles(resolvedParams.id)}
            className="ml-4 underline hover:text-red-900 dark:hover:text-red-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <br />
      <br />

      <div
        className={
          lato.className +
          " px-4 md:px-0 md:max-w-[90%] lg:max-w-[80%] xl:max-w-[70%] mx-auto"
        }
      >
        <div className="bg-[#ffffff78] dark:bg-[#071a26] px-3 lg:px-6 xl:px-8 py-8 rounded-lg shadow-md">
          <div className="mx-auto">
            {/* Breadcrumb Navigation */}
            {breadcrumb.length > 0 && (
              <nav className="mb-6 p-1" aria-label="Breadcrumb">
                <ol className="flex items-center flex-wrap space-x-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Link
                      href="/drive"
                      className="text-[12px] lg:text-[13px] flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      prefetch={true}
                    >
                      <i className="fas fa-home mr-1"></i>
                      Drive
                    </Link>
                  </li>
                  {breadcrumb.map((folder, index) => (
                    <li key={folder.id} className="flex items-center">
                      <i className="fas fa-chevron-right mx-1 text-gray-400 text-xs"></i>
                      {index === breadcrumb.length - 1 ? (
                        <span className="text-[12px] lg:text-[13px] font-medium text-gray-900 dark:text-gray-100 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                          <i className="fas fa-folder mr-1 text-blue-600 dark:text-blue-400"></i>
                          {folder.name}
                        </span>
                      ) : (
                        <Link
                          href={`/drive/${folder.id}`}
                          className="text-[12px] lg:text-[13px] flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          prefetch={true}
                        >
                          <i className="fas fa-folder mr-1"></i>
                          {folder.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <h1 className="text-3xl text-center font-bold mb-6 text-gray-700 dark:text-gray-300">
              {currentFolder ? currentFolder.name : "Drive Files"}
            </h1>

            {files.length === 0 ? (
              <p className="text-2xl text-center text-gray-700 dark:text-gray-300">
                No files found in this folder.
              </p>
            ) : (
              <div className="flex flex-col">
                {/* Folders first */}
                {folders.map((file, index) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    index={index}
                    onFolderClick={handleFolderClick}
                    onPreview={handlePreview}
                  />
                ))}

                {/* Then files */}
                {regularFiles.map((file, index) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    index={folders.length + index}
                    onFolderClick={handleFolderClick}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <br />
      <br />

      {/* Preview Modal */}
      {previewID && (
        <div
          className="fixed top-0 left-0 w-full h-screen bg-gray-900 bg-opacity-75 flex items-center justify-center z-50"
          onClick={handleClosePreview}
        >
          <button
            onClick={handleClosePreview}
            className="absolute top-4 lg:top-7 left-3 lg:left-9 size-10 bg-slate-800 rounded-full text-gray-300 text-2xl cursor-pointer hover:bg-slate-700 transition-colors z-10"
            aria-label="Close preview"
          >
            <i className="fas fa-times"></i>
          </button>
          <iframe
            src={`https://drive.google.com/file/d/${previewID}/preview`}
            width="100%"
            height="100%"
            allow="autoplay"
            className="rounded-lg shadow-md"
            onClick={(e) => e.stopPropagation()}
          ></iframe>
        </div>
      )}
    </>
  );
}
