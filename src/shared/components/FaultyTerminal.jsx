import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import './FaultyTerminal.css';

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision mediump float;

varying vec2 vUv;

uniform float iTime;
uniform vec3  iResolution;
uniform float uScale;

uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3  uTint;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;

float time;

float hash21(vec2 p){
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(vec2 p)
{
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2;
}

mat2 rotate(float angle)
{
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p)
{
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;

  mat2 modify0 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify0 * p * 2.0;
  amp *= 0.454545;

  mat2 modify1 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify1 * p * 2.0;
  amp *= 0.454545;

  mat2 modify2 = rotate(time * 0.08);
  f += amp * noise(p);

  return f;
}

float pattern(vec2 p, out vec2 q, out vec2 r) {
  vec2 offset1 = vec2(1.0);
  vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time);
  mat2 rot1 = rotate(0.1);

  q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}

float digit(vec2 p){
    vec2 grid = uGridMul * 15.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    vec2 q, r;
    float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;

    if(uUseMouse > 0.5){
        vec2 mouseWorld = uMouse * uScale;
        float distToMouse = distance(s, mouseWorld);
        float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
        intensity += mouseInfluence;

        float ripple = sin(distToMouse * 20.0 - iTime * 5.0) * 0.1 * mouseInfluence;
        intensity += ripple;
    }

    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);

        float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
        intensity *= fadeAlpha;
    }

    p = fract(p);
    p *= uDigitSize;

    float px5 = p.x * 5.0;
    float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5);
    float y = fract(py5);

    float i = floor(py5) - 2.0;
    float j = floor(px5) - 2.0;
    float n = i * i + j * j;
    float f = n * 0.0625;

    float isOn = step(0.1, intensity - f);
    float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);

    return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
}

float onOff(float a, float b, float c)
{
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

float displace(vec2 look)
{
    float y = look.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);
    return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
}

vec3 getColor(vec2 p){

    float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
    bar *= uScanlineIntensity;

    float displacement = displace(p);
    p.x += displacement;

    if (uGlitchAmount != 1.0) {
      float extra = displacement * (uGlitchAmount - 1.0);
      p.x += extra;
    }

    float middle = digit(p);

    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));

    vec3 baseColor = vec3(0.9) * middle + sum * 0.1 * vec3(1.0) * bar;
    return baseColor;
}

vec2 barrel(vec2 uv){
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  return c * 0.5 + 0.5;
}

void main() {
    time = iTime * 0.333333;
    vec2 uv = vUv;

    if(uCurvature != 0.0){
      uv = barrel(uv);
    }

    vec2 p = uv * uScale;
    vec3 col = getColor(p);

    if(uChromaticAberration != 0.0){
      vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
      col.r = getColor(p + ca).r;
      col.b = getColor(p - ca).b;
    }

    col *= uTint;
    col *= uBrightness;

    if(uDither > 0.0){
      float rnd = hash21(gl_FragCoord.xy);
      col += (rnd - 0.5) * (uDither * 0.003922);
    }

    gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r / 255, g / 255, b / 255];
}

function resolveDpr(providedDpr, resolutionScale = 1) {
  const clampedScale = Math.max(0.25, Math.min(1, resolutionScale || 1));
  if (typeof providedDpr === 'number') {
    return Math.min(Math.max(providedDpr, 0.25), 2);
  }
  if (typeof window === 'undefined') {
    return 1;
  }
  const base = Math.min(window.devicePixelRatio || 1, 2);
  return Math.min(Math.max(base * clampedScale, 0.25), 2);
}

export default function FaultyTerminal({
  scale = 1,
  gridMul = [2, 1],
  digitSize = 1.5,
  timeScale = 0.3,
  pause = false,
  scanlineIntensity = 0.3,
  glitchAmount = 1,
  flickerAmount = 1,
  noiseAmp = 0,
  chromaticAberration = 0,
  dither = 0,
  curvature = 0.2,
  tint = '#ffffff',
  mouseReact = true,
  mouseStrength = 0.2,
  dpr,
  pageLoadAnimation = true,
  brightness = 1,
  resolutionScale = 0.6,
  targetFPS = 30,
  className = '',
  style,
  ...rest
}) {
  const containerRef = useRef(null);
  const programRef = useRef(null);
  const rendererRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const frozenTimeRef = useRef(0);
  const rafRef = useRef(0);
  const loadAnimationStartRef = useRef(0);
  const timeOffsetRef = useRef(Math.random() * 100);
  const isVisibleRef = useRef(true);
  const lastFrameRef = useRef(0);

  const resolvedDpr = useMemo(() => resolveDpr(dpr, resolutionScale), [dpr, resolutionScale]);
  const tintVec = useMemo(() => hexToRgb(tint), [tint]);
  const ditherValue = useMemo(() => (typeof dither === 'boolean' ? Number(dither) : dither), [dither]);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    mouseRef.current = { x, y };
  }, []);

  useEffect(() => {
    const isWebGLAvailable = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (error) {
        return false;
      }
    };

    if (typeof window === 'undefined') {
      return () => {};
    }

    if (!isWebGLAvailable()) {
      return () => {};
    }

    const ctn = containerRef.current;
    if (!ctn) {
      return () => {};
    }

    let renderer;
    try {
      renderer = new Renderer({ dpr: resolvedDpr, alpha: false, antialias: false });
    } catch (error) {
      return () => {};
    }
    rendererRef.current = renderer;
    const { gl } = renderer;
    gl.clearColor(0, 0, 0, 1);
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.inset = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.pointerEvents = 'none';

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        uScale: { value: scale },

        uGridMul: { value: new Float32Array(gridMul) },
        uDigitSize: { value: digitSize },
        uScanlineIntensity: { value: scanlineIntensity },
        uGlitchAmount: { value: glitchAmount },
        uFlickerAmount: { value: flickerAmount },
        uNoiseAmp: { value: noiseAmp },
        uChromaticAberration: { value: chromaticAberration },
        uDither: { value: ditherValue },
        uCurvature: { value: curvature },
        uTint: { value: new Color(tintVec[0], tintVec[1], tintVec[2]) },
        uMouse: {
          value: new Float32Array([smoothMouseRef.current.x, smoothMouseRef.current.y]),
        },
        uMouseStrength: { value: mouseStrength },
        uUseMouse: { value: mouseReact ? 1 : 0 },
        uPageLoadProgress: { value: pageLoadAnimation ? 0 : 1 },
        uUsePageLoadAnimation: { value: pageLoadAnimation ? 1 : 0 },
        uBrightness: { value: brightness },
      },
    });
    programRef.current = program;

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!containerRef.current || !renderer) return;
      const width = containerRef.current.offsetWidth || 1;
      const height = containerRef.current.offsetHeight || 1;
      renderer.setSize(width, height);
      program.uniforms.iResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }

    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(() => resize()) : null;
    resizeObserver?.observe(ctn);
    resize();

    const frameInterval = targetFPS && targetFPS > 0 ? 1000 / targetFPS : 0;
    lastFrameRef.current = 0;
    isVisibleRef.current = true;

    const intersectionObserver =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => {
              if (entries[0]) {
                isVisibleRef.current = entries[0].isIntersecting;
                if (isVisibleRef.current) {
                  lastFrameRef.current = 0;
                }
              }
            },
            { threshold: 0.01 }
          )
        : null;
    intersectionObserver?.observe(ctn);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        isVisibleRef.current = true;
        lastFrameRef.current = 0;
      } else {
        isVisibleRef.current = false;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const update = (t) => {
      rafRef.current = window.requestAnimationFrame(update);

      const visible = isVisibleRef.current && !document.hidden;
      if (!visible) {
        return;
      }

      if (frameInterval) {
        if (lastFrameRef.current === 0) {
          lastFrameRef.current = t;
        } else if (t - lastFrameRef.current < frameInterval) {
          return;
        } else {
          lastFrameRef.current = t;
        }
      }

      if (pageLoadAnimation && loadAnimationStartRef.current === 0) {
        loadAnimationStartRef.current = t;
      }

      if (!pause) {
        const elapsed = (t * 0.001 + timeOffsetRef.current) * timeScale;
        program.uniforms.iTime.value = elapsed;
        frozenTimeRef.current = elapsed;
      } else {
        program.uniforms.iTime.value = frozenTimeRef.current;
      }

      if (pageLoadAnimation && loadAnimationStartRef.current > 0) {
        const animationDuration = 2000;
        const animationElapsed = t - loadAnimationStartRef.current;
        const progress = Math.min(animationElapsed / animationDuration, 1);
        program.uniforms.uPageLoadProgress.value = progress;
      }

      if (mouseReact) {
        const dampingFactor = 0.08;
        const smoothMouse = smoothMouseRef.current;
        const mouse = mouseRef.current;
        smoothMouse.x += (mouse.x - smoothMouse.x) * dampingFactor;
        smoothMouse.y += (mouse.y - smoothMouse.y) * dampingFactor;

        const mouseUniform = program.uniforms.uMouse.value;
        mouseUniform[0] = smoothMouse.x;
        mouseUniform[1] = smoothMouse.y;
      }

      renderer.render({ scene: mesh });
    };
    rafRef.current = window.requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    if (mouseReact) {
      window.addEventListener('pointermove', handleMouseMove, { passive: true });
    }

    return () => {
      window.cancelAnimationFrame(rafRef.current);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (mouseReact) {
        window.removeEventListener('pointermove', handleMouseMove);
      }
      if (gl.canvas.parentElement === ctn) {
        ctn.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      loadAnimationStartRef.current = 0;
      timeOffsetRef.current = Math.random() * 100;
      rendererRef.current = null;
      programRef.current = null;
    };
  }, [
    resolvedDpr,
    pause,
    timeScale,
    scale,
    gridMul,
    digitSize,
    scanlineIntensity,
    glitchAmount,
    flickerAmount,
    noiseAmp,
    chromaticAberration,
    ditherValue,
    curvature,
    tintVec,
    mouseReact,
    mouseStrength,
    pageLoadAnimation,
    brightness,
    resolutionScale,
    targetFPS,
    handleMouseMove,
  ]);

  useEffect(() => {
    if (!programRef.current) return;
    programRef.current.uniforms.uTint.value = new Color(tintVec[0], tintVec[1], tintVec[2]);
  }, [tintVec]);

  useEffect(() => {
    if (!programRef.current) return;
    programRef.current.uniforms.uMouseStrength.value = mouseStrength;
  }, [mouseStrength]);

  useEffect(() => {
    if (!programRef.current) return;
    programRef.current.uniforms.uBrightness.value = brightness;
  }, [brightness]);

  return <div className={`faulty-terminal-container ${className}`.trim()} ref={containerRef} style={style} {...rest} />;
}

FaultyTerminal.propTypes = {
  scale: PropTypes.number,
  gridMul: PropTypes.arrayOf(PropTypes.number),
  digitSize: PropTypes.number,
  timeScale: PropTypes.number,
  pause: PropTypes.bool,
  scanlineIntensity: PropTypes.number,
  glitchAmount: PropTypes.number,
  flickerAmount: PropTypes.number,
  noiseAmp: PropTypes.number,
  chromaticAberration: PropTypes.number,
  dither: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  curvature: PropTypes.number,
  tint: PropTypes.string,
  mouseReact: PropTypes.bool,
  mouseStrength: PropTypes.number,
  dpr: PropTypes.number,
  pageLoadAnimation: PropTypes.bool,
  brightness: PropTypes.number,
  resolutionScale: PropTypes.number,
  targetFPS: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.shape({}),
};

FaultyTerminal.defaultProps = {
  scale: 1,
  gridMul: [2, 1],
  digitSize: 1.5,
  timeScale: 0.3,
  pause: false,
  scanlineIntensity: 0.3,
  glitchAmount: 1,
  flickerAmount: 1,
  noiseAmp: 0,
  chromaticAberration: 0,
  dither: 0,
  curvature: 0.2,
  tint: '#ffffff',
  mouseReact: true,
  mouseStrength: 0.2,
  dpr: null,
  pageLoadAnimation: true,
  brightness: 1,
  resolutionScale: 0.6,
  targetFPS: 30,
  className: '',
  style: {},
};
