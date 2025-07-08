'use client';

import React, { useState, useEffect } from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useSoundSettings, useSoundFeedback } from '@/app/hooks/useSoundFeedback';

export function SoundSettingsToggle() {
  const soundSettings = useSoundSettings();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const sound = useSoundFeedback({ enabled: true, volume: soundSettings.getSoundVolume() });

  // Initialize from localStorage
  useEffect(() => {
    setSoundEnabled(soundSettings.getSoundEnabled());
  }, [soundSettings]);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    soundSettings.setSoundEnabled(newValue);

    // Play a test sound if enabling
    if (newValue) {
      sound.playScan();
    }
  };

  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={toggleSound}
      className='text-slate-400 hover:text-white'
      title={soundEnabled ? 'Disable sound feedback' : 'Enable sound feedback'}
    >
      {soundEnabled ? (
        <SpeakerWaveIcon className='h-5 w-5' />
      ) : (
        <SpeakerXMarkIcon className='h-5 w-5' />
      )}
    </Button>
  );
}
