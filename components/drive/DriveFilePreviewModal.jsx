export function DriveFilePreviewModal({ previewID, handleClosePreview }) {
  return (
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
  );
}
