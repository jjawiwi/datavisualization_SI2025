let table;
let imgBenigno, imgMalicioso, imgCyborg;
let nodes = [];
let dataLoaded = false;
let loadFailed = false;
let loadMessage = "Cargando datos...";
let imagesLoaded = false;

// Variables para arrastre
let draggedNode = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function preload() {
  // Carga de imágenes con callbacks
  imgBenigno = loadImage("benigno.png", 
    () => console.log("✓ benigno.png cargado"),
    () => console.error("✗ Error cargando benigno.png")
  );
  imgMalicioso = loadImage("malicioso.png",
    () => console.log("✓ malicioso.png cargado"),
    () => console.error("✗ Error cargando malicioso.png")
  );
  imgCyborg = loadImage("cyborg.png",
    () => console.log("✓ cyborg.png cargado"),
    () => console.error("✗ Error cargando cyborg.png")
  );
  
  // Cargar CSV (usa SSV porque el separador es punto y coma)
  try {
    table = loadTable("data/DataNeiro.csv", "ssv", "header");
    console.log("CSV cargado en preload, filas:", table ? table.getRowCount() : 0);
  } catch (e) {
    console.error("Error en preload cargando CSV:", e);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  textFont("Roboto, system-ui, sans-serif");
  textSize(12);
  noStroke();

  // Verificar que las imágenes se cargaron
  if (imgBenigno && imgMalicioso && imgCyborg) {
    imagesLoaded = true;
    console.log("✓ Todas las imágenes cargadas");
  } else {
    console.warn("⚠ Algunas imágenes no se cargaron");
  }

  // Verificar que el CSV se cargó correctamente
  if (table && table.getRowCount() > 0) {
    console.log("CSV tiene", table.getRowCount(), "filas");
    console.log("Columnas:", table.columns);
    prepareNodes();
    dataLoaded = true;
    loadMessage = "";
    console.log("✓ Nodos creados:", nodes.length);
  } else {
    loadFailed = true;
    loadMessage = "Error al cargar data/DataNeiro.csv";
    console.error("✗ No se pudo cargar el CSV. Table:", table);
  }
}

function prepareNodes() {
  nodes = [];

  for (let r = 0; r < table.getRowCount(); r++) {
    // Intentar leer las columnas - puede que los nombres tengan problemas de encoding
    let tipo = table.getString(r, 0) || table.getString(r, "Tipo de Bot") || "";
    let desc = table.getString(r, 1) || table.getString(r, "Descripción") || "";
    let intencion = table.getString(r, 2) || table.getString(r, "Intención") || "";
    let red = table.getString(r, 3) || table.getString(r, "Red Social") || "";

    // Posición aleatoria
    let x = random(150, width - 150);
    let y = random(150, height - 150);

    let baseImg;
    let tipoLower = tipo.toLowerCase();
    if (tipoLower === "benigno") {
      baseImg = imgBenigno;
    } else if (tipoLower.includes("cyborg")) {
      baseImg = imgCyborg;
    } else {
      baseImg = imgMalicioso; // resto como malicioso
    }

    // Verificar que la imagen existe
    if (!baseImg) {
      console.warn("No hay imagen para tipo:", tipo);
      continue;
    }

    nodes.push({
      x,
      y,
      r: 40,
      tipo,
      desc,
      red,
      intencion,
      img: baseImg,
    });
  }
  
  console.log("Nodos preparados:", nodes.length);
}

function draw() {
  // Fondo beige
  background(245, 240, 220);

  // Si todavía no se carga el CSV
  if (!dataLoaded && !loadFailed) {
    fill(60, 60, 60);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(loadMessage, width / 2, height / 2);
    return;
  }

  // Si falló la carga
  if (loadFailed) {
    fill(200, 50, 50);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(loadMessage + "\nRevisa la consola (F12) y la ruta del CSV.", width / 2, height / 2);
    return;
  }

  // Si no hay nodos, mostrar mensaje
  if (nodes.length === 0) {
    fill(150, 100, 50);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("No se encontraron nodos para mostrar.\nRevisa la consola (F12) para más detalles.", width / 2, height / 2);
    return;
  }

  // Dibujar conexiones solo entre nodos con la misma red social
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let ni = nodes[i];
      let nj = nodes[j];
      
      // Solo conectar si tienen la misma red social
      if (ni.red && nj.red && ni.red.toLowerCase().trim() === nj.red.toLowerCase().trim()) {
        let d = dist(ni.x, ni.y, nj.x, nj.y);
        if (d < 220) {
          let c = getColorForRed(ni.red);
          stroke(c[0], c[1], c[2], 100);
          strokeWeight(2);
          line(ni.x, ni.y, nj.x, nj.y);
        }
      }
    }
  }
  
  noStroke();
  let hoveredNode = null;

  // Dibujar nodos
  for (let n of nodes) {
    push();
    translate(n.x, n.y);

    let c = getColorForRed(n.red);
    
    if (n.img && n.img.width > 0) {
      // Si la imagen está cargada, dibujarla con filtro de color
      tint(c[0], c[1], c[2], 255);
      image(n.img, 0, 0, 80, 80);
      noTint();
    } else {
      // Fallback: dibujar círculo de color si no hay imagen
      fill(c[0], c[1], c[2], 200);
      noStroke();
      circle(0, 0, 60);
      
      // Dibujar icono simple según tipo
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(20);
      let icono = "?";
      if (n.tipo.toLowerCase() === "benigno") icono = "✓";
      else if (n.tipo.toLowerCase().includes("cyborg")) icono = "⚡";
      else icono = "!";
      text(icono, 0, 0);
    }
    pop();

    let d = dist(mouseX, mouseY, n.x, n.y);
    if (d < n.r && !draggedNode) {
      hoveredNode = n;
      stroke(100, 100, 150);
      strokeWeight(2);
      noFill();
      circle(n.x, n.y, n.r * 2.2);
      noStroke();
    }
    
    // Si está siendo arrastrado, mostrar indicador
    if (draggedNode === n) {
      stroke(50, 100, 200);
      strokeWeight(3);
      noFill();
      circle(n.x, n.y, n.r * 2.4);
      noStroke();
    }
  }

  if (hoveredNode) {
    drawTooltip(hoveredNode);
  }
  
  // Dibujar leyenda
  drawLegend();
}

function getColorForRed(red) {
  if (!red) return [200, 200, 200];
  red = red.toLowerCase().trim();

  if (red === "x" || red === "twitter") {
    return [29, 155, 240];
  } else if (red === "facebook") {
    return [66, 103, 178];
  } else if (red === "instagram") {
    return [193, 53, 132];
  } else if (red === "tiktok") {
    return [0, 242, 234];
  } else if (red === "whatsapp") {
    return [37, 211, 102];
  } else if (red === "reddit") {
    return [255, 69, 0];
  } else if (red === "youtube") {
    return [255, 0, 0];
  } else {
    return [180, 180, 180];
  }
}

function getRedSocialName(red) {
  if (!red) return "Desconocida";
  red = red.toLowerCase().trim();
  
  if (red === "x" || red === "twitter") {
    return "X / Twitter";
  } else if (red === "facebook") {
    return "Facebook";
  } else if (red === "instagram") {
    return "Instagram";
  } else if (red === "tiktok") {
    return "TikTok";
  } else if (red === "whatsapp") {
    return "WhatsApp";
  } else if (red === "reddit") {
    return "Reddit";
  } else if (red === "youtube") {
    return "YouTube";
  } else {
    return red.charAt(0).toUpperCase() + red.slice(1);
  }
}

function drawLegend() {
  // Obtener todas las redes sociales únicas de los nodos
  let redesUnicas = [];
  for (let n of nodes) {
    if (n.red && !redesUnicas.includes(n.red)) {
      redesUnicas.push(n.red);
    }
  }
  
  if (redesUnicas.length === 0) return;
  
  // Configuración de la leyenda
  let x = 20;
  let y = 20;
  let itemHeight = 25;
  let boxWidth = 200;
  let boxHeight = redesUnicas.length * itemHeight + 20;
  
  // Fondo de la leyenda
  push();
  rectMode(CORNER);
  fill(255, 255, 250, 240);
  stroke(100, 100, 150, 200);
  strokeWeight(1);
  rect(x, y, boxWidth, boxHeight, 8);
  
  // Título
  fill(40, 40, 40);
  textAlign(LEFT, TOP);
  textSize(14);
  textStyle(BOLD);
  text("Redes Sociales", x + 10, y + 8);
  textStyle(NORMAL);
  
  // Items de la leyenda
  let yPos = y + 30;
  for (let red of redesUnicas) {
    let c = getColorForRed(red);
    let nombre = getRedSocialName(red);
    
    // Círculo de color
    fill(c[0], c[1], c[2]);
    noStroke();
    circle(x + 15, yPos, 12);
    
    // Nombre de la red
    fill(40, 40, 40);
    textSize(11);
    textAlign(LEFT, CENTER);
    text(nombre, x + 30, yPos);
    
    yPos += itemHeight;
  }
  
  pop();
}

function drawTooltip(node) {
  let padding = 10;
  let w = 280;
  let h = 130;

  let x = node.x + 50;
  let y = node.y - h / 2;

  if (x + w > width - 10) x = width - w - 10;
  if (y < 10) y = 10;

  push();
  rectMode(CORNER);

  fill(255, 255, 250, 245);
  stroke(100, 100, 150, 200);
  strokeWeight(1);
  rect(x, y, w, h, 10);

  noStroke();
  fill(40, 40, 40);
  textAlign(LEFT, TOP);
  textSize(12);

  text(`Tipo: ${node.tipo}`, x + padding, y + padding);
  text(`Intención: ${node.intencion}`, x + padding, y + padding + 16);
  text(`Red: ${node.red}`, x + padding, y + padding + 32);

  textSize(11);
  text(node.desc, x + padding, y + padding + 50, w - padding * 2, h - padding * 3);
  pop();
}

function mousePressed() {
  // Buscar el nodo sobre el que se hizo clic
  for (let n of nodes) {
    let d = dist(mouseX, mouseY, n.x, n.y);
    if (d < n.r) {
      draggedNode = n;
      dragOffsetX = mouseX - n.x;
      dragOffsetY = mouseY - n.y;
      return false; // Prevenir comportamiento por defecto
    }
  }
  return false;
}

function mouseDragged() {
  if (draggedNode) {
    // Mover el nodo siguiendo el mouse
    draggedNode.x = mouseX - dragOffsetX;
    draggedNode.y = mouseY - dragOffsetY;
    
    // Mantener dentro de los límites del canvas
    draggedNode.x = constrain(draggedNode.x, 50, width - 50);
    draggedNode.y = constrain(draggedNode.y, 50, height - 50);
    
    return false; // Prevenir comportamiento por defecto
  }
  return false;
}

function mouseReleased() {
  draggedNode = null;
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
