import { useState } from "react";
import { HelpCircle, ChevronDown, Mail } from "lucide-react";

const faqs = [
  {
    question: "How do budgets work?",
    answer:
      "Create a monthly budget for a category (like Food or Transport) with a set amount. As you log expenses in that category, BudgetFlow tracks how much you've spent and how much remains for the current budget period.",
  },
  {
    question: "How do expenses work?",
    answer:
      "Add an expense from the Dashboard by choosing a category, entering a description of what you spent it on, the amount, and the date. Expenses are matched against your budgets for that category and month.",
  },
  {
    question: "How do goals work?",
    answer:
      "Goals let you set a savings target and track contributions over time. Add money to a goal whenever you save, and BudgetFlow shows your progress toward the target amount.",
  },
  {
    question: "How does AI Planner work?",
    answer:
      "Tell the AI Planner how much money you have and what you want to achieve. It generates a suggested plan across spending categories and savings, which you can edit and apply to create real budgets and goals.",
  },
];

function Help() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <HelpCircle size={26} />
        </div>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Help & Support
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Answers to common questions about using BudgetFlow.
        </p>
      </div>

      <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-md">
        {faqs.map((faq, index) => (
          <div key={faq.question} className="p-5">
            <button
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="font-semibold text-slate-900">
                {faq.question}
              </span>

              <ChevronDown
                size={20}
                className={`shrink-0 text-slate-400 transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>

            {openIndex === index && (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {faq.answer}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
        <div className="flex items-center gap-3">
          <Mail size={20} className="text-indigo-600" />
          <p className="font-semibold text-indigo-900">Still need help?</p>
        </div>

        <p className="mt-2 text-sm text-indigo-700">
          Reach out to us at{" "}
          <a
            href="mailto:deetek@gmail.com"
            className="font-medium underline"
          >
            deetek@gmail.com
          </a>{" "}
          and we'll get back to you as soon as possible.
        </p>
      </div>
    </section>
  );
}

export default Help;
