function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-5">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-sm text-slate-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} BudgetFlow
        </p>

        <p>
          Created with ❤️ by{" "}
          <span className="font-semibold text-indigo-600">
            DeeTek
          </span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;