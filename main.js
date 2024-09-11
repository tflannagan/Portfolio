//VARIABLES
let scene,
  camera,
  renderer,
  navObjects = [],
  particles;
let noise = new SimplexNoise();
let mouseX = 0,
  mouseY = 0;
let raycaster, mouse;
const navItems = ["About", "Portfolio", "Contact"];
let mousePosition = new THREE.Vector3();
let contentPanels = [];
let contentOverlay;
let animatedText;

let carouselRadius = 4;
let carouselAngle = 0;
let carouselSpeed = 0.8;
let isRotating = true;

//INIT
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 20);
  camera.lookAt(0, -6, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById("space-animation").appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 1, 1).normalize();
  scene.add(light);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  createNavObjects();
  createParticles();
  initTextAnimation();
  createContentOverlay();
  animatedText = document.querySelector("#animated-text");

  console.log("Nav objects created:", navObjects);

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onClick);
}

//NAV
function createNavObjects() {
  for (let i = 0; i < navItems.length; i++) {
    const geometry = new THREE.IcosahedronGeometry(0.6, 5);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x2b6bff) },
        hoverStrength: { value: 0.0 },
      },
      vertexShader: `
        uniform float time;
        uniform float hoverStrength;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normal;
          vPosition = position;
          
          vec3 newPosition = position;
          newPosition += normal * (sin(time * 2.0) * 0.05 + hoverStrength * 0.1);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float hoverStrength;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 light = vec3(0.0, 1.0, 1.0);
          float intensity = pow(0.5 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          vec3 baseGlow = color * intensity;
          vec3 hoverColor = vec3(0.4, 0.6, 1.0); 
          vec3 hoverGlow = mix(baseGlow, hoverColor, hoverStrength * 0.5);
          
          gl_FragColor = vec4(hoverGlow, 1.0);
        }
      `,
    });

    const navObject = new THREE.Mesh(geometry, material);
    const angle = (i / navItems.length) * Math.PI * 2;
    navObject.userData = {
      name: navItems[i],
      angle: angle,
      hoverStrength: 0,
    };
    scene.add(navObject);
    navObjects.push(navObject);
  }
}

function updateNavObjects() {
  const time = Date.now() * 0.001;

  if (isRotating) {
    carouselAngle += carouselSpeed * 0.01;
  }

  navObjects.forEach((obj, index) => {
    obj.material.uniforms.time.value = time;

    const angle = obj.userData.angle + carouselAngle;
    obj.position.set(
      Math.sin(angle) * carouselRadius,
      -13,
      Math.cos(angle) * carouselRadius
    );

    obj.lookAt(camera.position);

    const pulseFactor = 1 + Math.sin(time * 3 + index) * 0.05;
    obj.scale.set(pulseFactor, pulseFactor, pulseFactor);

    obj.material.uniforms.hoverStrength.value +=
      (obj.userData.hoverStrength - obj.material.uniforms.hoverStrength.value) *
      0.3;
  });
}
function showNavItemName(object, event) {
  let nameElement = document.getElementById("nav-item-name");
  if (!nameElement) {
    nameElement = document.createElement("div");
    nameElement.id = "nav-item-name";
    nameElement.style.position = "absolute";
    nameElement.style.color = "#ffffff";
    nameElement.style.fontSize = "24px";
    nameElement.style.fontFamily = "Amatic SC, sans-serif";
    nameElement.style.pointerEvents = "none";
    nameElement.style.transition = "opacity 0.3s ease";
    document.body.appendChild(nameElement);
  }

  nameElement.textContent = object.userData.name;
  nameElement.style.left = `${event.clientX + 20}px`;
  nameElement.style.top = `${event.clientY - 20}px`;
  nameElement.style.opacity = "1";
}
function hideNavItemName() {
  const nameElement = document.getElementById("nav-item-name");
  if (nameElement) {
    nameElement.style.opacity = "0";
  }
}

//PARTICLES

function createParticles() {
  const particleCount = 1000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const color = new THREE.Color(0x2b6bff);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 40;
    positions[i + 1] = (Math.random() - 0.5) * 40;
    positions[i + 2] = (Math.random() - 0.5) * 40;

    const shade = 0.8 + Math.random() * 0.4;
    colors[i] = color.r * shade;
    colors[i + 1] = color.g * shade;
    colors[i + 2] = color.b * shade;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function updateParticles() {
  const positions = particles.geometry.attributes.position.array;
  const colors = particles.geometry.attributes.color.array;
  const time = Date.now() * 0.001;

  const baseColor = new THREE.Color(0xffffff);
  const highlightColor = new THREE.Color(0x2b6bff);

  for (let i = 0; i < positions.length; i += 3) {
    // oscillation stuff
    positions[i + 1] += Math.sin(time + positions[i] * 0.1) * 0.002;

    // mouse stuff
    const distanceToMouse = mousePosition.distanceTo(
      new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2])
    );
    if (distanceToMouse < 5) {
      const angle = time * 2 + i;
      positions[i] += Math.cos(angle) * 0.02;
      positions[i + 2] += Math.sin(angle) * 0.02;

      // change color based on mouse proximity
      const lerpFactor = Math.max(0, 1 - distanceToMouse / 5);
      const lerpedColor = baseColor.clone().lerp(highlightColor, lerpFactor);

      colors[i] = lerpedColor.r;
      colors[i + 1] = lerpedColor.g;
      colors[i + 2] = lerpedColor.b;
    } else {
      // return to original color
      const originalShade = 0.8 + (i % 12) / 30;
      colors[i] = baseColor.r * originalShade;
      colors[i + 1] = baseColor.g * originalShade;
      colors[i + 2] = baseColor.b * originalShade;
    }
  }

  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.color.needsUpdate = true;
}
//TEXT
function initTextAnimation() {
  const mainTitle = document.getElementById("main-title");
  const subTitle = document.getElementById("sub-title");

  [mainTitle, subTitle].forEach((element) => {
    element.innerHTML = element.textContent
      .split("")
      .map((char) => `<span>${char}</span>`)
      .join("");
  });

  mainTitle.style.letterSpacing = "0.2em";
}
function animateText() {
  const spans = document.querySelectorAll("#main-title span, #sub-title span");
  const time = Date.now() * 0.001;

  spans.forEach((span, index) => {
    const rect = span.getBoundingClientRect();
    const spanX = rect.left + rect.width / 2;
    const spanY = rect.top + rect.height / 2;

    const deltaX = mouseX * window.innerWidth - spanX;
    const deltaY = mouseY * window.innerHeight - spanY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const maxDistance = 200;
    const maxMovement = 200;

    let moveX = 0;
    let moveY = 0;

    if (distance < maxDistance) {
      const movement = (1 - distance / maxDistance) * maxMovement;
      const angle = Math.atan2(deltaY, deltaX);
      moveX = Math.cos(angle) * movement;
      moveY = Math.sin(angle) * movement;
    }

    const noiseValue = noise.noise3D(time * 0.5 + index * 0.1, 0, 0);
    const idleX = noiseValue * 5;
    const idleY = noiseValue * 5;

    span.style.transform = `translate(${idleX - moveX}px, ${idleY - moveY}px)`;
  });
}

//PAGES
function getPageContent(pageName) {
  switch (pageName) {
    case "About":
      return `
      <h1 class="page-title">About Me</h1>
      <p class="content-text">Front-End Developer with a unique blend of skills in web development and cybersecurity. Experienced in crafting secure and engaging user interfaces. Proficient in HTML5, CSS3, JavaScript, and secure coding standards. Dedicated to continuous learning and applying the latest technologies.</p>
      <br>
      <p class="content-text">With over 8 years of experience in the tech industry and 15 years of total work experience, I have successfully contributed to a wide range of projects, including front-end web development and cybersecurity initiatives. My expertise with modern web frameworks and tools, combined with a strong foundation in cybersecurity principles, enables me to develop secure, responsive, and user-friendly web applications.</p>
      <div class="btn-con">
      
      
        <a href="./assets/Ty_Flannagan_Resume.pdf" class="main-btn" download>
          <span class="btn-text">Download Resume</span>
          <span class="btn-icon"><i class="fas fa-download"></i></span>
        </a>
      </div>
      
      <ul class="skill-list">
        <li><i class="fab fa-js-square" title="JavaScript"></i></li>
         <li><i class="fab fa-css3-alt" title="CSS3"></i></li>
        <li><i class="fab fa-html5" title="HTML5"></i></li>
        <li><i class="fab fa-node-js" title="Node.js"></i></li>
        <li><i class="fas fa-cube" title="Three.js"></i></li>
        <li><i class="fab fa-react" title="React"></i></li>
        <li><i class="fas fa-chart-line" title="D3.js"></i></li>
        <li><i class="fas fa-vector-square" title="WebGL"></i></li>
      </ul>
      
    `;
    case "Portfolio":
      return `
        <h1 class="page-title">Some of my work...</h1>
        <div class="portfolio-container">
           ${createPortfolioOrb(
             "Cell Life Sim",
             "https://tflannagan.github.io/CellLifeSim/",
             ["html", "js", "css"],
             `<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e8eaed"><path d="M200-40v-40q0-140 65-226t169-174q-104-88-169-174t-65-226v-40h60v40q0 11 .5 20.5T262-840h436q1-10 1.5-19.5t.5-20.5v-40h60v40q0 140-65 226T526-480q104 88 169 174t65 226v40h-60v-40q0-11-.5-20.5T698-120H262q-1 10-1.5 19.5T260-80v40h-60Zm120-640h320q16-23 27.5-47.5T687-780H273q8 28 19.5 52.5T320-680Zm160 161q31-26 59-50.5t52-50.5H369q24 26 51.5 50.5T480-519ZM369-340h222q-24-26-52-50.5T480-441q-31 26-59 50.5T369-340Zm-96 160h414q-8-28-19.5-52.5T640-280H320q-16 23-27.5 47.5T273-180Z"/></svg>`
           )}
        ${createPortfolioOrb(
          "Scribblurse",
          "https://tflannagan.github.io/Scribblurse/",
          ["html", "css", "js"],
          `<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e8eaed"><path d="M160-120v-170l527-526q12-12 27-18t30-6q16 0 30.5 6t25.5 18l56 56q12 11 18 25.5t6 30.5q0 15-6 30t-18 27L330-120H160Zm80-80h56l393-392-28-29-29-28-392 393v56Zm560-503-57-57 57 57Zm-139 82-29-28 57 57-28-29ZM560-120q74 0 137-37t63-103q0-36-19-62t-51-45l-59 59q23 10 36 22t13 26q0 23-36.5 41.5T560-200q-17 0-28.5 11.5T520-160q0 17 11.5 28.5T560-120ZM183-426l60-60q-20-8-31.5-16.5T200-520q0-12 18-24t76-37q88-38 117-69t29-70q0-55-44-87.5T280-840q-45 0-80.5 16T145-785q-11 13-9 29t15 26q13 11 29 9t27-13q14-14 31-20t42-6q41 0 60.5 12t19.5 28q0 14-17.5 25.5T262-654q-80 35-111 63.5T120-520q0 32 17 54.5t46 39.5Z"/></svg>`
        )}
        ${createPortfolioOrb(
          "Artist Site",
          "https://tflannagan.github.io/MusicPortfolio/",
          ["html", "css", "js"],
          `<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e8eaed"><path d="M679.89-117q-5.89 0-11.8-1.33-5.92-1.34-11.09-4.67l-135-79q-10.62-6.12-16.31-16.44Q500-228.76 500-241v-157q0-12.24 5.69-22.56Q511.38-430.88 522-437l135-79q5.21-3.33 11.15-4.67 5.95-1.33 11.9-1.33t11.4 1.67q5.46 1.66 10.55 4.33l135 79q10.73 6.12 16.87 16.44Q860-410.24 860-398v157q0 12.24-6.13 22.56Q847.73-208.12 837-202l-135 79q-5.16 2.67-10.68 4.33-5.53 1.67-11.43 1.67ZM400-485q-66 0-108-42t-42-108q0-66 42-108t108-42q66 0 108 42t42 108q0 66-42 108t-108 42ZM80-164v-94q0-35 17.5-63t50.5-43q72-32 133.5-46T400-424h23q-6 14-9 27.5t-5 32.5h-9q-58 0-113.5 12.5T172-310q-16 8-24 22.5t-8 29.5v34h269q5 18 12 32.5t17 27.5H80Zm320-381q39 0 64.5-25.5T490-635q0-39-25.5-64.5T400-725q-39 0-64.5 25.5T310-635q0 39 25.5 64.5T400-545Zm0-90Zm9 411Zm169-188 102 60 102-60-102-59-102 59Zm127 228 105-59.7V-370l-105 62v124Zm-155-60 105 62v-125.15L550-368v124Z"/></svg>`
        )}

          
        </div>
      `;
    case "Contact":
      return `
        <h1 class="page-title">Get in Touch</h1>
        <div class="contact-container">
          <div class="contact-card" data-type="email">
            <div class="contact-icon"><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e8eaed"><path d="M120-160v-640l760 320-760 320Zm60-93 544-227-544-230v168l242 62-242 60v167Zm0 0v-457 457Z"/></svg></div>
            <h3>Email</h3>
            <p>flannagantyler@gmail.com</p>
          </div>
          <div class="contact-card" data-type="phone">
            <div class="contact-icon"><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e8eaed"><path d="M795-120q-116 0-236.5-56T335-335Q232-438 176-558.5T120-795q0-19.29 12.86-32.14Q145.71-840 165-840h140q14 0 24 10t14 25l26.93 125.64Q372-665 369.5-653.5t-10.73 19.73L259-533q26 44 55 82t64 72q37 38 78 69.5t86 55.5l95-98q10-11 23.15-15 13.15-4 25.85-2l119 26q15 4 25 16.04 10 12.05 10 26.96v135q0 19.29-12.86 32.14Q814.29-120 795-120ZM229-588l81-82-23-110H180q2 42 13.5 88.5T229-588Zm369 363q41 19 89 31t93 14v-107l-103-21-79 83ZM229-588Zm369 363Z"/></svg></div>
            <h3>Phone</h3>
            <p>775.276.9974</p>
          </div>
          <div class="contact-card" data-type="location">
            <div class="contact-icon"><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e8eaed"><path d="M370-440h60v-120h100v120h60v-185l-110-73-110 73v185Zm110 281q133-121 196.5-219.5T740-552q0-118-75.5-193T480-820q-109 0-184.5 75T220-552q0 75 65 173.5T480-159Zm0 79Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"/></svg></div>
            <h3>Location</h3>
            <p>Reno, Nevada</p>
          </div>
          <div class="contact-card" data-type="social">
            <div class="contact-icon"><svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e8eaed"><path d="M0-240v-53q0-38.57 41.5-62.78Q83-380 150.38-380q12.16 0 23.39.5t22.23 2.15q-8 17.35-12 35.17-4 17.81-4 37.18v65H0Zm240 0v-65q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v65H240Zm540 0v-65q0-19.86-3.5-37.43T765-377.27q11-1.73 22.17-2.23 11.17-.5 22.83-.5 67.5 0 108.75 23.77T960-293v53H780Zm-480-60h360v-6q0-37-50.5-60.5T480-390q-79 0-129.5 23.5T300-305v5ZM149.57-410q-28.57 0-49.07-20.56Q80-451.13 80-480q0-29 20.56-49.5Q121.13-550 150-550q29 0 49.5 20.5t20.5 49.93q0 28.57-20.5 49.07T149.57-410Zm660 0q-28.57 0-49.07-20.56Q740-451.13 740-480q0-29 20.56-49.5Q781.13-550 810-550q29 0 49.5 20.5t20.5 49.93q0 28.57-20.5 49.07T809.57-410ZM480-480q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm.35-60Q506-540 523-557.35t17-43Q540-626 522.85-643t-42.5-17q-25.35 0-42.85 17.15t-17.5 42.5q0 25.35 17.35 42.85t43 17.5ZM480-300Zm0-300Z"/></svg></div>
            <h3>Social Media</h3>
            <div class="social-links">
              <a href="https://www.linkedin.com/in/ty-flannagan-774622251/" target="_blank" aria-label="LinkedIn Profile">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://github.com/tflannagan" target="_blank" aria-label="GitHub Profile">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
                   <a href="https://x.com/TytheDev" target="_blank" aria-label="GitHub Profile">
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50">
<path d="M 11 4 C 7.134 4 4 7.134 4 11 L 4 39 C 4 42.866 7.134 46 11 46 L 39 46 C 42.866 46 46 42.866 46 39 L 46 11 C 46 7.134 42.866 4 39 4 L 11 4 z M 13.085938 13 L 21.023438 13 L 26.660156 21.009766 L 33.5 13 L 36 13 L 27.789062 22.613281 L 37.914062 37 L 29.978516 37 L 23.4375 27.707031 L 15.5 37 L 13 37 L 22.308594 26.103516 L 13.085938 13 z M 16.914062 15 L 31.021484 35 L 34.085938 35 L 19.978516 15 L 16.914062 15 z"></path>
</svg>
              </a>
            </div>
          </div>
        </div>
      `;
    default:
      return "<p>Content not available</p>";
  }
}
function createPortfolioOrb(title, url, tools, icon) {
  const toolIcons = {
    html: '<i class="fab fa-html5" title="HTML5"></i>',
    css: '<i class="fab fa-css3-alt" title="CSS3"></i>',
    js: '<i class="fab fa-js-square" title="JavaScript"></i>',
    react: '<i class="fab fa-react" title="React"></i>',
    nodejs: '<i class="fab fa-node-js" title="Node.js"></i>',
    mongodb: '<i class="fas fa-database" title="MongoDB"></i>',
    d3: '<i class="fas fa-chart-line" title="D3.js"></i>',
    threejs: '<i class="fas fa-cube" title="Three.js"></i>',
    webgl: '<i class="fas fa-vector-square" title="WebGL"></i>',
  };

  const toolIconsHtml = tools.map((tool) => toolIcons[tool] || "").join("");

  return `
    <div class="portfolio-orb-container">
      <a href="${url}" target="_blank" class="portfolio-orb">
        <div class="portfolio-orb-content">
          <div class="portfolio-icon">${icon}</div>
         
          <div class="portfolio-tools">${toolIconsHtml}</div>
        </div>
      </a>
    </div>
  `;
}

function showProjectDetails(projectName) {
  const modal = document.createElement("div");
  modal.className = "project-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h2>${projectName}</h2>
      <p>Detailed information about ${projectName} would go here.</p>
      <button class="close-modal">Close</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".close-modal").addEventListener("click", () => {
    modal.remove();
  });
}
function showContent(pageName) {
  const content = getPageContent(pageName);
  const contentElement = document.getElementById("content");
  if (contentElement) {
    contentElement.innerHTML = content;
    const contentOverlay = document.getElementById("content-overlay");
    if (contentOverlay) {
      contentOverlay.classList.add("active");
    }

    handleInteractiveElements();
  } else {
    console.warn("Content element not found");
  }
}
function hideContent() {
  contentOverlay.classList.remove("active");

  const spans = animatedText.querySelectorAll("span");
  spans.forEach((span) => {
    span.style.animation = "none";
    span.offsetHeight;
    span.style.animation = null;
    span.style.transform = "translate(0, 0) rotate(0deg)";
    span.style.opacity = "1";
  });
}
function createContentOverlay() {
  contentOverlay = document.createElement("div");
  contentOverlay.id = "content-overlay";
  contentOverlay.innerHTML = `
    <div class="content-container">
      <button id="close-button">&times;</button>
      <div id="content"></div>
    </div>
  `;
  document.body.appendChild(contentOverlay);

  document
    .getElementById("close-button")
    .addEventListener("click", hideContent);
}

//ACTION FUNCTIONS
function handleInteractiveElements() {
  const content = document.getElementById("content");
  if (!content) {
    console.warn("Content element not found");
    return;
  }

  const projectCards = content.querySelectorAll(".project-card");
  projectCards.forEach((card) => {
    card.addEventListener("click", () => {
      const videoId = card.dataset.videoId;
      if (videoId) {
        showVideo(videoId);
      } else {
        console.warn("No video ID found for this project card");
      }
    });
  });

  const projectLinks = content.querySelectorAll(".project-link");
  projectLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });
}
function initializeVideoModal() {
  const modal = document.getElementById("video-modal");
  const closeModal = modal.querySelector(".close-modal");
  const videoContainer = document.getElementById("video-container");

  closeModal.addEventListener("click", hideVideo);

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      hideVideo();
    }
  });

  function showVideo(videoId) {
    videoContainer.innerHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    modal.style.display = "block";
  }

  function hideVideo() {
    videoContainer.innerHTML = "";
    modal.style.display = "none";
  }
}
function handleFormSubmission(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");

  if (!name || !email || !message) {
    showFormError("Please fill in all fields.");
    return;
  }

  if (!isValidEmail(email)) {
    showFormError("Please enter a valid email address.");
    return;
  }

  console.log("Form submitted:", { name, email, message });

  showFormSuccess("Thank you for your message! We'll get back to you soon.");
  form.reset();
}
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
function showFormError(message) {
  const errorElement = document.createElement("div");
  errorElement.className = "form-error";
  errorElement.textContent = message;

  const form = document.getElementById("contact-form");
  form.insertBefore(errorElement, form.firstChild);

  setTimeout(() => {
    errorElement.remove();
  }, 5000);
}
function showFormSuccess(message) {
  const successElement = document.createElement("div");
  successElement.className = "form-success";
  successElement.textContent = message;

  const form = document.getElementById("contact-form");
  form.insertBefore(successElement, form.firstChild);

  setTimeout(() => {
    successElement.remove();
  }, 5000);
}
function handleSocialLinkClick(e) {
  e.preventDefault();
  const platform = e.target.dataset.platform;
  const url = e.target.href;

  console.log(`Clicked ${platform} link`);

  window.open(url, "_blank");
}
function onMouseMove(event) {
  mouseX = event.clientX / window.innerWidth;
  mouseY = event.clientY / window.innerHeight;

  // mouse position for raycaster
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  mousePosition = raycaster.ray.at(20, new THREE.Vector3());
  const intersects = raycaster.intersectObjects(navObjects);

  let hoveredObject = null;

  const distanceToCenter = Math.sqrt(
    Math.pow(mouse.x, 2) + Math.pow(mouse.y + 0.6, 2)
  );
  isRotating = distanceToCenter > 0.4;

  navObjects.forEach((obj) => {
    const screenPosition = obj.position.clone().project(camera);
    const distanceToMouse = Math.sqrt(
      Math.pow(screenPosition.x - mouse.x, 2) +
        Math.pow(screenPosition.y - mouse.y, 2)
    );

    if (distanceToMouse < 0.1) {
      obj.userData.hoverStrength = Math.min(
        obj.userData.hoverStrength + 0.2,
        1
      );
      hoveredObject = obj;
    } else {
      obj.userData.hoverStrength *= 0.7;
    }
  });

  if (hoveredObject) {
    document.body.style.cursor = "pointer";
    showNavItemName(hoveredObject, event);
  } else {
    document.body.style.cursor = "default";
    hideNavItemName();
  }
}
function updateMouseLight() {
  if (!window.mouseLight) {
    window.mouseLight = new THREE.PointLight(0xffffff, 1, 10);
    scene.add(window.mouseLight);
  }

  const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));
  window.mouseLight.position.copy(pos);
}
function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(navObjects);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    showContent(clickedObject.userData.name);
  } else if (contentOverlay.classList.contains("active")) {
    hideContent();
  }
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function initializeVideoDemo() {
  const projectCards = document.querySelectorAll(".project-card");
  const modal = document.getElementById("video-modal");
  const closeModal = document.querySelector(".close-modal");
  const videoContainer = document.getElementById("video-container");

  if (!modal || !closeModal || !videoContainer) {
    console.warn("Required elements for video demo not found");
    return;
  }

  projectCards.forEach((card) => {
    card.addEventListener("click", () => {
      const videoId = card.dataset.videoId;
      if (videoId) {
        showVideo(videoId);
      } else {
        console.warn("No video ID found for this project card");
      }
    });
  });

  closeModal.addEventListener("click", hideVideo);

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      hideVideo();
    }
  });

  function showVideo(videoId) {
    videoContainer.innerHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    modal.style.display = "block";
  }

  function hideVideo() {
    videoContainer.innerHTML = "";
    modal.style.display = "none";
  }
}

function addHoverEffects() {
  const projectCards = document.querySelectorAll(".project-card");
  const skillItems = document.querySelectorAll(".skill-list li");
  const contactCards = document.querySelectorAll(".contact-card");

  function addTiltEffect(elements) {
    elements.forEach((element) => {
      element.addEventListener("mousemove", (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const xc = rect.width / 2;
        const yc = rect.height / 2;

        const dx = x - xc;
        const dy = y - yc;

        element.style.transform = `perspective(1000px) rotateY(${
          dx / 20
        }deg) rotateX(${-dy / 20}deg) translateY(-5px)`;
      });

      element.addEventListener("mouseleave", () => {
        element.style.transform =
          "perspective(1000px) rotateY(0) rotateX(0) translateY(0)";
      });
    });
  }

  addTiltEffect(projectCards);
  addTiltEffect(skillItems);
  addTiltEffect(contactCards);

  // ripple effect for buttons
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach((button) => {
    button.addEventListener("click", function (e) {
      let ripple = document.createElement("span");
      ripple.classList.add("ripple");
      this.appendChild(ripple);
      let x = e.clientX - e.target.offsetLeft;
      let y = e.clientY - e.target.offsetTop;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      setTimeout(() => {
        ripple.remove();
      }, 300);
    });
  });
}

//ANIMATION
function animate() {
  requestAnimationFrame(animate);
  updateNavObjects();
  updateParticles();
  animateText();
  updateMouseLight();
  renderer.render(scene, camera);
}

init();
animate();
