import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "public/images/products");

const REGEN: { slug: string; prompt: string }[] = [
  {
    slug: "kaos-oversize-daily-classic",
    prompt:
      "Professional e-commerce product photography of a neatly folded plain cream cotton t-shirt, completely blank shirt with no print and no logo, centered on warm beige studio background, soft diffused lighting, minimalist premium aesthetic, absolutely no text, no words, no letters, no typography anywhere in the image, high quality",
  },
  {
    slug: "lilin-aromaterapi-soy-calm",
    prompt:
      "Professional e-commerce product photography of a lit soy wax candle in a plain unbranded amber glass jar with a lit warm flame, no label on the jar, centered on warm cream studio background, soft diffused lighting, cozy premium aesthetic, absolutely no text, no words, no letters, no typography anywhere in the image, high quality",
  },
  {
    slug: "lampu-meja-glow-nook",
    prompt:
      "Professional e-commerce product photography of a small warm-glowing wooden table lamp with a plain cream fabric dome shade turned on, no text on the lamp, centered on warm dark beige studio background, cozy soft lighting, premium minimalist aesthetic, absolutely no text, no words, no letters, no typography anywhere in the image, high quality",
  },
];

async function main() {
  const zai = await ZAI.create();
  for (const p of REGEN) {
    const out = path.join(OUT, `${p.slug}.png`);
    const bak = out.replace(".png", ".bak.png");
    if (fs.existsSync(out)) fs.renameSync(out, bak);
    try {
      const res = await zai.images.generations.create({ prompt: p.prompt, size: "1024x1024" });
      const b64 = res.data?.[0]?.base64;
      if (!b64) throw new Error("no data");
      fs.writeFileSync(out, Buffer.from(b64, "base64"));
      if (fs.existsSync(bak)) fs.rmSync(bak);
      console.log("REGEN OK:", p.slug);
    } catch (e: any) {
      if (fs.existsSync(bak)) fs.renameSync(bak, out);
      console.error("REGEN FAIL:", p.slug, e?.message ?? e);
    }
  }
  console.log("DONE");
}
main();
