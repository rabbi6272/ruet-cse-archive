import Link from "next/link";
import { AnimatedCards } from "./animated-cards";

// Server component for static content
export function FAQSection() {
  const cards = [
    {
      icon: "fa-solid fa-file-pdf",
      title: "How will this site be beneficial?",
      content: (
        <>
          <p>
            No more wasting time searching for PDFs or videos. We bring all your
            essential study materials together in one place to keep you focused
            and curious.
          </p>
          <p>
            Explore the{" "}
            <Link
              href="/shelf"
              className="text-blue-600 dark:text-blue-500 hover:underline"
            >
              Book Shelf
            </Link>{" "}
            for additional resources.
          </p>
        </>
      ),
    },
    {
      icon: "fa-solid fa-file-code",
      title: "How will the Code Library help you?",
      content: (
        <>
          <p>
            It will spark your curiosity to learn something new and inspire the
            creativity to build something unique that stands out from the crowd.
          </p>
          <p>
            Explore the{" "}
            <Link
              href="/codelibrary"
              className="text-blue-600 dark:text-blue-500 hover:underline"
            >
              Code Library
            </Link>{" "}
            – where learners debug and grow together.
          </p>
        </>
      ),
    },
    {
      icon: "fa-solid fa-paper-plane",
      title: "Want to suggest a feature or ask something?",
      content: (
        <p>
          Got a feature idea or a question? We're always here to help. Your
          feedback helps us improve, so don't hesitate to reach out anytime!
        </p>
      ),
    },
  ];

  return (
    <div className="w-full xl:w-[80%] 2xl:w-[70%] mx-auto text-center">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold">
        <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
          But Why this?
        </span>
      </h1>
      <p className="text-md font-normal text-gray-500 lg:text-xl dark:text-gray-400">
        Let's answer some FAQs.
      </p>
      <br />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto">
        {cards.map((card, index) => (
          <AnimatedCards key={card.title} index={index}>
            <div className="p-4">
              <i
                className={`${card.icon} pb-4 text-5xl text-gray-700 dark:text-gray-300`}
              ></i>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {card.title}
              </h3>
              <div className="text-gray-500 dark:text-gray-400 space-y-2">
                {card.content}
              </div>
            </div>
          </AnimatedCards>
        ))}
      </div>
    </div>
  );
}
