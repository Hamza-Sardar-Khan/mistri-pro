export default function AppFooter({ className }: { className?: string }) {
  const footerClassName = ["border-t border-gray-200 bg-white", className]
    .filter(Boolean)
    .join(" ");

  return (
    <footer className={footerClassName}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-4 py-6 text-xs text-[#97a4b3]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0d7cf2]">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[#0d7cf2]">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            MISTRI PRO
          </div>
          <span>&copy; {new Date().getFullYear()} MISTRI PRO. All rights reserved.</span>
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
