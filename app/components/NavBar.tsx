

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <a href="#" className="text-lg font-bold text-slate-900">
          Word Dictionary
        </a>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
          <a href="#find-word" className="hover:text-sky-700">
            Find a word
          </a>
          <a href="#saved-words" className="hover:text-sky-700">
            Saved words
          </a>
        </div>
      </div>
    </nav>
  );
}