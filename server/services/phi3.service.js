const { Ollama } = require("ollama");
const client = new Ollama();

async function getDoctorSpecialties(userQuery) {
  const prompt = `
You are an advanced medical triage assistant.

Task:
Given a user's complex health-related query, return ONLY the relevant doctor specialties with additional constraints for each condition mentioned in their symptoms or history. Include at least three different conditions and two related subspecialists if necessary.

The JSON must be exactly like this format:
{
  "conditions": [
    {
      "conditionName": "Condition1",
      "primarySpecialty": ["PrimarySpecialty"],
      "relatedSubspecialties": ["RelatedSubspecialty1", "RelatedSubspecialty2"]
    }
  ]
}

- Do NOT diagnose diseases.
- DO NOT give medical advice or suggest treatments.
- RETURN STRICT JSON ONLY, NO MARKDOWN, NO BACKTICKS, NO EXTRA CHARACTERS.
- Include "General Physician" as a default if no conditions are mentioned that clearly point to specific specialties.

User query:
${userQuery}
`;

  const response = await client.chat({
    model: "phi3:mini",
    messages: [{ role: "user", content: prompt }],
    options: {
      temperature: 0
    }
  });

  let content = response.message.content;

  // Strip markdown backticks if present
  content = content.replace(/```(json)?/g, "").trim();

  // Extract the first JSON object (everything from first { to the matching })
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No valid JSON found in AI response");
  }

  // Parse only the JSON part
  return JSON.parse(match[0]);
}

module.exports = { getDoctorSpecialties };
