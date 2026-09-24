import PptxGenJS from "pptxgenjs";

const MAX_CONTENT_PER_SLIDE = 3800; // characters (leave room for formatting)

export const generatePPT = async (data) => {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  // Global style options
  pptx.defineSlideMaster({
    title: "Clean & Modern Master",
    background: { color: "FFFFFF" },
    slideNumber: {
      x: 9.0,
      y: 5.2,
      options: { font_size: 10, color: "999999" }
    }
  });

  // Title Slide
  const slide0 = pptx.addSlide({ masterName: "Clean & Modern Master" });

  slide0.addText(data?.title || "Presentation", {
    x: 0.8,
    y: 1.8,
    w: 8.4,
    h: 1.5,
    fontSize: 40,
    bold: true,
    color: "111827",
    fontFace: "Helvetica Neue",
  });

  if (data?.subtitle) {
    slide0.addText(data.subtitle, {
      x: 0.8,
      y: 3.4,
      w: 8.4,
      h: 0.8,
      fontSize: 20,
      color: "6B7280",
      fontFace: "Helvetica Neue",
    });
  }

  // Body Slides (support both "sections" and "slides")
  const items = data?.sections || data?.slides || [];

  for (let item of items) {
    const heading = item?.heading || item?.title || "Slide";
    const rawPoints = item?.points || [];
    if (!Array.isArray(rawPoints) || rawPoints.length === 0) continue;

    const totalChars = rawPoints.reduce((acc, p) => acc + (typeof p === "string" ? p.length : String(p || "").length), 0);
    const chunks = [];

    // Split long content into multiple slides
    if (totalChars > MAX_CONTENT_PER_SLIDE) {
      let currentChunk = [];
      let currentLen = 0;

      for (const p of rawPoints) {
        const text = typeof p === "string" ? p : String(p || "");
        const pLen = text.length;
        if (currentLen + pLen > MAX_CONTENT_PER_SLIDE && currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = [text];
          currentLen = pLen;
        } else {
          currentChunk.push(text);
          currentLen += pLen + 2; // +2 for newline
        }
      }
      if (currentChunk.length > 0) chunks.push(currentChunk);
    } else {
      chunks.push(rawPoints.map(p => (typeof p === "string" ? p : String(p || ""))));
    }

    // Create one or more slides per section/slide item
    for (let chunk of chunks) {
      const slide = pptx.addSlide({ masterName: "Clean & Modern Master" });

      slide.addText(heading, {
        x: 0.8,
        y: 0.5,
        w: 8.4,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: "111827",
        fontFace: "Helvetica Neue",
        border: {
          type: "line",
          color: "E5E7EB",
          width: 1,
          bottom: true,
        },
        margin: 0.1,
      });

      const bulletPoints = chunk.map((p) => ({ text: p }));
      slide.addText(bulletPoints, {
        x: 0.8,
        y: 1.5,
        w: 8.4,
        h: 3.5,
        fontSize: 16,
        color: "374151",
        fontFace: "Helvetica Neue",
        bullet: true,
        margin: 0.1,
        paraSpaceAfter: 12,
      });
    }
  }

  // Optional: Last slide with thank you
  const lastSlide = pptx.addSlide({ masterName: "Clean & Modern Master" });
  lastSlide.addText("Thank You", {
    x: 0.8,
    y: 2.2,
    w: 8.4,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: "111827",
    fontFace: "Helvetica Neue",
    align: "center",
  });

  return await pptx.write({ outputType: "nodebuffer" });
};