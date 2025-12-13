import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ibmPlexSans } from "@/app/ui/fonts";

export function FooterComponent() {
  return (
    <footer className={`${ibmPlexSans.className} w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700`}>
      <Card className="rounded-none border-0 bg-transparent">
        <CardContent className="p-2 lg:px-4 lg:py-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo Section */}
            <div className="flex items-center space-x-2">
              <Image
                src="/images/lg/ruet.png"
                alt="RUET logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <Image
                src="/images/logo.png"
                alt="CSE Archive logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>

            {/* About Section */}
            <div className="flex items-center gap-4">
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href="https://www.ruet.ac.bd/" target="_blank">
                  RUET
                </Link>
              </Button>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href="https://www.cse.ruet.ac.bd/" target="_blank">
                  RUET CSE
                </Link>
              </Button>
            </div>

            {/* Copyright */}
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2025{" "}
                <Button variant="link" size="sm" className="h-auto p-0 text-sm" asChild>
                  <Link href="/contact/developers">
                    Avengers - CSE'24
                  </Link>
                </Button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </footer>
  );
}
