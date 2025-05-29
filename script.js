const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const downloadBtn = document.getElementById('downloadBtn');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Get all control elements
const gradientControls = document.getElementById("gradientControls");
const addColorBtn = document.getElementById("addColorBtn");
const imageUpload = document.getElementById("imageUpload");
const textInput = document.getElementById("textInput");
const fontFamily = document.getElementById("fontFamily");
const fontSize = document.getElementById("fontSize");
const textColor = document.getElementById("textColor");
const textX = document.getElementById("textX");
const textY = document.getElementById("textY");

// Effect controls
const blurControl = document.getElementById("blur");
const saturationControl = document.getElementById("saturation");
const grainControl = document.getElementById("grain");
const intensityControl = document.getElementById("intensity");
const opacityControl = document.getElementById("opacity");
const brightnessControl = document.getElementById("brightness");
const contrastControl = document.getElementById("contrast");
const glowControl = document.getElementById("glow");

// Create a temporary canvas for effects
const tempCanvas = document.createElement("canvas");
const tempCtx = tempCanvas.getContext("2d");
tempCanvas.width = canvas.width;
tempCanvas.height = canvas.height;

// Create a separate canvas for blob effects
const blobCanvas = document.createElement("canvas");
const blobCtx = blobCanvas.getContext("2d");
blobCanvas.width = canvas.width;
blobCanvas.height = canvas.height;

// State variables
let uploadedImage = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let blobs = [];

// Add event listeners
addColorBtn.addEventListener("click", addColorStop);
imageUpload.addEventListener("change", handleImageUpload);
[textInput, fontFamily, fontSize, textColor, textX, textY].forEach(
  (control) => {
    control.addEventListener("input", draw);
  }
);

// Add event listeners for text dragging
canvas.addEventListener("mousedown", startDrag);
canvas.addEventListener("mousemove", drag);
canvas.addEventListener("mouseup", endDrag);
canvas.addEventListener("mouseleave", endDrag);

// Add event listeners for live preview
[
  blurControl,
  saturationControl,
  grainControl,
  intensityControl,
  opacityControl,
  brightnessControl,
  contrastControl,
  glowControl,
].forEach((control) => {
  control.addEventListener("input", draw);
});

// Initial draw
draw();

// Swatch palette UI
function renderPalette() {
  gradientControls.innerHTML = "";
  blobs.forEach((blob, i) => {
    const swatch = document.createElement("div");
    swatch.className = "color-stop";
    swatch.style.display = "flex";
    swatch.style.alignItems = "center";
    swatch.style.gap = "10px";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = blob.color;
    colorInput.addEventListener("input", (e) => {
      blobs[i].color = e.target.value;
      draw();
    });

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.className = "add-color-btn";
    removeBtn.style.width = "30px";
    removeBtn.onclick = () => {
      blobs.splice(i, 1);
      renderPalette();
      draw();
    };

    swatch.appendChild(colorInput);
    swatch.appendChild(removeBtn);
    gradientControls.appendChild(swatch);
  });
}

function addColorStop() {
  // Alternate between white and black for new blobs
  const color = blobs.length % 2 === 0 ? "#ffffff" : "#000000";
  const size = 120 + Math.random() * 120;
  const pos = getNonOverlappingPosition(size);
  const blob = {
    color,
    x: pos.x,
    y: pos.y,
    size,
    points: generateBlobPoints(8),
  };
  blobs.push(blob);
  renderPalette();
  draw();
}

function getNonOverlappingPosition(size) {
    let tries = 0;
  
    while (tries < 1000) {
      // Bias generation toward the canvas edges
      const edgeBias = Math.random();
      let x, y;
  
      if (edgeBias < 0.5) {
        // Bias to left or right edges
        x = Math.random() < 0.5
          ? Math.random() * 100
          : canvas.width - Math.random() * 100;
        y = Math.random() * canvas.height;
      } else {
        // Bias to top or bottom edges
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5
          ? Math.random() * 100
          : canvas.height - Math.random() * 100;
      }
  
      let overlap = false;
      for (const b of blobs) {
        const dist = Math.hypot(b.x - x, b.y - y);
        if (dist < (b.size + size) / 2) {
          overlap = true;
          break;
        }
      }
  
      if (!overlap) return { x, y };
      tries++;
    }
  
    // Fallback: random position anywhere
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
    };
  }
  


function generateBlobPoints(numPoints) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const radius = 0.8 + Math.random() * 0.4;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  return points;
}

function drawBlob(blob) {
  const { x, y, size, points, color } = blob;
  blobCtx.save();
  blobCtx.beginPath();
  blobCtx.translate(x, y);
  blobCtx.scale(size, size);
  blobCtx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    if (i === 0) {
      blobCtx.moveTo(current.x, current.y);
    } else {
      blobCtx.quadraticCurveTo(current.x, current.y, midX, midY);
    }
  }
  blobCtx.closePath();
  blobCtx.fillStyle = color;
  blobCtx.fill();
  blobCtx.restore();
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      uploadedImage = new Image();
      uploadedImage.onload = function () {
        draw();
      };
      uploadedImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function startDrag(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const textX = parseInt(document.getElementById("textX").value);
  const textY = parseInt(document.getElementById("textY").value);
  const text = document.getElementById("textInput").value;
  const size = parseInt(document.getElementById("fontSize").value);
  if (
    Math.abs(x - textX) < (text.length * size) / 2 &&
    Math.abs(y - textY) < size
  ) {
    isDragging = true;
    dragStartX = x - textX;
    dragStartY = y - textY;
  }
}

function drag(e) {
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  document.getElementById("textX").value = Math.round(x - dragStartX);
  document.getElementById("textY").value = Math.round(y - dragStartY);
  draw();
}

function endDrag() {
  isDragging = false;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    blobCtx.clearRect(0, 0, blobCanvas.width, blobCanvas.height);

    // Step 1: Draw either image or blobs onto blobCanvas
    if (uploadedImage) {
        blobCtx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
    } else {
        blobs.forEach(blob => drawBlob(blob));
    }

    // Step 2: Apply blur to blobCanvas content
    const blurValue = parseInt(blurControl.value) || 0;
    if (blurValue > 0) {
        tempCtx.filter = `blur(${blurValue}px)`;
        tempCtx.drawImage(blobCanvas, 0, 0);
        tempCtx.filter = 'none';
    } else {
        tempCtx.drawImage(blobCanvas, 0, 0);
    }

    // Step 3: Apply color adjustments (brightness, contrast, saturation)
    applyEffects();

    // Step 4: Draw text on top of effects
    drawText();

    // Step 5: Final draw with opacity & glow to main canvas
    ctx.save();
    ctx.globalAlpha = (parseInt(opacityControl.value) || 100) / 100;

    const glow = parseInt(glowControl.value) || 0;
    if (glow > 0) {
        ctx.shadowColor = textColor.value;
        ctx.shadowBlur = glow;
    } else {
        ctx.shadowBlur = 0;
    }

    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();
}

function drawText() {
  const text = textInput.value;
  const x = parseInt(textX.value);
  const y = parseInt(textY.value);
  const size = parseInt(fontSize.value);
  const font = fontFamily.value;
  const color = textColor.value;

  tempCtx.font = `${size}em ${font}`;
  tempCtx.fillStyle = color;
  tempCtx.textAlign = "center";
  tempCtx.textBaseline = "middle";
  tempCtx.fillText(text, x, y);
}

function applyEffects() {
    const brightness = brightnessControl.value;
    const contrast = contrastControl.value;
    const saturation = saturationControl.value;

    // Combine filters
    tempCtx.filter = `
        brightness(${brightness}%)
        contrast(${contrast}%)
        saturate(${saturation}%)
    `.trim();

    const filtered = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.putImageData(filtered, 0, 0);
    tempCtx.filter = 'none';

    if (grainControl.value > 0) {
        applyGrain(grainControl.value);
    }
}


function applyGrain(amount) {
  const imageData = tempCtx.getImageData(
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  );
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * amount;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }

  tempCtx.putImageData(imageData, 0, 0);
}

// Initial palette and draw
renderPalette();
draw();

downloadBtn.addEventListener('click', () => {
    // Convert canvas to data URL (PNG)
    const dataURL = canvas.toDataURL('image/png');
  
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'canvas-image.png'; // Default file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });