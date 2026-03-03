import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createCanvas, loadImage } from "canvas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateImage = async (
  prompt,
  caption,
  size = "instagram",
  logoPath = null
) => {
  try {
    /* =============================
       📐 SIZE CONTROL
    ============================= */
    let width = 700;
    let height = 900;

    if (size === "a4") {
      width = 794;
      height = 1123;
    }

    if (size === "story") {
      width = 1080;
      height = 1920;
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    /* =============================
       🎨 BACKGROUND
    ============================= */
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0f3d2e");
    gradient.addColorStop(1, "#145a32");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = "center";

    /* =============================
       🏷 BRAND
    ============================= */
    ctx.fillStyle = "#a9dfbf";
    ctx.font = "bold 28px Arial";
    ctx.fillText("GREENSTEP™", width / 2, 80);

    /* =============================
       📝 TITLE
    ============================= */
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 50px Arial";

    const words = prompt.split(" ");
    const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
    const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");

    ctx.fillText(line1.toUpperCase(), width / 2, 200);
    ctx.fillText(line2.toUpperCase(), width / 2, 270);

    /* =============================
       🧠 AI SUBTITLE
    ============================= */
    ctx.font = "24px Arial";
    ctx.fillText(caption.slice(0, 60) + "...", width / 2, 330);

    /* =============================
       🖼 PRODUCT IMAGE
    ============================= */
    let productImage;

    try {
      productImage = await loadImage(
        `https://loremflickr.com/600/600/${encodeURIComponent(prompt)}`
      );
    } catch {
      productImage = await loadImage("https://picsum.photos/600");
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 + 50, 180, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      productImage,
      width / 2 - 180,
      height / 2 - 130,
      360,
      360
    );
    ctx.restore();

    /* =============================
       🏢 LOGO OVERLAY (NEW 🔥)
    ============================= */
    if (logoPath) {
      try {
        const logo = await loadImage(logoPath);

        const logoWidth = 120;
        const logoHeight = 80;

        ctx.drawImage(
          logo,
          width - logoWidth - 30,
          30,
          logoWidth,
          logoHeight
        );
      } catch (err) {
        console.log("Logo load failed:", err.message);
      }
    }

    /* =============================
       🔘 CTA BUTTON
    ============================= */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(width / 2 - 150, height - 180, 300, 60);

    ctx.fillStyle = "#145a32";
    ctx.font = "bold 24px Arial";
    ctx.fillText("SHOP NOW", width / 2, height - 140);

    ctx.fillStyle = "#d5f5e3";
    ctx.font = "18px Arial";
    ctx.fillText(
      "Sustainable. Stylish. Responsible.",
      width / 2,
      height - 80
    );

    /* =============================
       💾 SAVE FILE
    ============================= */
    const uploadDir = path.join(__dirname, "../uploads");
    fs.mkdirSync(uploadDir, { recursive: true });

    const imageName = `poster-${Date.now()}.png`;
    const imagePath = path.join(uploadDir, imageName);

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(imagePath, buffer);

    return `/uploads/${imageName}`;

  } catch (error) {
    console.error("Image Generation Error:", error.message);
    throw new Error("Image generation failed");
  }
};