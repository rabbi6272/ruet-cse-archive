const LibraryHeader = () => {
  return (
    <div className="mb-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-nowrap">
          <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
            Code Snippts Gallary
          </span>
        </h1>
        <p className="text-md font-normal text-gray-500 lg:text-xl dark:text-gray-400 max-w-3xl mx-auto">
          Browse and share useful code snippets. We do not showcase any kind of
          AI-generated content here. Feel free to use any code you like, but
          please give credit to the original author. Happy coding!
        </p>
      </div>
    </div>
  );
};

export default LibraryHeader;
