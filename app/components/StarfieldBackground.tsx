'use client';

import React, { useEffect, useRef } from 'react';

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
  gl_FragColor = vec4(vec3(stars), stars);
}
`;

interface StarfieldBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  backgroundOnly?: boolean;
}

export const StarfieldBackground: React.FC<StarfieldBackgroundProps> = ({ 
  children, 
  className = '',
  backgroundOnly = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    // 只在客戶端執行，避免 SSR 問題
    if (typeof window === 'undefined') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    // Add safety check for WebGL support
    let glContext: WebGLRenderingContext | null = null;
    try {
      glContext = (canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    } catch (error) {
      console.warn('WebGL context creation failed:', error);
      return;
    }

    if (!glContext) {
      console.warn('WebGL not supported, falling back to CSS background');
      return;
    }

    // Type assertion for WebGL context
    const gl = glContext as WebGLRenderingContext;

    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log('StarfieldBackground: WebGL context created');

    // Resize handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    };

    // Compile shader helper
    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Failed to create shader');

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compilation error: ${error}`);
      }

      return shader;
    };

    try {
      // Compile shaders
      const vertShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
      const fragShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

      // Create and link program
      const program = gl.createProgram();
      if (!program) throw new Error('Failed to create program');

      gl.attachShader(program, vertShader);
      gl.attachShader(program, fragShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
      }

      gl.useProgram(program);

      // Set up geometry
      const posLoc = gl.getAttribLocation(program, 'position');
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      // Get uniform locations
      const iResolution = gl.getUniformLocation(program, 'iResolution');
      const iTime = gl.getUniformLocation(program, 'iTime');

      // Initial resize
      resize();

      // Clear to ensure WebGL is working
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Render loop
      const render = (time: number) => {
        if (iResolution) gl.uniform2f(iResolution, canvas.width, canvas.height);
        if (iTime) gl.uniform1f(iTime, time * 0.001);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animationRef.current = requestAnimationFrame(render);
      };

      animationRef.current = requestAnimationFrame(render);

      // Add resize listener
      window.addEventListener('resize', resize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', resize);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        gl.deleteBuffer(buffer);
      };
    } catch (error) {
      // Use more specific error handling to avoid interference with other error handlers
      if (error instanceof Error) {
        console.warn('StarfieldBackground WebGL initialization failed:', error.message);
      } else {
        console.warn('StarfieldBackground WebGL initialization failed with unknown error');
      }
      // Return undefined for error path
      return undefined;
    }
  }, []);

  const canvas = (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );

  // If backgroundOnly is true, just return the canvas
  if (backgroundOnly) {
    return canvas;
  }

  // If no children provided, just return the canvas with gradient background
  if (!children) {
    return (
      <div className='fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
        {canvas}
      </div>
    );
  }

  // Full UniversalBackground functionality with children
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Background layer with starfield */}
      <div className='fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
        {canvas}
      </div>

      {/* Content layer - must be above background */}
      <div className='relative z-10'>{children}</div>
    </div>
  );
};
