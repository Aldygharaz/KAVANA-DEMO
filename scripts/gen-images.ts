import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const OUTPUT_DIR = path.join(process.cwd(), 'public/images/products')

const PRODUCTS: { slug: string; prompt: string }[] = [
  {
    slug: 'kaos-oversize-daily-classic',
    prompt: 'Professional e-commerce product photography of a neatly folded oversized cream cotton t-shirt with subtle small embroidered logo on chest, centered on warm beige studio background, soft diffused lighting, minimalist premium aesthetic, high quality',
  },
  {
    slug: 'hoodie-urban-warmth',
    prompt: 'Professional e-commerce product photography of a folded warm charcoal-gray fleece hoodie with kangaroo pocket and drawstrings, centered on warm cream studio background, soft diffused lighting, minimalist premium aesthetic, high quality',
  },
  {
    slug: 'kemeja-linen-coastal-breeze',
    prompt: 'Professional e-commerce product photography of a folded sand-colored linen button-up casual shirt, natural fabric texture, centered on warm beige studio background, soft diffused lighting, minimalist premium aesthetic, high quality',
  },
  {
    slug: 'topi-dad-cap-logo-stitch',
    prompt: 'Professional e-commerce product photography of a khaki olive cotton dad cap baseball hat with small stitched logo, centered on warm cream studio background, soft diffused lighting, minimalist premium aesthetic, high quality',
  },
  {
    slug: 'tote-bag-canvas-everyday-carry',
    prompt: 'Professional e-commerce product photography of a natural beige canvas tote bag with sturdy handles standing upright, centered on warm cream studio background, soft diffused lighting, minimalist premium aesthetic, high quality',
  },
  {
    slug: 'dompet-kulit-slimfold',
    prompt: 'Professional e-commerce product photography of a slim cognac brown leather bifold wallet slightly open showing card slots, centered on warm beige studio background, soft diffused lighting, minimalist premium aesthetic, high quality',
  },
  {
    slug: 'kalung-stainless-minimal-chain',
    prompt: 'Professional e-commerce product photography of a minimalist silver stainless steel chain necklace arranged elegantly on a small round display, centered on warm cream studio background, soft diffused lighting, premium jewelry aesthetic, high quality',
  },
  {
    slug: 'ikat-pinggang-buckle-classic',
    prompt: 'Professional e-commerce product photography of a coiled dark brown leather belt with brushed brass buckle, centered on warm beige studio background, soft diffused lighting, minimalist premium aesthetic, high quality',
  },
  {
    slug: 'tws-earbuds-pulse-air',
    prompt: 'Professional e-commerce product photography of sleek matte white wireless earbuds with open charging case, modern tech gadget, centered on warm cream studio background, soft diffused lighting, minimalist premium aesthetic, high quality',
  },
  {
    slug: 'portable-speaker-boom-mini',
    prompt: 'Professional e-commerce product photography of a compact cylindrical portable bluetooth speaker in sand beige fabric mesh with rubber buttons, centered on warm cream studio background, soft diffused lighting, minimalist premium aesthetic, high quality',
  },
  {
    slug: 'powerbank-chargego-10k',
    prompt: 'Professional e-commerce product photography of a slim modern aluminum power bank with small digital battery display and USB ports, centered on warm cream studio background, soft diffused lighting, minimalist premium tech aesthetic, high quality',
  },
  {
    slug: 'smartwatch-pace-one',
    prompt: 'Professional e-commerce product photography of a modern smartwatch with dark walnut brown leather strap and round fitness display showing heart rate, centered on warm cream studio background, soft diffused lighting, premium minimalist aesthetic, high quality',
  },
  {
    slug: 'mug-keramik-morning-ritual',
    prompt: 'Professional e-commerce product photography of a handmade speckled ceramic mug in warm terracotta glaze with steam rising, centered on warm beige studio background, soft diffused lighting, cozy premium aesthetic, high quality',
  },
  {
    slug: 'lilin-aromaterapi-soy-calm',
    prompt: 'Professional e-commerce product photography of a lit soy wax scented candle in amber glass jar with minimal paper label, centered on warm cream studio background, soft diffused lighting, cozy premium aesthetic, high quality',
  },
  {
    slug: 'lampu-meja-glow-nook',
    prompt: 'Professional e-commerce product photography of a small warm-glowing wooden table lamp with fabric dome shade turned on, centered on warm dark beige studio background, cozy soft lighting, premium minimalist aesthetic, high quality',
  },
  {
    slug: 'selimut-rajut-cozy-weave',
    prompt: 'Professional e-commerce product photography of a neatly folded chunky knit throw blanket in warm caramel color showing rich knit texture, centered on cream studio background, soft diffused lighting, cozy premium aesthetic, high quality',
  },
]

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const zai = await ZAI.create()
  let ok = 0
  let fail = 0
  for (const p of PRODUCTS) {
    const outPath = path.join(OUTPUT_DIR, `${p.slug}.png`)
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 20000) {
      console.log(`SKIP (exists): ${p.slug}`)
      ok++
      continue
    }
    try {
      const res = await zai.images.generations.create({ prompt: p.prompt, size: '1024x1024' })
      const b64 = res.data?.[0]?.base64
      if (!b64) throw new Error('no image data')
      fs.writeFileSync(outPath, Buffer.from(b64, 'base64'))
      console.log(`OK: ${p.slug}`)
      ok++
    } catch (e: any) {
      console.error(`FAIL: ${p.slug} — ${e?.message ?? e}`)
      fail++
    }
  }
  console.log(`DONE ok=${ok} fail=${fail}`)
}

main()
