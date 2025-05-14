"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md px-6 py-3 ">
      <div className="flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          🚀 SH2 Part change report
        </Link>

        {/* Hamburger Icon */}
        <button
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-4">
          {status === "loading" ? (
            <div className="text-gray-500">Loading...</div>
          ) : session?.user ? (
            <>
              <div className="flex items-center space-x-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt="User"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="text-gray-800">{session.user.name}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="bg-blue-500 text-white px-4 py-1.5 rounded hover:bg-blue-600"
            >
              เข้าสู่ระบบด้วย Google
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 space-y-2">
          {status === "loading" ? (
            <div className="text-gray-500">Loading...</div>
          ) : session?.user ? (
            <>
              <div className="flex items-center space-x-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt="User"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="text-gray-800">{session.user.name}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              เข้าสู่ระบบด้วย Google
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
