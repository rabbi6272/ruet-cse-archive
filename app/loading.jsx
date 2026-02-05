export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-lg text-gray-800 dark:text-gray-300">
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            display: "inline-block",
            position: "relative",
            background:
              "linear-gradient(0deg, rgba(0, 140, 255, 0.2) 33%, #0084ff 100%)",
            boxSizing: "border-box",
            animation: "rotation 1s linear infinite",
          }}
        >
          <div
            className="bg-[#fff] dark:bg-[#263238]"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              boxSizing: "border-box",
            }}
          ></div>
        </div>
        <style>{`
                    @keyframes rotation {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
      </div>
    </div>
  );
}
