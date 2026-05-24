import { FaLinkedin, FaGithubSquare } from "react-icons/fa";
import { CiGlobe } from "react-icons/ci";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#282828] dark:bg-[#121212] text-white text-center text-sm p-[10px] sm:p-[20px] w-full bg-[#282828]/90 dark:bg-[#121212]/90 backdrop-blur supports-[backdrop-filter]:bg-[#282828]/70 dark:supports-[backdrop-filter]:bg-[#121212]/70 transition-colors duration-300">
      <div className="flex sm:flex-col justify-center gap-[20px] h-[80px] sm:h-[150px] sm:gap-[10px] items-center">
        <div className="flex gap-[10px] items-center">
          <Link
            href="https://www.linkedin.com/in/muhammad-usama-ijaz-3367532a6"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile (opens in new tab)"
            className="hover:text-[#282828] dark:hover:text-[#4ECDC4] transition-colors duration-300"
          >
            <FaLinkedin
              size={30}
              aria-hidden="true"
              className="text-white dark:text-gray-200 hover:cursor-pointer hover:text-[#282828] dark:hover:text-[#4ECDC4] transition-colors duration-300"
            />
          </Link>
          <Link
            href="https://github.com/PAK048"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile (opens in new tab)"
            className="hover:text-[#282828] dark:hover:text-[#4ECDC4] transition-colors duration-300"
          >
            <FaGithubSquare
              size={30}
              aria-hidden="true"
              className="text-white dark:text-gray-200 hover:cursor-pointer hover:text-[#282828] dark:hover:text-[#4ECDC4] transition-colors duration-300"
            />
          </Link>

          <Link
            href="https://usamaijaz-mern-developer.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Portfolio website (opens in new tab)"
            className="hover:text-[#282828] dark:hover:text-[#4ECDC4] transition-colors duration-300"
          >
            <CiGlobe
              size={30}
              aria-hidden="true"
              className="text-white dark:text-gray-200 hover:cursor-pointer hover:text-[#282828] dark:hover:text-[#4ECDC4] transition-colors duration-300"
            />
          </Link>
        </div>
        <p className="text-xs text-gray-300 dark:text-gray-400 transition-colors duration-300">
          © 2025 SEUN Dev&apos;s, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
