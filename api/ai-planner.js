import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const {
      income,
      goal,
      planningFor = "Monthly",
      currency = "NGN",
    } = req.body || {};

    // -----------------------------
    // VALIDATION
    // -----------------------------

    const amount = Number(income);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Please provide a valid income amount.",
      });
    }

    if (!goal || typeof goal !== "string" || !goal.trim()) {
      return res.status(400).json({
        error: "Please provide a financial goal.",
      });
    }

    // -----------------------------
    // AI PROMPT
    // -----------------------------

    const systemPrompt = `
You are BudgetFlow AI, a practical personal financial planning assistant.

Your job is to create realistic financial plans from a user's available income and financial goals.

Important rules:

1. Do not blindly use the 50/30/20 rule.
2. Consider the user's stated goals.
3. Prioritize essential expenses.
4. Include savings when appropriate.
5. Include investments only when financially reasonable.
6. Include an emergency/flexible allocation when possible.
7. Never allocate more money than the user's available income.
8. The total of all allocations MUST equal the user's income.
9. Give practical recommendations rather than generic financial advice.
10. Use the currency supplied by the user.
11. Return ONLY valid JSON.
12. Do not include markdown.
13. Do not include currency symbols inside numeric values.

Return this exact structure:

{
  "summary": "short explanation",
  "categories": [
    {
      "name": "Essentials",
      "amount": 0,
      "percentage": 0,
      "description": "short explanation"
    },
    {
      "name": "Savings",
      "amount": 0,
      "percentage": 0,
      "description": "short explanation"
    },
    {
      "name": "Investment",
      "amount": 0,
      "percentage": 0,
      "description": "short explanation"
    },
    {
      "name": "Personal",
      "amount": 0,
      "percentage": 0,
      "description": "short explanation"
    },
    {
      "name": "Emergency Fund",
      "amount": 0,
      "percentage": 0,
      "description": "short explanation"
    }
  ]
}

You may adjust the categories if the user's situation requires it, but keep the response simple and actionable.
`;

    const userPrompt = `
Available income: ${amount}
Currency: ${currency}
Planning period: ${planningFor}

User's financial goal:
${goal}
`;

    // -----------------------------
    // CALL AI
    // -----------------------------

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      temperature: 0.4,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content =
      completion.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({
        error: "The AI did not return a plan.",
      });
    }

    const plan = JSON.parse(content);

    // -----------------------------
    // BASIC SAFETY VALIDATION
    // -----------------------------

    if (!Array.isArray(plan.categories)) {
      return res.status(500).json({
        error: "Invalid AI response.",
      });
    }

    const total = plan.categories.reduce(
      (sum, category) =>
        sum + Number(category.amount || 0),
      0,
    );

    // Allow tiny floating-point differences
    if (Math.abs(total - amount) > 1) {
      return res.status(500).json({
        error: "The AI generated an invalid financial allocation.",
      });
    }

    return res.status(200).json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("AI Planner error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Failed to generate financial plan.",
    });
  }
}