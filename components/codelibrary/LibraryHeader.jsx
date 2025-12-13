import { Card, CardContent } from "@/components/ui/card";
import { ibmPlexSans } from "@/app/ui/fonts";

export function CodeLibraryHeader() {
  return (
    <div className={`${ibmPlexSans.className} mb-4`}>
      <Card className="border-0 bg-transparent">
        <CardContent className="text-center p-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
              Code Snippets Gallery
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Browse and share useful code snippets. We do not showcase any kind of
            AI-generated content here. Feel free to use any code you like, but
            please give credit to the original author. Happy coding!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
