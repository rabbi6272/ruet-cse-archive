"use client";

import { use, useCallback, useMemo, memo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

import { motion } from "framer-motion";
import { lato } from "@/app/fonts";
import Loading from "@/app/loading";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { DriveFilePreviewModal } from "./DriveFilePreviewModal";

async function fetchDriveFiles(folderId) {
  const response = await fetch(`/api/drive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

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
        className="mr-1"
      />
    );
  }

  return (
    <i className={`${iconConfig.icon} ${iconConfig.color} text-lg mr-1`}></i>
  );
});

FileIcon.displayName = "FileIcon";

const FileItem = memo(({ file, index, onFolderClick, onPreview }) => {
  const isFolder = file.mimeType.includes("folder");

  const handleClick = useCallback(
    (e) => {
      if (isFolder) {
        onFolderClick(file.id);
      } else {
        e.stopPropagation();
        onPreview(file.id);
      }
    },
    [isFolder, file.id, onFolderClick, onPreview],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      viewport={{ once: true, margin: "50px" }}
      className="px-2 lg:px-4 py-4 lg:p-4 border-b border-gray-200 dark:border-gray-700 flex hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
    >
      <div className="flex-1 flex items-center gap-1">
        <span className="text-gray-600 dark:text-gray-300 mr-1.5 lg:mr-2 xl:mr-3 text-lg">
          {index + 1}.
        </span>

        <div className="text-lg md:text-xl lg:text-2xl mr-0.5">
          <FileIcon mimeType={file.mimeType} />
        </div>

        <h3
          onClick={handleClick}
          className="pr-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-500
          text-md lg:text-lg text-gray-700 dark:text-gray-300 text-wrap truncate transition-colors"
        >
          {file.name}
        </h3>
      </div>

      {file.webContentLink && (
        <Link
          href={file.webContentLink}
          className="border border-gray-600 cursor-pointer grid place-items-center text-gray-700 dark:text-gray-200 hover:border-blue-500 hover:text-blue-500 transition-colors duration-200 w-10 md:w-12 h-7.5 md:h-9 rounded-full"
          aria-label={`Download ${file.name}`}
        >
          <i className="fas fa-download text-xs md:text-sm"></i>
        </Link>
      )}
    </motion.div>
  );
});

FileItem.displayName = "FileItem";

export default function DrivePage({ params }) {
  const resolvedParams = use(params);
  const queryClient = useQueryClient();

  const [previewID, setPreviewId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(resolvedParams.id);

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["drive", selectedFolderId],
    queryFn: () => fetchDriveFiles(selectedFolderId),
  });

  const files = data?.files || [];
  const parentFolderId = data?.parentFolderId || null;
  const currentFolder = data?.currentFolder || null;

  const handleFolderClick = useCallback((folderId) => {
    setSelectedFolderId(folderId);
  }, [selectedFolderId]);

  const handlePreview = useCallback((fileId) => {
    setPreviewId((prev) => (prev === fileId ? null : fileId));
  }, [previewID]);

  const handleClosePreview = useCallback(() => {
    setPreviewId(null);
  }, [previewID]);

  const { folders, regularFiles } = useMemo(() => {
    const folders = files.filter((f) => f.mimeType.includes("folder"));
    const regularFiles = files.filter((f) => !f.mimeType.includes("folder"));
    return { folders, regularFiles };
  }, [files]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && previewID) {
        setPreviewId(null);
      }
    };

    if (previewID) {
      document.addEventListener("keydown", handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [previewID]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded max-w-md">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error.message}</span>
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["drive", selectedFolderId] });
            }}
            className="ml-4 underline hover:text-red-900 dark:hover:text-red-100 transition-colors"
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
        className={`
          ${lato.className} px-4 md:px-0 md:max-w-[90%] lg:max-w-[80%] xl:max-w-[70%] mx-auto`}
      >
        <div className="bg-[#ffffff78] dark:bg-[#071a26] px-3 lg:px-6 xl:px-8 py-8 rounded-lg shadow-md">
          <div className="mx-auto">
            {parentFolderId && (
              <div className="mb-2 cursor-pointer">
                <span
                  onClick={() => setSelectedFolderId(parentFolderId)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
                >
                  <i className="fas fa-arrow-left"></i>
                  <span className="font-medium">Back</span>
                </span>
              </div>
            )}

            <h1 className="text-2xl lg:text-3xl text-center font-bold mb-6 text-gray-700 dark:text-gray-300">
              {currentFolder ? currentFolder.name : "Drive Files"}
            </h1>

            {files.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-folder-open text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
                <p className="text-xl text-gray-700 dark:text-gray-300">
                  No files found in this folder.
                </p>
              </div>
            ) : (
              <>
                {files.length > 50 && (
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                    Showing {files.length} items ({folders.length} folders,{" "}
                    {regularFiles.length} files)
                  </div>
                )}

                <div className="flex flex-col">
                  {folders.map((file, index) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      index={index}
                      onFolderClick={handleFolderClick}
                      onPreview={handlePreview}
                    />
                  ))}

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
              </>
            )}
          </div>
        </div>
      </div>

      <br />
      <br />

      {previewID && (
        <DriveFilePreviewModal
          previewID={previewID}
          handleClosePreview={handleClosePreview}
        />
      )}
    </>
  );
}
