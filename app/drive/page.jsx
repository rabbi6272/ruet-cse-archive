"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { lato } from "@/app/ui/fonts";
import { getRootFolderId } from "@/lib/drive-config";
import Loading from "../loading";

export default function DrivePage() {
  const [rootFolders, setRootFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRootFolders = async () => {
      try {
        setLoading(true);
        const rootFolderId = getRootFolderId();

        if (!rootFolderId || rootFolderId === "your-root-folder-id-here") {
          throw new Error(
            "Please configure your Google Drive root folder ID in lib/drive-config.js"
          );
        }

        const response = await fetch(`/api/drive/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folderId: rootFolderId }),
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

        // Filter only folders for the main drive page
        const folders =
          data.files?.filter(
            (file) => file.mimeType === "application/vnd.google-apps.folder"
          ) || [];

        setRootFolders(folders);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching root folders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRootFolders();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Please make sure you have configured your Google Drive API
            credentials and updated the root folder ID in this component.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <br />
      <br />
      <div className={lato.className + " px-4 lg:px-6"}>
        <div className="bg-[#ffffff78] dark:bg-gray-900 px-4 lg:px-6 py-8 rounded-lg shadow-md">
          <div className="mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    <i className="fas fa-home mr-1"></i>
                    Drive
                  </span>
                </li>
              </ol>
            </nav>

            <h1 className="text-3xl text-center font-bold mb-6 text-gray-700 dark:text-gray-300">
              Drive Folders
            </h1>

            {rootFolders.length === 0 ? (
              <p className="text-2xl text-center text-gray-700 dark:text-gray-300">
                No folders found in the root directory.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {rootFolders.map((folder, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    key={folder.id}
                    className="p-4 rounded-lg"
                  >
                    <Link href={`/drive/${folder.id}`}>
                      <div className="flex flex-col items-center gap-1 hover:scale-105 transition-transform duration-300 cursor-pointer">
                        {/* Folder icon */}
                        <div className="text-6xl">
                          <Image
                            src="/images/folder.svg"
                            alt="Folder Icon"
                            width={80}
                            height={80}
                          />
                        </div>

                        <div className="text-center">
                          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-wrap truncate">
                            {folder.name}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <br />
      <br />
    </>
  );
}
