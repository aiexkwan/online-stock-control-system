'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVisualSystem } from './VisualSystemProvider';
import { PERFORMANCE_CONFIG } from '../config/performance-config';

// WebGL實例管理（單例模式）
class WebGLManager {
  private static instance: WebGLManager | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private animationId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isInitialized = false;
  private observers: Set<() => void> = new Set();

  private constructor() {}

  static getInstance(): WebGLManager {
    if (!WebGLManager.instance) {
      WebGLManager.instance = new WebGLManager();
    }
    return WebGLManager.instance;
  }

  // 訂閱狀態變化
  subscribe(callback: () => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  // 通知所有觀察者
  private notify() {
    this.observers.forEach(callback => callback());
  }

  // 獲取當前canvas
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  // 更新 Canvas 尺寸（修復壓縮問題）
  updateCanvasSize(canvas: HTMLCanvasElement) {
    if (!canvas || !this.gl) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // 設置 canvas 內部解析度與顯示尺寸保持正確比例
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // 更新 WebGL viewport
    this.gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // 初始化WebGL
  async initialize(
    canvas: HTMLCanvasElement,
    vertexShader: string,
    fragmentShader: string
  ): Promise<boolean> {
    if (this.isInitialized && this.canvas === canvas) {
      return true;
    }

    // 清理舊的實例
    if (this.isInitialized) {
      this.cleanup();
    }

    try {
      this.canvas = canvas;
      this.gl = (canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

      if (!this.gl) {
        console.warn('WebGL not supported');
        return false;
      }

      // 編譯著色器
      const vs = this.compileShader(this.gl, vertexShader, this.gl.VERTEX_SHADER);
      const fs = this.compileShader(this.gl, fragmentShader, this.gl.FRAGMENT_SHADER);

      if (!vs || !fs) {
        throw new Error('Shader compilation failed');
      }

      // 創建程序
      this.program = this.gl.createProgram();
      if (!this.program) {
        throw new Error('Failed to create program');
      }

      this.gl.attachShader(this.program, vs);
      this.gl.attachShader(this.program, fs);
      this.gl.linkProgram(this.program);

      if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
        throw new Error(`Program link error: ${this.gl.getProgramInfoLog(this.program)}`);
      }

      this.gl.useProgram(this.program);

      // 設置幾何體
      this.setupGeometry();

      // 初始設置正確的 canvas 尺寸
      this.updateCanvasSize(canvas);

      this.isInitialized = true;
      this.notify();
      return true;
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      this.cleanup();
      return false;
    }
  }

  // 編譯著色器
  private compileShader(
    gl: WebGLRenderingContext,
    source: string,
    type: number
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  // 設置幾何體
  private setupGeometry() {
    if (!this.gl || !this.program) return;

    const posLoc = this.gl.getAttribLocation(this.program, 'position');
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      this.gl.STATIC_DRAW
    );
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);
  }

  // 開始渲染
  startRendering(renderCallback: (gl: WebGLRenderingContext, program: WebGLProgram) => void) {
    if (!this.gl || !this.program || this.animationId !== null) return;

    const render = (time: number) => {
      if (this.gl && this.program) {
        renderCallback(this.gl, this.program);
      }
      this.animationId = requestAnimationFrame(render);
    };

    this.animationId = requestAnimationFrame(render);
  }

  // 停止渲染
  stopRendering() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // 清理資源
  cleanup() {
    this.stopRendering();

    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }

    this.gl = null;
    this.program = null;
    this.canvas = null;
    this.isInitialized = false;
    this.notify();
  }

  // 檢查是否已初始化
  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

// Shader sources
const vertexShaderSource = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

uniform vec2 iResolution;
uniform float iTime;

vec3 hash( vec3 p ) {
  p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
            dot(p,vec3(269.5,183.3,246.1)),
            dot(p,vec3(113.5,271.9,124.6)));
  return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec3 p ) {
  vec3 i = floor( p );
  vec3 f = fract( p );
  vec3 u = f*f*(3.0-2.0*f);
  return mix( mix( mix( dot( hash( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ),
                      dot( hash( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                 mix( dot( hash( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ),
                      dot( hash( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
            mix( mix( dot( hash( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ),
                      dot( hash( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                 mix( dot( hash( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ),
                      dot( hash( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec3 stars_direction = normalize(vec3(uv * 2.0 - 1.0, 1.0));
  float stars_threshold = 8.0;
  float stars_exposure = 200.0;
  float stars = pow(clamp(noise(stars_direction * 200.0), 0.0, 1.0), stars_threshold) * stars_exposure;
  stars *= mix(0.4, 1.4, noise(stars_direction * 100.0 + vec3(iTime)));
  gl_FragColor = vec4(vec3(stars),1.0);
}
`;

// 統一背景組件
export function UnifiedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef(WebGLManager.getInstance());
  const [isActive, setIsActive] = useState(false);
  const { state, config } = useVisualSystem();

  // 渲染回調（移除尺寸檢查，避免性能問題）
  const startRendering = useCallback(() => {
    managerRef.current.startRendering((gl, program) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 設置uniforms
      const iResolution = gl.getUniformLocation(program, 'iResolution');
      const iTime = gl.getUniformLocation(program, 'iTime');

      if (iResolution) gl.uniform2f(iResolution, canvas.width, canvas.height);
      if (iTime) gl.uniform1f(iTime, performance.now() * 0.001);

      // 繪製
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    });
  }, []); // Empty deps since it only uses refs

  // 處理可見性變化
  useEffect(() => {
    if (!PERFORMANCE_CONFIG.webgl.pauseWhenHidden) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        managerRef.current.stopRendering();
      } else if (isActive && state.starfieldEnabled) {
        startRendering();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, state.starfieldEnabled, startRendering]);

  // 初始化和啟動
  useEffect(() => {
    if (!state.starfieldEnabled || !state.webglSupported || !canvasRef.current) {
      setIsActive(false);
      return;
    }

    const initAndStart = async () => {
      const success = await managerRef.current.initialize(
        canvasRef.current!,
        vertexShaderSource,
        fragmentShaderSource
      );

      if (success) {
        setIsActive(true);
        startRendering();
      }
    };

    initAndStart();

    // Capture ref value for cleanup
    const currentManager = managerRef.current;
    return () => {
      if (currentManager) {
        currentManager.stopRendering();
      }
    };
  }, [state.starfieldEnabled, state.webglSupported, startRendering]);

  // 處理窗口大小變化（使用 ResizeObserver 取代 window resize）
  useEffect(() => {
    if (!canvasRef.current || !isActive) return;

    const resizeObserver = new ResizeObserver(() => {
      if (canvasRef.current && managerRef.current.getIsInitialized()) {
        managerRef.current.updateCanvasSize(canvasRef.current);
      }
    });

    resizeObserver.observe(canvasRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isActive]);

  // 如果不支持或禁用，顯示降級方案
  if (!state.starfieldEnabled || !state.webglSupported) {
    return <FallbackBackground />;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// 降級背景（CSS動畫）
function FallbackBackground() {
  const { state } = useVisualSystem();
  const [stars, setStars] = useState<
    Array<{
      width: number;
      height: number;
      left: number;
      top: number;
      animationDelay: number;
      animationDuration: number;
    }>
  >([]);

  // 只在客戶端生成星星位置，避免 hydration mismatch
  useEffect(() => {
    const generatedStars = Array.from({ length: 50 }, () => ({
      width: Math.random() * 3,
      height: Math.random() * 3,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 3 + Math.random() * 2,
    }));
    setStars(generatedStars);
  }, []);

  if (!state.animationsEnabled) {
    // 靜態背景
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(ellipse at center, #1b2735 0%, #090a0f 100%)',
          zIndex: 0,
        }}
      />
    );
  }

  // CSS動畫星空
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(ellipse at center, #1b2735 0%, #090a0f 100%)',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      <style jsx>{`
        @keyframes twinkle {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.3;
          }
        }

        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: twinkle 3s infinite;
        }
      `}</style>
      {stars.map((star, i) => (
        <div
          key={i}
          className='star'
          style={{
            width: `${star.width}px`,
            height: `${star.height}px`,
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDelay: `${star.animationDelay}s`,
            animationDuration: `${star.animationDuration}s`,
          }}
        />
      ))}
    </div>
  );
}
