import Image from "next/image";
import Link from "next/link";

import { inter } from "@/app/ui/fonts";

export function FooterComponent() {
  return (
    <footer
      data-testid="flowbite-footer"
      className={`${inter.className} morphic-effect bg-morphic-light bg-[#ffffffe6] dark:bg-[#071a26] rounded-t-lg shadow-sm md:flex md:items-center md:justify-between w-full p-6 lg:px-14 lg:py-6 `}
    >
      <div className={`w-full `}>
        <div
          className={`grid w-full justify-between sm:flex sm:justify-between md:flex md:grid-cols-1 `}
        >
          <div
            className={`flex items-center justify-center sm:justify-start pb-6 lg:pb-0`}
          >
            <Image
              src={"/images/lg/ruet.png"}
              alt="ruet logo"
              width={70}
              height={70}
              className="mr-4"
            />
            <Image
              src={"/images/logo.png"}
              alt="logo"
              width={120}
              height={120}
            />
          </div>
          <div
            className={`grid grid-cols-2 gap-8 sm:mt-4 sm:grid-cols-3 sm:gap-6 `}
          >
            <div>
              <h2
                data-testid="flowbite-footer-title"
                className={`mb-6 text-md tracking-wide font-semibold uppercase text-gray-600 dark:text-gray-200 `}
              >
                about
              </h2>
              <ul
                data-testid="footer-groupLink"
                className={`flex flex-wrap text-sm text-gray-600 dark:text-gray-200 flex-col space-y-4 `}
              >
                <li className={`me-4 last:mr-0 md:mr-6 `}>
                  <Link
                    href="https://www.ruet.ac.bd/"
                    target="_blank"
                    className={`hover:underline `}
                  >
                    RUET
                  </Link>
                </li>
                <li className={`me-4 last:mr-0 md:mr-6 `}>
                  <Link
                    href="https://www.cse.ruet.ac.bd/"
                    target="_blank"
                    className={`hover:underline `}
                  >
                    RUET CSE
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2
                data-testid="flowbite-footer-title"
                className={`mb-6 text-md tracking-wide font-semibold uppercase text-gray-600 dark:text-gray-200 `}
              >
                Follow us
              </h2>
              <ul
                data-testid="footer-groupLink"
                className={`flex flex-wrap text-sm text-gray-600 dark:text-gray-200 flex-col space-y-4 `}
              >
                <li className={`me-4 last:mr-0 md:mr-6 `}>
                  <Link
                    href="https://www.facebook.com/RUETOfficial/"
                    className={`hover:underline `}
                    target="_blank"
                  >
                    Facebook
                  </Link>
                </li>
                <li className={`me-4 last:mr-0 md:mr-6 `}>
                  <Link href="#" className={`hover:underline `}>
                    Discord
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2
                data-testid="flowbite-footer-title"
                className={`mb-6 text-md tracking-wide font-semibold uppercase text-gray-600 dark:text-gray-200 `}
              >
                Legal
              </h2>
              <ul
                data-testid="footer-groupLink"
                className={`flex flex-wrap text-sm text-gray-600 dark:text-gray-200 flex-col space-y-4 `}
              >
                <li className={`me-4 last:mr-0 md:mr-6 `}>
                  <Link href="#" className={`hover:underline `}>
                    Privacy Policy
                  </Link>
                </li>
                <li className={`me-4 last:mr-0 md:mr-6 `}>
                  <Link href="#" className={`hover:underline `}>
                    Terms &amp; Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr
          data-testid="footer-divider"
          className={`my-6 w-full border-gray-700 dark:border-gray-200 sm:mx-auto lg:my-8 `}
        ></hr>
        <div className={`w-full text-center`}>
          <div
            data-testid="flowbite-footer-copyright"
            className={`text-sm text-gray-600 dark:text-gray-200 sm:text-center `}
          >
            ©2025
            <Link
              href="/contact&help/developers"
              className={`ml-1 hover:underline `}
            >
              Avengers (sec c)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
