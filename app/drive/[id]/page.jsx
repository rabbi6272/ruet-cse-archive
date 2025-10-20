"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";

import { motion } from "framer-motion";
import { lato } from "@/app/ui/fonts";
import Loading from "@/app/loading";

export default function DrivePage({ params }) {
  const router = useRouter();

  const resolvedParams = use(params);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewID, setPreviewId] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/drive/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folderId: resolvedParams.id }),
        });

        if (!response.ok) {
          // Try to get the error message from the response
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
    };

    if (resolvedParams.id) {
      fetchFiles();
    }
  }, [resolvedParams.id]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
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
          <div className="mx-auto ">
            {/* Breadcrumb Navigation */}
            {breadcrumb.length > 0 && (
              <nav className="mb-6 p-1" aria-label="Breadcrumb">
                <ol className="flex items-center flex-wrap space-x-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Link
                      href="/drive"
                      className="text-[12px] lg:text-[13px]  flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
              <div className="flex flex-col ">
                {files.map((file, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    key={file.id}
                    className="px-2 py-4 lg:p-4 border-b border-gray-200 dark:border-gray-700 flex"
                  >
                    <div className="flex-1 flex items-center gap-1">
                      {/* File number */}
                      <span className="text-gray-600 dark:text-gray-300 mr-1.5 lg:mr-2 xl:mr-3 text-lg">
                        {index + 1}.
                      </span>

                      {/* File type icon */}
                      <div
                        className="
                      text-xl lg:text-2xl mr-0.5"
                      >
                        {(file.mimeType.includes("image/png") ||
                          file.mimeType.includes("image/jpeg")) && (
                          <i className="fas fa-file-image text-cyan-500"></i>
                        )}
                        {file.mimeType.includes("mp4") && (
                          <i className="fas fa-file-video text-indigo-500"></i>
                        )}
                        {file.mimeType.includes("pdf") && (
                          <i className="fas fa-file-pdf text-red-500  "></i>
                        )}
                        {file.mimeType.includes("documentml") && (
                          <i className="fas fa-file-word text-blue-500  "></i>
                        )}
                        {file.mimeType.includes("spreadsheetml") && (
                          <i className="fas fa-file-excel text-green-500  "></i>
                        )}
                        {file.mimeType.includes("presentationml") && (
                          <i className="fas fa-file-powerpoint text-orange-500  "></i>
                        )}
                        {file.mimeType.includes("folder") && (
                          <Image
                            src="/images/folder.svg"
                            alt="File Icon"
                            width={25}
                            height={25}
                          />
                        )}
                      </div>

                      {/* File name */}
                      <h3
                        onClick={() => {
                          file.mimeType.includes("folder") &&
                            router.push(`/drive/${file.id}`);
                        }}
                        className={`${
                          file.mimeType.includes("folder")
                            ? "cursor-pointer"
                            : ""
                        } text-lg text-gray-700 dark:text-gray-300 text-wrap truncate`}
                      >
                        {file.name}
                      </h3>
                    </div>

                    {/* File actions */}
                    {file.webContentLink && (
                      <div className="flex items-center justify-between gap-2 lg:gap-4">
                        <Link
                          href={file.webContentLink}
                          className="flex-1 border-2 border-blue-600 hover:bg-blue-600 transition-colors grid place-items-center text-gray-700 dark:text-gray-200 w-10 h-10 rounded-full cursor-pointer"
                        >
                          <i className="fas fa-download  text-[13px]"></i>
                        </Link>
                        <button
                          onClick={() =>
                            setPreviewId(previewID === file.id ? null : file.id)
                          }
                          className="flex-1 border-2 border-blue-600 hover:bg-blue-600 transition-colors grid place-items-center text-gray-700 dark:text-gray-200 w-10 h-10 rounded-full cursor-pointer"
                        >
                          <i className="fas fa-eye text-[13px]"></i>
                        </button>
                      </div>
                    )}
                  </motion.div>
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
        <div className="fixed top-0 left-0 w-full h-screen bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <button
            onClick={() => setPreviewId(null)}
            className="absolute top-4 lg:top-7 left-3 lg:left-9 size-10 bg-slate-800 rounded-full text-gray-300 text-2xl cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
          <iframe
            src={`https://drive.google.com/file/d/${previewID}/preview`}
            width="100%"
            height="100%"
            allow="autoplay"
            className="rounded-lg shadow-md"
          ></iframe>
        </div>
      )}
    </>
  );
}

{
  /* <div className="flex gap-2">
                      {file.webContentLink ? (
                        <div className="w-full flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-4">
                            <Link
                              href={file.webContentLink}
                              className="flex-1 border-2 border-gray-500 hover:bg-blue-600 transition-colors duration-500 text-gray-700 dark:text-gray-200 px-3 py-2 rounded text-sm font-normal text-center cursor-pointer"
                            >
                              <i className="fas fa-download mr-1"></i>
                              Download
                            </Link>
                            <button
                              onClick={() =>
                                setPreviewId(
                                  previewID === file.id ? null : file.id
                                )
                              }
                              className="flex-1 border-2 border-gray-500 hover:bg-blue-600 transition-colors duration-500 text-gray-700 dark:text-gray-200 px-3 py-2 rounded text-sm font-normal text-center cursor-pointer"
                            >
                              <i className="fas fa-eye mr-1"></i>
                              Preview
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            router.push(`/resources/drive/${file.id}`);
                          }}
                          // href={`/resources/drive/${resolvedParams.id}/${file.id}`}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded text-sm text-center transition-colors"
                        >
                          <i className="fas fa-eye mr-1"></i>
                          View
                        </button>
                      )}
                    </div> */
}
