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

      <div className={lato.className + " px-4 lg:px-6"}>
        <div className="bg-[#ffffff78] dark:bg-gray-900 px-4 lg:px-6 py-8 rounded-lg shadow-md">
          <div className="mx-auto ">
            {/* Breadcrumb Navigation */}
            {breadcrumb.length > 0 && (
              <nav
                className="mb-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                aria-label="Breadcrumb"
              >
                <ol className="flex items-center flex-wrap space-x-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <Link
                      href="/drive"
                      className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <i className="fas fa-home mr-1"></i>
                      Drive
                    </Link>
                  </li>
                  {breadcrumb.map((folder, index) => (
                    <li key={folder.id} className="flex items-center">
                      <i className="fas fa-chevron-right mx-1 text-gray-400 text-xs"></i>
                      {index === breadcrumb.length - 1 ? (
                        <span className="font-medium text-gray-900 dark:text-gray-100 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                          <i className="fas fa-folder mr-1 text-blue-600 dark:text-blue-400"></i>
                          {folder.name}
                        </span>
                      ) : (
                        <Link
                          href={`/drive/${folder.id}`}
                          className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((file, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    key={file.id}
                    className="p-4 rounded-lg"

                    // className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {/* File type icon */}
                      <div
                        className="cursor-pointer text-6xl"
                        onClick={() => {
                          !file.mimeType.includes("mp4") &&
                            !file.mimeType.includes("image/png") &&
                            !file.mimeType.includes("image/jpeg") &&
                            !file.mimeType.includes("pdf") &&
                            !file.mimeType.includes("document") &&
                            !file.mimeType.includes("spreadsheet") &&
                            !file.mimeType.includes("presentation") &&
                            router.push(`/drive/${file.id}`);
                        }}
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
                        {file.mimeType.includes("document") && (
                          <i className="fas fa-file-word text-blue-500  "></i>
                        )}
                        {file.mimeType.includes("spreadsheet") && (
                          <i className="fas fa-file-excel text-green-500  "></i>
                        )}
                        {file.mimeType.includes("presentation") && (
                          <i className="fas fa-file-powerpoint text-orange-500  "></i>
                        )}
                        {!file.mimeType.includes("mp4") &&
                          !file.mimeType.includes("image/png") &&
                          !file.mimeType.includes("image/jpeg") &&
                          !file.mimeType.includes("pdf") &&
                          !file.mimeType.includes("document") &&
                          !file.mimeType.includes("spreadsheet") &&
                          !file.mimeType.includes("presentation") && (
                            // <i className="fas fa-folder text-gray-500 "></i>
                            <Image
                              src="/images/folder.svg"
                              alt="File Icon"
                              width={80}
                              height={80}
                            />
                          )}
                      </div>

                      <div className="">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-wrap truncate">
                          {file.name}
                        </h3>
                      </div>
                    </div>

                    {file.webContentLink && (
                      <div className="mt-2 w-full">
                        <div className="flex items-center justify-between gap-4">
                          <Link
                            href={file.webContentLink}
                            className="flex-1 border-2 border-gray-500 hover:scale-95 active:scale-95 transition-transform duration-300 text-gray-700 dark:text-gray-200 px-1 py-1 rounded-md text-center cursor-pointer"
                          >
                            <i className="fas fa-download mr-1 text-xs font-medium"></i>
                            Download
                          </Link>
                          <button
                            onClick={() =>
                              setPreviewId(
                                previewID === file.id ? null : file.id
                              )
                            }
                            className="flex-1 border-2 border-gray-500 hover:scale-95 active:scale-95 transition-transform duration-300 text-gray-700 dark:text-gray-200 px-1 py-1 rounded-md text-center cursor-pointer"
                          >
                            <i className="fas fa-eye mr-1 text-xs font-medium"></i>
                            {file.mimeType.includes("mp4") ? "Play" : "Preview"}
                          </button>
                        </div>
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
