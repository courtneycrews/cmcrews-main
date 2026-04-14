// Initialize P5.js sketch
let p5Instance = new p5((p) => {
  // Geomantic figures data
  const geomanticFigures = {
    "Via": [1, 1, 1, 1],
    "Populus": [2, 2, 2, 2],
    "Fortuna Major": [2, 2, 1, 1],
    "Fortuna Minor": [1, 1, 2, 2],
    "Conjunctio": [2, 1, 1, 2],
    "Carcer": [1, 2, 2, 1],
    "Tristitia": [2, 2, 2, 1],
    "Laetitia": [1, 2, 2, 2],
    "Puer": [1, 1, 2, 1],
    "Puella": [1, 2, 1, 1],
    "Albus": [2, 2, 1, 2],
    "Rubeus": [2, 1, 2, 2],
    "Acquisitio": [2, 1, 2, 1],
    "Amissio": [1, 2, 1, 2],
    "Caput Draconis": [2, 1, 1, 1],
    "Cauda Draconis": [1, 1, 1, 2]
  };
  
  // Configuration and state variables
  let config = {};
  let palettes = {
    warm: [[255, 100, 50], [255, 150, 30], [255, 200, 100]],
    cool: [[50, 180, 255], [100, 200, 255], [150, 230, 255]],
    redMono: [[255, 50, 50], [220, 30, 30], [200, 10, 10]],
    greenMono: [[50, 200, 100], [30, 180, 80], [10, 150, 50]],
    contrast: [[255, 100, 50], [50, 180, 255], [200, 80, 220]]
  };
  
  // Store predefined pseudo-random values for consistent results
  let precomputedOffsets = {};
  let seedValue = 0;
  
  let animationProgress = 0;
  let isAnimating = true;
  let maxLayers = 0;
  let figureName = "";
  let urlHash = "";
  
  // Get hash from URL if available (important for the refresh button functionality)
  function getHashFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = urlParams.get('hash');
    return hash || "default";
  }
  
  // Use the token hash to determine which geomantic figure to use
  p.setup = function() {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background(20);
    p.noFill();
    p.angleMode(p.DEGREES);
    
    // Get hash from URL (this makes the refresh button work)
    urlHash = getHashFromURL();
    console.log("URL Hash:", urlHash);
    
    // Use the URL hash or tokenData hash
    let hashInt;
    if (urlHash && urlHash !== "default") {
      // Use the URL hash (for the refresh button)
      hashInt = parseInt(urlHash.substring(0, 8), 16);
      console.log("Using URL hash for randomization");
    } else if (typeof tokenData !== 'undefined' && tokenData.tokenHash) {
      // Use tokenData hash (fallback)
      hashInt = parseInt(tokenData.tokenHash.slice(2, 10), 16);
      console.log("Using tokenData hash for randomization");
    } else {
      // Fallback if no hash is available
      hashInt = Math.floor(Math.random() * 16);
      console.log("Using random seed for randomization");
    }
    
    // Use modulo to select a figure (0-15)
    const figureIndex = hashInt % 16;
    const figureNames = Object.keys(geomanticFigures);
    figureName = figureNames[figureIndex];
    
    console.log("Selected figure:", figureName);
    
    // Precompute offsets for deterministic randomness
    for (let figure in geomanticFigures) {
      precomputeOffsetsForFigure(figure);
    }
    
    // Setup based on the selected figure
    interpretSymbol(geomanticFigures[figureName]);
    maxLayers = config.layerCount;
    
    // Set token properties for metadata
    if (typeof tokenData !== 'undefined') {
      tokenData.properties = {
        "Symbol": figureName,
        "Sequence": geomanticFigures[figureName].join('-')
      };
    }
  };
  
  p.draw = function() {
    if (isAnimating) {
      p.background(20, 20, 20, 10); // Semi-transparent background for trail effect
      drawComposition();
      
      // Update animation progress
      animationProgress += 0.3;
      if (animationProgress >= maxLayers * 2) {
        isAnimating = false;
      }
    }
  };
  
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    
    // Important: Reread the hash from URL in case it changed
    urlHash = getHashFromURL();
    console.log("Resize - URL Hash:", urlHash);
    
    // Reset animation but maintain the same figure
    animationProgress = 0;
    isAnimating = true;
    
    // Reinterpret the symbol but don't change the figure
    interpretSymbol(geomanticFigures[figureName]);
    maxLayers = config.layerCount;
    p.background(20);
  };
  
  function precomputeOffsetsForFigure(figure) {
    // Use a combination of the figure name and the URL hash as a seed
    let figureSeed = 0;
    
    // Add character codes from the figure name
    for (let i = 0; i < figure.length; i++) {
      figureSeed += figure.charCodeAt(i);
    }
    
    // Incorporate the URL hash if available for consistent randomness
    if (urlHash && urlHash !== "default") {
      // Take the first 8 chars of the hash as a hex number and add to seed
      let hashComponent = parseInt(urlHash.substring(0, 8), 16);
      figureSeed = (figureSeed + hashComponent) % 2147483647; // Prevent overflow
    } else if (typeof tokenData !== 'undefined' && tokenData.tokenHash) {
      // Fallback to tokenData hash
      let hashComponent = parseInt(tokenData.tokenHash.slice(2, 10), 16);
      figureSeed = (figureSeed + hashComponent) % 2147483647;
    }
    
    // Initialize array for this figure
    precomputedOffsets[figure] = [];
    
    // Create a stable pseudo-random number generator
    let rng = function() {
      figureSeed = (figureSeed * 9301 + 49297) % 233280;
      return figureSeed / 233280;
    };
    
    // Generate a set of predefined offsets for this figure
    let values = geomanticFigures[figure];
    let ribbonCount = Math.floor(p.map(values[0], 1, 2, 1, 3) * 2);
    
    for (let i = 0; i < ribbonCount; i++) {
      precomputedOffsets[figure].push({
        x: rng() * 0.2 - 0.2,  // Range: -0.2 to 0.2
        y: rng() * 0.2 - 0.2,  // Range: -0.2 to 0.2
        scale: 0.7 + rng() * 0.6, // Range: 0.7 to 1.3
        rotation: rng() * -20 - 20 // Range: -20 to 20 degrees
      });
    }
  }
  
  function interpretSymbol(values) {
    // Expanded interpretation of geomantic values
    config.complexity = p.map(values[0], 1, 2, 1, 3);      // Affects number of ribbons (1-3)
    config.colorMode = values[1];                        // 1 = monochrome, 2 = gradient
    config.curveBehavior = values[2];                    // 1 = smooth, 2 = complex
    config.composition = values[3];                      // 1 = centered, 2 = dispersed
    
    // Derived parameters
    config.ribbonCount = Math.floor(config.complexity * 2);   // Number of primary ribbons
    config.layerCount = p.map(config.complexity, 1, 3, 30, 90);
    config.lineWeight = p.map(config.complexity, 1, 3, 1, 0.5);
  
    // Select color palette based on figure characteristics
    if (config.colorMode === 1) {
      // Monochrome palette selection
      config.palette = values[0] === 1 ? palettes.redMono : palettes.greenMono;
    } else {
      // Gradient palette selection based on other values
      let sum = values.reduce((a, b) => a + b, 0);
      if (sum <= 5) {
        config.palette = palettes.warm;
      } else if (sum <= 7) {
        config.palette = palettes.contrast;
      } else {
        config.palette = palettes.cool;
      }
    }
    
    // Calculate additional parameters for more variation
    config.harmonicRatio = p.map(values[0] + values[1], 2, 4, 2, 5);
    config.spiralFactor = p.map(values[2] + values[3], 2, 4, 0.5, 2);
    config.angularOffset = p.map(values[3], 1, 2, 0, 90);
    config.radiusMultiplier = p.map(values[0] + values[3], 2, 4, 0.8, 1.2);
  }
  
  function drawComposition() {
    p.push();
    p.translate(p.width / 2, p.height / 2);
    p.noFill();
    
    let baseRadius = Math.min(p.width, p.height) * 0.35;
    
    for (let i = 0; i < config.ribbonCount; i++) {
      let offsets = precomputedOffsets[figureName][i];
      let offsetX = config.composition === 2 ? p.width * offsets.x : 0;
      let offsetY = config.composition === 2 ? p.height * offsets.y : 0;
      
      let colorIndex = i % config.palette.length;
      let nextColorIndex = (i + 1) % config.palette.length;
      
      let scaleFactor = config.composition === 1 ? 
                      p.map(i, 0, config.ribbonCount, 0.8, 1.5) : 
                      offsets.scale;
      
      let rotation = i * (360 / config.ribbonCount) + config.angularOffset + offsets.rotation;
      
      drawParametricRibbon(
        offsetX, 
        offsetY, 
        baseRadius * scaleFactor * config.radiusMultiplier,
        config.palette[colorIndex],
        config.palette[nextColorIndex],
        rotation,
        config.harmonicRatio + i * 0.5,
        config.spiralFactor * (1 + i * 0.5)
      );
    }
    p.pop();
  }
  
  function drawParametricRibbon(cx, cy, radius, colorStart, colorEnd, rotation, harmonic, spiralFactor) {
    p.push();
    p.translate(cx, cy);
    p.rotate(rotation);
    
    let lineCount = config.layerCount;
    let stepSize = 3;
    
    for (let i = 0; i < lineCount; i++) {
      // Animate the layers with phase offset
      if (i * 2 > animationProgress) break;
      
      let t = i / lineCount;
      let fadeAlpha = p.map(i, 0, lineCount, 20, 80);
      
      // Animate color transition
      let progress = animationProgress - i * 2;
      let colorMix = p.constrain(progress / 20, 0, 1);
      
      let r = p.lerp(colorStart[0], colorEnd[0], t * colorMix);
      let g = p.lerp(colorStart[1], colorEnd[1], t * colorMix);
      let b = p.lerp(colorStart[2], colorEnd[2], t * colorMix);
      
      p.strokeWeight(config.lineWeight);
      p.stroke(r, g, b, fadeAlpha * colorMix);
      
      // Animate phase offset
      let phaseOffset = t * 360 * (animationProgress/maxLayers);
      
      // Calculate curve parameters
      let frequency = harmonic;
      let amplitude = radius * (config.curveBehavior === 1 ? 1 : 1.5);
      let spiralDegree = spiralFactor * t;
      
      p.beginShape();
      for (let angle = 0; angle <= 360; angle += stepSize) {
        // Complex parametric equation inspired by the reference images
        let phase = angle + phaseOffset;
        
        // Base radius varies with angle and time
        let r1 = p.sin(phase / frequency) * amplitude;
        let r2 = p.cos(phase / frequency) * amplitude;
        
        // Apply spiral effect
        let spiralR = p.constrain(1 - spiralDegree * 0.25 + p.sin(angle * 3) * 0.1, 0.1, 2);      
        // Calculate more complex curve patterns based on curveBehavior
        let x, y;
        if (config.curveBehavior === 1) {
          // Smoother, more elliptical curves
          x = r1 * p.cos(angle) * spiralR;
          y = r2 * p.sin(angle) * spiralR;
        } else {
          // More complex, intricate curves with harmonics
          x = r1 * p.cos(angle) * spiralR + p.sin(angle * 3) * amplitude * 0.2;
          y = r2 * p.sin(angle) * spiralR + p.cos(angle * 2) * amplitude * 0.2;
        }
        if (isFinite(x) && isFinite(y)) {
          p.vertex(x, y);
        }
      }
      p.endShape();
    }
    p.pop();
  }
});

// If the sketch is running in the NFT environment with tokenData,
// Add the token properties for the metadata
if (typeof tokenData !== 'undefined') {
  // The token properties will be populated in setup()
  console.log("Running in NFT environment with hash:", tokenData.tokenHash);
  
  // Extract token ID if available
  let tokenId = "unknown";
  if (tokenData.tokenId) {
    tokenId = tokenData.tokenId;
  }
  console.log("Token ID:", tokenId);
}