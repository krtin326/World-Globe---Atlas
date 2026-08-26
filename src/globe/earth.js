/**
 * earth.js — the textured globe itself.
 *
 * The colour map (NASA Blue Marble Next Generation, topography + bathymetry)
 * already has relief baked into it, but baked relief is lit from a fixed
 * direction and cannot respond to the sun. So the fragment shader re-derives a
 * surface normal from the GEBCO elevation map and lights that. The result is a
 * globe whose mountain ranges catch the light and cast the right way as the
 * terminator moves, which is what makes it read as terrain rather than as a
 * photograph pasted on a ball.
 *
 * Three extra touches, all cheap:
 *   - the night-lights map fades in on the dark side instead of black;
 *   - the ocean mask drives a specular highlight, so water glints and land does not;
 *   - a Fresnel rim tints the limb, standing in for atmospheric scattering.
 */

import * as THREE from 'three';

/** Ocean glint strength with the sun in a fixed position. */
export const SPECULAR_FIXED_SUN = 0.22;
/** ...and with the sun tied to the camera, where a real glint cannot occur. */
export const SPECULAR_FOLLOW_SUN = 0.03;

const VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;

uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uElev;
uniform sampler2D uOcean;

uniform vec3  uSunDir;        // view space, normalised
uniform float uReliefScale;   // 0 = flat colour map, 1 = pronounced
uniform float uNightStrength;
uniform float uAmbient;
uniform vec3  uRimColor;
uniform float uRimStrength;
uniform float uSpecStrength;
uniform vec2  uElevTexel;     // 1 / elevation map size

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec3 N = normalize(vNormal);

  // --- relief -----------------------------------------------------------
  // Central differences on the height map give a slope in texture space. To
  // turn that into a normal we need east/north directions on the sphere:
  // for an equirectangular map, east is perpendicular to the polar axis.
  float hL = texture2D(uElev, vUv - vec2(uElevTexel.x, 0.0)).r;
  float hR = texture2D(uElev, vUv + vec2(uElevTexel.x, 0.0)).r;
  float hD = texture2D(uElev, vUv - vec2(0.0, uElevTexel.y)).r;
  float hU = texture2D(uElev, vUv + vec2(0.0, uElevTexel.y)).r;

  vec3 polar = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  vec3 east  = normalize(cross(polar, N));
  vec3 north = normalize(cross(N, east));

  // Slopes are compressed towards the poles by the projection; without the
  // cos(lat) correction Greenland and Antarctica turn into noise.
  float lat = (vUv.y - 0.5) * 3.14159265;
  float cosLat = max(cos(lat), 0.15);

  float dHdx = (hR - hL) / cosLat;
  float dHdy = (hU - hD);

  N = normalize(N - uReliefScale * (east * dHdx + north * dHdy));

  // --- lighting ---------------------------------------------------------
  vec3 L = normalize(uSunDir);
  float ndl = dot(N, L);

  // Soften the terminator. A hard step looks like a shadow edge on a ball;
  // a few degrees of falloff reads as atmosphere.
  float day = smoothstep(-0.12, 0.18, ndl);

  vec3 dayColor = texture2D(uDay, vUv).rgb;
  vec3 nightColor = texture2D(uNight, vUv).rgb;
  float ocean = texture2D(uOcean, vUv).r;

  vec3 lit = dayColor * (uAmbient + (1.0 - uAmbient) * max(ndl, 0.0));

  // Specular, water only. The exponent has to be very high: the globe is a
  // perfect sphere lit by a directional source, so even a fairly tight lobe
  // spreads into a pale blob covering a whole ocean basin instead of reading
  // as a sun glint. Strength is a uniform because it has to drop to almost
  // nothing when the sun is parked next to the camera — with L and V nearly
  // parallel, dot(N,H) stays near 1 across most of the visible hemisphere and
  // any appreciable specular washes the oceans out.
  vec3 V = normalize(vViewDir);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 900.0) * ocean * day;
  lit += vec3(0.55, 0.68, 0.85) * spec * uSpecStrength;

  // City lights, strongest where it is fully dark.
  vec3 color = mix(nightColor * uNightStrength, lit, day);

  // --- limb -------------------------------------------------------------
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  color += uRimColor * fresnel * uRimStrength * (0.25 + 0.75 * day);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

/**
 * @param {THREE.LoadingManager} manager
 * @param {string} texturePath
 * @returns {{mesh: THREE.Mesh, material: THREE.ShaderMaterial, setSun: Function}}
 */
export function createEarth(manager, texturePath = 'textures/') {
  const loader = new THREE.TextureLoader(manager);

  const load = (file, srgb) => {
    const t = loader.load(texturePath + file);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    t.wrapS = THREE.RepeatWrapping;   // seamless across the antimeridian
    t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  };

  const day = load('earth_day_4k.jpg', true);
  const night = load('earth_night_2k.jpg', true);
  const elev = load('earth_elev_2k.jpg', false);
  const ocean = load('earth_ocean_2k.jpg', false);

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uDay: { value: day },
      uNight: { value: night },
      uElev: { value: elev },
      uOcean: { value: ocean },
      uSunDir: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
      uReliefScale: { value: 2.2 },
      uNightStrength: { value: 0.85 },
      uAmbient: { value: 0.12 },
      uRimColor: { value: new THREE.Color(0x4a90e2) },
      uRimStrength: { value: 0.55 },
      uSpecStrength: { value: SPECULAR_FIXED_SUN },
      uElevTexel: { value: new THREE.Vector2(1 / 2048, 1 / 1024) },
    },
  });

  // 128 segments is plenty: the silhouette is smooth at any zoom we allow, and
  // all the surface detail comes from the shader rather than from geometry.
  const geometry = new THREE.SphereGeometry(1, 128, 96);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'earth';
  mesh.renderOrder = 0;

  return { mesh, material };
}

/**
 * Glow shell. Renders back faces only, so it draws the halo *around* the
 * planet without covering it.
 */
export function createAtmosphere(radius = 1.025) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(0x3d7fd6) },
      uIntensity: { value: 0.9 },
      uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform vec3 uSunDir;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        // Back faces, so the normal points inwards: flip it before use.
        vec3 N = normalize(-vNormal);
        float rim = pow(1.0 - abs(dot(N, normalize(vViewDir))), 2.6);
        // Brightest where the limb is sunlit, which puts the glow on the
        // correct side instead of ringing the planet uniformly.
        float sun = smoothstep(-0.5, 0.6, dot(N, normalize(uSunDir)));
        gl_FragColor = vec4(uColor, rim * uIntensity * (0.15 + 0.85 * sun));
      }
    `,
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), material);
  mesh.name = 'atmosphere';
  mesh.renderOrder = 3;
  return { mesh, material };
}

/** Distant star field, so the background is not flat black. */
export function createStars(count = 4000, radius = 90) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Uniform on the sphere: acos of a uniform variable, not a uniform angle,
    // otherwise stars bunch up at the poles.
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = radius * s * Math.cos(theta);
    positions[i * 3 + 1] = radius * u;
    positions[i * 3 + 2] = radius * s * Math.sin(theta);

    // A little colour variation reads as more natural than pure white.
    const warm = Math.random();
    colors[i * 3] = 0.85 + warm * 0.15;
    colors[i * 3 + 1] = 0.88 + Math.random() * 0.12;
    colors[i * 3 + 2] = 0.95 + Math.random() * 0.05;

    // Mostly faint with a few bright ones, roughly like a real magnitude
    // distribution.
    sizes[i] = Math.pow(Math.random(), 3.2) * 2.6 + 0.35;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uPixelRatio: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float size;
      uniform float uPixelRatio;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uPixelRatio;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        // Round off the square point sprite and give it a soft edge.
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.1, d);
        gl_FragColor = vec4(vColor, a);
      }
    `,
    vertexColors: true,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'stars';
  points.frustumCulled = false;
  return { points, material };
}
