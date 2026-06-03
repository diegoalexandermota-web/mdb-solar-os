import { createFileRoute } from "@tanstack/react-router";

type RequestBody = {
  imageBase64?: string | null; // data URL or raw base64
  imageMime?: string | null;
  address?: string | null;
  panelCount?: number | null;
  notes?: string | null;
  viewType?: "house" | "roof" | "satellite" | "drone" | null;
};

function stripDataUrl(input: string): { mime: string; b64: string } {
  const m = input.match(/^data:([^;]+);base64,(.*)$/);
  if (m) return { mime: m[1], b64: m[2] };
  return { mime: "image/png", b64: input };
}

export const Route = createFileRoute("/api/visual-solar-preview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body: RequestBody;
        try {
          body = (await request.json()) as RequestBody;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const panelCount = body.panelCount && body.panelCount > 0 ? Math.min(80, Math.round(body.panelCount)) : 20;
        const viewType = body.viewType ?? (body.imageBase64 ? "house" : "satellite");

        const stylePrompt = [
          `Add a preliminary visual mockup of a modern residential solar panel array onto this ${viewType} image.`,
          `Place approximately ${panelCount} sleek black monocrystalline solar panels in clean, aligned rectangular rows on the most suitable south-facing roof planes.`,
          `Maintain realistic perspective, lighting, shadows, and reflections that match the original photo.`,
          `Keep the rest of the house, surroundings, sky, and trees completely unchanged.`,
          `Leave appropriate setbacks from roof edges. Avoid chimneys, vents, and obstructions.`,
          `Render the panels as a clean, modern, professional solar visualization suitable for a sales preview.`,
          body.address ? `Property: ${body.address}.` : "",
          body.notes ? `Notes: ${body.notes}.` : "",
          `This is a preliminary sales visualization, not a final engineering layout.`,
        ].filter(Boolean).join(" ");

        let messagesContent: unknown;
        if (body.imageBase64) {
          const { mime, b64 } = stripDataUrl(body.imageBase64);
          const dataUrl = `data:${body.imageMime ?? mime};base64,${b64}`;
          messagesContent = [
            { type: "text", text: stylePrompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ];
        } else {
          messagesContent = `Generate a photorealistic aerial/satellite view of a typical suburban single-family home${
            body.address ? ` near ${body.address}` : ""
          }. ${stylePrompt}`;
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{ role: "user", content: messagesContent }],
            modalities: ["image", "text"],
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          return new Response(
            JSON.stringify({ error: `AI gateway error ${upstream.status}: ${text.slice(0, 500)}` }),
            { status: upstream.status, headers: { "Content-Type": "application/json" } },
          );
        }

        const json = (await upstream.json()) as { data?: Array<{ b64_json?: string }> };
        const b64 = json?.data?.[0]?.b64_json;
        if (!b64) {
          return new Response(JSON.stringify({ error: "No image returned by AI." }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            image: `data:image/png;base64,${b64}`,
            panelCount,
            viewType,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});