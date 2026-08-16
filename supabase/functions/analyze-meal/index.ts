// Supabase Edge Function: analyzes a meal photo — or a typed/spoken
// description, as a fallback when a photo isn't practical — with
// OpenAI's vision API and returns structured food-item data (name,
// estimated quantity, calories, macros) matching the app's
// RecognizedFoodItem[] shape.
//
// Deploy:
//   supabase functions deploy analyze-meal
// Secret (required before it will work):
//   supabase secrets set OPENAI_API_KEY=sk-...
//
// Request body (exactly one of image or text):
//   { image: string (base64, no data: prefix), mimeType?: string }
//   { text: string }
// Response body: { items: RecognizedFoodItem[] }

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = "gpt-4o-mini";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JSON_HEADERS = { ...CORS_HEADERS, "Content-Type": "application/json" };

// OpenAI's strict structured-output mode requires every property in
// "properties" to also appear in "required" — optional fields are
// represented as nullable types instead.
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          confidence: { type: "number" },
          estimatedQuantity: { type: "number" },
          unit: { type: "string" },
          calories: { type: "number" },
          proteinG: { type: "number" },
          carbsG: { type: "number" },
          fatG: { type: "number" },
          fiberG: { type: ["number", "null"] },
          sugarG: { type: ["number", "null"] },
          sodiumMg: { type: ["number", "null"] },
          alternativeMatches: { type: ["array", "null"], items: { type: "string" } },
        },
        required: [
          "name",
          "confidence",
          "estimatedQuantity",
          "unit",
          "calories",
          "proteinG",
          "carbsG",
          "fatG",
          "fiberG",
          "sugarG",
          "sodiumMg",
          "alternativeMatches",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

const VISION_SYSTEM_PROMPT = `You are a nutrition estimation assistant. You will be shown a photo of a meal.

Identify each visually distinct food item on the plate, estimate its quantity with a realistic unit (grams for solid foods, ml for liquids, or a count like "piece"/"slice" for discrete items), and estimate its calories, protein, carbs, fat, fiber, sugar, and sodium based on that portion size.

Rules:
- List each visually distinct food item separately — don't lump the whole plate into one item.
- Be a careful, conservative estimator, using typical reference nutrition values for the identified food scaled to your estimated portion size.
- "confidence" is your 0-1 confidence in the food identification itself, not the nutrition estimate.
- fiberG and sugarG are grams; sodiumMg is milligrams. Use null for any of these three you can't reasonably estimate — don't guess wildly.
- For each item, you may include up to 3 "alternativeMatches" — other plausible identifications if you're not fully certain (e.g. "Grilled chicken thigh" as an alternative to "Grilled chicken breast"). Use null if none.
- If you cannot identify any food in the image, return an empty items array.
- Return only the structured data — no free text.`;

const TEXT_SYSTEM_PROMPT = `You are a nutrition estimation assistant. The user will describe a meal in their own words instead of showing a photo — this is a fallback for when a photo isn't practical, so treat their description as authoritative about what's present.

Identify each distinct food item they mention or clearly imply, estimate its quantity with a realistic unit (grams for solid foods, ml for liquids, or a count like "piece"/"slice" for discrete items) — inferring a typical portion size when they don't give one — and estimate its calories, protein, carbs, fat, fiber, sugar, and sodium based on that portion size.

Rules:
- List each distinct food item separately — don't lump the whole meal into one item.
- Be a careful, conservative estimator, using typical reference nutrition values for the identified food scaled to your estimated portion size.
- "confidence" is your 0-1 confidence in the food identification itself, not the nutrition estimate — descriptions are usually unambiguous, so this will typically be high unless the wording is vague.
- fiberG and sugarG are grams; sodiumMg is milligrams. Use null for any of these three you can't reasonably estimate — don't guess wildly.
- For each item, you may include up to 3 "alternativeMatches" — other plausible identifications if the wording is ambiguous (e.g. "Grilled chicken thigh" as an alternative to "Grilled chicken breast" if they just said "chicken"). Use null if none.
- If the description doesn't mention any identifiable food, return an empty items array.
- Return only the structured data — no free text.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY is not configured on the server." }),
      { status: 500, headers: JSON_HEADERS }
    );
  }

  let image: unknown;
  let mimeType: unknown;
  let text: unknown;
  try {
    const body = await req.json();
    image = body.image;
    mimeType = body.mimeType;
    text = body.text;
  } catch {
    return new Response(JSON.stringify({ error: "Request body must be JSON." }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const hasImage = typeof image === "string" && image.length > 0;
  const hasText = typeof text === "string" && text.trim().length > 0;

  if (!hasImage && !hasText) {
    return new Response(
      JSON.stringify({
        error: "Provide either 'image' (base64) or 'text' in the request body.",
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const systemPrompt = hasImage ? VISION_SYSTEM_PROMPT : TEXT_SYSTEM_PROMPT;
  const userContent = hasImage
    ? [
        { type: "text", text: "Analyze this meal photo." },
        {
          type: "image_url",
          image_url: {
            url: `data:${typeof mimeType === "string" ? mimeType : "image/jpeg"};base64,${image}`,
          },
        },
      ]
    : [{ type: "text", text: `Meal description: ${text}` }];

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "meal_analysis", strict: true, schema: RESPONSE_SCHEMA },
        },
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Analysis failed." }), {
        status: 502,
        headers: JSON_HEADERS,
      });
    }

    const completion = await openaiResponse.json();
    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: "No analysis returned." }), {
        status: 502,
        headers: JSON_HEADERS,
      });
    }

    const parsed = JSON.parse(content);
    return new Response(JSON.stringify({ items: parsed.items ?? [] }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (err) {
    console.error("analyze-meal error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error during analysis." }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});
