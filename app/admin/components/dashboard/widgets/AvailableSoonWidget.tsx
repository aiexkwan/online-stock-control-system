'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AvailableSoonWidgetProps {
  title: string;
}

export default function AvailableSoonWidget({ title }: AvailableSoonWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex items-center justify-center"
    >
      <p className="text-2xl text-muted-foreground">Available Soon</p>
    </motion.div>
  );
}