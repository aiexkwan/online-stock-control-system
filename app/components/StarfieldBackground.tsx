'use client';

import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize nodes
    const numNodes = 50;
    const nodes: Node[] = [];

    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    nodesRef.current = nodes;

    // Animation loop
    const animate = () => {
      // Clear canvas with dark background
      ctx.fillStyle = 'rgba(15, 23, 42, 1)'; // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((node, index) => {
        // Update node position
        node.x += node.vx;
        node.y += node.vy;

        // Wrap around edges instead of bouncing
        if (node.x < -10) node.x = canvas.width + 10;
        if (node.x > canvas.width + 10) node.x = -10;
        if (node.y < -10) node.y = canvas.height + 10;
        if (node.y > canvas.height + 10) node.y = -10;

        // Draw connections to nearby nodes
        for (let j = index + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Connection distance threshold
          const maxDistance = 120;
          
          if (distance < maxDistance) {
            const opacity = (maxDistance - distance) / maxDistance * 0.4;
            
            ctx.save();
            ctx.globalAlpha = opacity;
            
            // Create gradient line
            const gradient = ctx.createLinearGradient(node.x, node.y, other.x, other.y);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.6)'); // blue-500
            gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.4)'); // purple-500
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0.6)'); // cyan-500
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Draw node
        ctx.save();
        ctx.globalAlpha = node.opacity;
        
        // Node glow effect
        const glowGradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.size * 4
        );
        glowGradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)'); // blue-500
        glowGradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.4)'); // purple-500
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'; // slate-200
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      // Add subtle animated grid pattern
      const time = Date.now() * 0.0005;
      const gridSize = 100;
      
      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = 'rgba(148, 163, 184, 1)'; // slate-400
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        const offset = Math.sin(time + x * 0.01) * 10;
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, canvas.height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        const offset = Math.cos(time + y * 0.01) * 10;
        ctx.beginPath();
        ctx.moveTo(0, y + offset);
        ctx.lineTo(canvas.width, y + offset);
        ctx.stroke();
      }
      
      ctx.restore();

      // Add floating data packets
      const packetTime = Date.now() * 0.002;
      
      for (let i = 0; i < 8; i++) {
        const progress = (packetTime + i * 0.5) % 1;
        const startNode = nodes[i % nodes.length];
        const endNode = nodes[(i + 1) % nodes.length];
        
        if (startNode && endNode) {
          const x = startNode.x + (endNode.x - startNode.x) * progress;
          const y = startNode.y + (endNode.y - startNode.y) * progress;
          
          ctx.save();
          ctx.globalAlpha = 0.6;
          
          // Packet glow
          const packetGradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
          packetGradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)'); // green-500
          packetGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = packetGradient;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Packet core
          ctx.fillStyle = 'rgba(34, 197, 94, 1)'; // green-500
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      }

      // Add pulsing central hub
      const hubTime = Date.now() * 0.003;
      const hubX = canvas.width * 0.5;
      const hubY = canvas.height * 0.5;
      const hubSize = 8 + Math.sin(hubTime) * 3;
      
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(hubTime) * 0.2;
      
      // Hub glow
      const hubGradient = ctx.createRadialGradient(hubX, hubY, 0, hubX, hubY, hubSize * 6);
      hubGradient.addColorStop(0, 'rgba(168, 85, 247, 0.6)'); // violet-500
      hubGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = hubGradient;
      ctx.beginPath();
      ctx.arc(hubX, hubY, hubSize * 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Hub core
      ctx.fillStyle = 'rgba(168, 85, 247, 0.8)'; // violet-500
      ctx.beginPath();
      ctx.arc(hubX, hubY, hubSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
} 