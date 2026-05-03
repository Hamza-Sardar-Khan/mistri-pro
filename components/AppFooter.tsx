import Image from "next/image";

export default function AppFooter({ className }: { className?: string }) {
  const footerClassName = ["border-t border-gray-200 bg-white", className]
    .filter(Boolean)
    .join(" ");

  return (
    <footer className={footerClassName}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-4 py-6 text-xs text-[#97a4b3]">
        <div className="flex flex-col gap-2">
          <Image
            src="/logo.png"
            alt="Mistri Pro"
            width={70}
            height={36}
            objectFit="contain"
            className="h-8 w-auto scale-400 2xl:scale-600 object-contain"
          />
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button className="hover:text-[#0d7cf2]">Help Center</button>
          <button className="hover:text-[#0d7cf2]">Terms of Service</button>
          <button className="hover:text-[#0d7cf2]">Privacy Policy</button>
          <button className="hover:text-[#0d7cf2]">Contact Us</button>
        </div>
      </div>
    </footer>
  );
}
