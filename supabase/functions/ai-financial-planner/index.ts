import OpenAI from "npm:openai@^4.0.0";

console.log("AI Financial Planner function loaded");

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

console.log("OpenAI client initialized");
console.log("OpenAI API Key present:", !!Deno.env.get("OPENAI_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  console.log("========== REQUEST RECEIVED ==========");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
  // Handle browser CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log("Parsing request body...");
    const body = await req.json();
    console.log("Request body:", body);
    
    const {
      income,
      currency,
      planningFor,
      goal,
    } = body;

    const numericIncome = Number(income);

    if (!numericIncome || numericIncome <= 0) {
      console.error("Invalid income:", income);
      return new Response(
        JSON.stringify({
          error: "Please provide a valid income amount.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!goal || !String(goal).trim()) {
      console.error("Invalid goal:", goal);
      return new Response(
        JSON.stringify({
          error: "Please provide a financial goal.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const prompt = `
You are BudgetFlow AI, an intelligent personal financial planning assistant.

Your job is to create a realistic financial plan based on exactly what the user requests.

USER INFORMATION:

Available money: ${numericIncome} ${currency}
Planning period: ${planningFor}
User request: "${goal}"

IMPORTANT RULES:

1. Carefully understand exactly what the user is asking for.

2. Do NOT automatically create categories that the user did not request.

3. If the user says:
"Budget only for food, transport and savings"

Return ONLY:
- Food
- Transport
- Savings

Do not add bills, shopping, entertainment, health, investment, or any other category unless necessary or explicitly requested.

4. If the user specifies an amount for a category, respect that amount where financially possible.

5. The total amount allocated across all categories MUST equal the available money.

6. Never allocate more than the available money.

7. If the user's requested allocations exceed their available money, create the most reasonable alternative plan and explain the issue in the summary.

8. Use realistic amounts.

9. Categories can be dynamic. You are not limited to a fixed list.

10. Examples of valid categories include:
Food
Transport
Savings
Emergency Fund
Rent
Bills
Investment
Business
Education
Wedding
Debt Repayment
Shopping
Healthcare
Personal Care

But only include categories that are relevant to the user's request.

11. Return ONLY valid JSON.

Use exactly this structure:

{
  "summary": "Short explanation of the financial plan.",
  "categories": [
    {
      "name": "Category Name",
      "amount": 100000,
      "description": "Short explanation of this allocation."
    }
  ]
}
`;

    console.log("Creating OpenAI completion request...");
    console.log("Model: gpt-4o-mini");
    console.log("Temperature: 0.4");
    
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an intelligent financial planning assistant. Always respond with ONLY valid JSON in this exact format: {\"summary\": \"...\", \"categories\": [{\"name\": \"...\", \"amount\": 0, \"description\": \"...\"}]}",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
      });
      console.log("OpenAI completion successful");
    } catch (openaiError) {
      console.error("OpenAI API call failed!");
      console.error("Error:", openaiError);
      throw new Error(`OpenAI API Error: ${openaiError instanceof Error ? openaiError.message : String(openaiError)}`);
    }

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      console.error("OpenAI returned empty content");
      throw new Error("The AI did not return a financial plan.");
    }

    console.log("OpenAI raw response:", content);

    let aiPlan;
    try {
      aiPlan = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Content that failed to parse:", content);
      throw new Error("The AI returned invalid JSON.");
    }

    if (
      !aiPlan.categories ||
      !Array.isArray(aiPlan.categories)
    ) {
      console.error("Invalid plan structure:", aiPlan);
      throw new Error("Invalid AI plan format.");
    }

    // Clean and validate AI categories
    const categories = aiPlan.categories
      .map((category: any, index: number) => ({
        id: `ai-category-${Date.now()}-${index}`,
        name: String(category.name || "Other").trim(),
        amount: Math.round(Number(category.amount || 0)),
        description: String(category.description || "").trim(),
      }))
      .filter(
        (category: any) =>
          category.name &&
          category.amount > 0,
      );

    if (categories.length === 0) {
      throw new Error(
        "The AI could not create a valid financial plan.",
      );
    }

    const totalAllocated = categories.reduce(
      (total: number, category: any) =>
        total + category.amount,
      0,
    );

    return new Response(
      JSON.stringify({
        income: numericIncome,
        summary:
          aiPlan.summary ||
          "Your personalised financial plan is ready.",
        categories,
        totalAllocated,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("==================== ERROR ====================");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "N/A");
    console.error("Full error object:", error);
    console.error("=============================================");

    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Unable to generate financial plan.";

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});