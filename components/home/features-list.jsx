import { AnimatedCounter } from "./animated-counter";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ibmPlexSans } from "@/app/ui/fonts";

// Server component for static content
export function FeaturesList() {
  return (
    <Card className={`${ibmPlexSans.className} w-full max-w-2xl mx-auto my-8 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
                Key Features
              </span>
            </h1>
          </div>
          
          <ul className="space-y-4 w-full max-w-md">
            <li className="flex items-center space-x-3 rtl:space-x-reverse">
              <FontAwesomeIcon 
                icon={faCheck} 
                className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" 
              />
              <span className="text-gray-700 dark:text-gray-300">Access all materials from one place</span>
            </li>

            <li className="flex items-center space-x-3 rtl:space-x-reverse">
              <FontAwesomeIcon 
                icon={faCheck} 
                className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" 
              />
              <span className="text-gray-700 dark:text-gray-300">Code Library to showcase your creativity</span>
            </li>

            <li className="flex items-center space-x-3 rtl:space-x-reverse">
              <FontAwesomeIcon 
                icon={faCheck} 
                className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" 
              />
              <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Available PDF files:{" "}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
                  <AnimatedCounter target={25} suffix="+" duration={4000} />
                </div>
              </span>
            </li>

            <li className="flex items-center space-x-3 rtl:space-x-reverse">
              <FontAwesomeIcon 
                icon={faCheck} 
                className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" 
              />
              <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Code snippets:{" "}
                <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-4 py-2 rounded-full shadow-lg">
                  <AnimatedCounter target={50} suffix="+" duration={4000} />
                </div>
              </span>
            </li>

            <li className="flex items-center space-x-3 rtl:space-x-reverse">
              <FontAwesomeIcon 
                icon={faCheck} 
                className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" 
              />
              <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Alumni:{" "}
                <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-full shadow-lg">
                  <AnimatedCounter target={150} suffix="+" duration={4000} />
                </div>
              </span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
