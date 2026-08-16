// Supabase Edge Function: analyzes a meal photo with OpenAI's vision API
// and returns structured food-item data (name, estimated quantity,
// calories, macros) matching the app's RecognizedFoodItem[] shape.
//
// Deploy:
//   supabase functions deploy analyze-meal
// Secret (required before it will work):
//   supabase secrets set OPENAI_API_KEY=sk-...
//
// Request body:  { image: string (base64, no data: prefix), mimeType?: string }
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
          "alternativeMatches",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. You will be shown a photo of a meal.

Identify each visually distinct food item on the plate, estimate its quantity with a realistic unit (grams for solid foods, ml for liquids, or a count like "piece"/"slice" for discrete items), and estimate its calories, protein, carbs, and fat in grams based on that portion size.

Rules:
- List each visually distinct food item separately — don't lump the whole plate into one item.
- Be a careful, conservative estimator, using typical reference nutrition values for the identified food scaled to your estimated portion size.
- "confidence" is your 0-1 confidence in the food identification itself, not the nutrition estimate.
- For each item, you may include up to 3 "alternativeMatches" — other plausible identifications if you're not fully certain (e.g. "Grilled chicken thigh" as an alternative to "Grilled chicken breast"). Use null if none.
- If you cannot identify any food in the image, return an empty items array.
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
  try {
    const body = await req.json();
    image = body.image;
    mimeType = body.mimeType;
  } catch {
    return new Response(JSON.stringify({ error: "Request body must be JSON." }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  if (typeof image !== "string" || image.length === 0) {
    return new Response(
      JSON.stringify({ error: "Missing 'image' (base64 string) in request body." }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const dataUrl = `data:${typeof mimeType === "string" ? mimeType : "image/jpeg"};base64,${image}`;

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
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this meal photo." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
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
      return new Response(JSON.stringify({ error: "Vision analysis failed." }), {
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
    return new Response(JSON.stringify({ error: "Unexpected error analyzing photo." }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});
