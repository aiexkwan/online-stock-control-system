import { dialogStyles, gradientOverlays, iconColors } from '../dialogStyles';

describe('dialogStyles', () => {
  describe('dialogStyles object', () => {
    it('should have all required style properties', () => {
      expect(dialogStyles).toHaveProperty('content');
      expect(dialogStyles).toHaveProperty('title');
      expect(dialogStyles).toHaveProperty('description');
      expect(dialogStyles).toHaveProperty('primaryButton');
      expect(dialogStyles).toHaveProperty('secondaryButton');
      expect(dialogStyles).toHaveProperty('card');
      expect(dialogStyles).toHaveProperty('input');
      expect(dialogStyles).toHaveProperty('select');
      expect(dialogStyles).toHaveProperty('tabActive');
      expect(dialogStyles).toHaveProperty('tabInactive');
      expect(dialogStyles).toHaveProperty('success');
      expect(dialogStyles).toHaveProperty('error');
      expect(dialogStyles).toHaveProperty('warning');
      expect(dialogStyles).toHaveProperty('info');
    });

    it('should have correct content style', () => {
      expect(dialogStyles.content).toContain('bg-slate-900/95');
      expect(dialogStyles.content).toContain('backdrop-blur-xl');
      expect(dialogStyles.content).toContain('border-slate-700/50');
      expect(dialogStyles.content).toContain('rounded-3xl');
      expect(dialogStyles.content).toContain('max-h-[90vh]');
    });

    it('should have gradient title style', () => {
      expect(dialogStyles.title).toContain('text-2xl');
      expect(dialogStyles.title).toContain('font-bold');
      expect(dialogStyles.title).toContain('bg-gradient-to-r');
      expect(dialogStyles.title).toContain('from-blue-300');
      expect(dialogStyles.title).toContain('bg-clip-text');
      expect(dialogStyles.title).toContain('text-transparent');
    });

    it('should have proper button styles', () => {
      // Primary button
      expect(dialogStyles.primaryButton).toContain('px-6 py-3');
      expect(dialogStyles.primaryButton).toContain('bg-gradient-to-r');
      expect(dialogStyles.primaryButton).toContain('from-blue-600');
      expect(dialogStyles.primaryButton).toContain('hover:scale-105');
      expect(dialogStyles.primaryButton).toContain('active:scale-95');

      // Secondary button
      expect(dialogStyles.secondaryButton).toContain('bg-slate-700/50');
      expect(dialogStyles.secondaryButton).toContain('hover:bg-slate-600/50');
      expect(dialogStyles.secondaryButton).toContain('border-slate-600/50');
    });

    it('should have input and select styles', () => {
      expect(dialogStyles.input).toContain('px-4 py-3');
      expect(dialogStyles.input).toContain('bg-slate-700/50');
      expect(dialogStyles.input).toContain('focus:border-blue-500/70');
      expect(dialogStyles.input).toContain('placeholder-slate-400');

      expect(dialogStyles.select).toContain('bg-slate-700/50');
      expect(dialogStyles.select).toContain('border-slate-600/50');
      expect(dialogStyles.select).toContain('text-slate-200');
    });

    it('should have state styles', () => {
      expect(dialogStyles.success).toContain('text-green-400');
      expect(dialogStyles.success).toContain('bg-green-500/10');

      expect(dialogStyles.error).toContain('text-red-400');
      expect(dialogStyles.error).toContain('border-red-500/30');

      expect(dialogStyles.warning).toContain('text-yellow-400');
      expect(dialogStyles.warning).toContain('bg-yellow-500/10');

      expect(dialogStyles.info).toContain('text-blue-400');
      expect(dialogStyles.info).toContain('border-blue-500/30');
    });

    it('should have tab styles', () => {
      expect(dialogStyles.tabActive).toContain('bg-gradient-to-r');
      expect(dialogStyles.tabActive).toContain('from-blue-600');
      expect(dialogStyles.tabActive).toContain('shadow-lg');

      expect(dialogStyles.tabInactive).toContain('text-slate-300');
      expect(dialogStyles.tabInactive).toContain('hover:text-white');
      expect(dialogStyles.tabInactive).toContain('hover:bg-slate-600/50');
    });
  });

  describe('gradientOverlays object', () => {
    it('should have all color overlays', () => {
      expect(gradientOverlays).toHaveProperty('blue');
      expect(gradientOverlays).toHaveProperty('purple');
      expect(gradientOverlays).toHaveProperty('green');
      expect(gradientOverlays).toHaveProperty('orange');
      expect(gradientOverlays).toHaveProperty('red');
    });

    it('should have correct overlay styles', () => {
      expect(gradientOverlays.blue).toContain('absolute inset-0');
      expect(gradientOverlays.blue).toContain('bg-gradient-to-r');
      expect(gradientOverlays.blue).toContain('from-slate-800/50');
      expect(gradientOverlays.blue).toContain('to-blue-900/30');
      expect(gradientOverlays.blue).toContain('rounded-3xl blur-xl');

      expect(gradientOverlays.purple).toContain('from-purple-900/30');
      expect(gradientOverlays.purple).toContain('to-indigo-900/30');

      expect(gradientOverlays.green).toContain('from-green-900/30');
      expect(gradientOverlays.green).toContain('to-emerald-900/30');

      expect(gradientOverlays.orange).toContain('from-orange-900/30');
      expect(gradientOverlays.orange).toContain('to-amber-900/30');

      expect(gradientOverlays.red).toContain('from-red-900/30');
      expect(gradientOverlays.red).toContain('to-rose-900/30');
    });

    it('should all have blur effect', () => {
      Object.values(gradientOverlays).forEach(overlay => {
        expect(overlay).toContain('blur-xl');
      });
    });
  });

  describe('iconColors object', () => {
    it('should have all icon colors', () => {
      expect(iconColors).toHaveProperty('blue');
      expect(iconColors).toHaveProperty('purple');
      expect(iconColors).toHaveProperty('green');
      expect(iconColors).toHaveProperty('orange');
      expect(iconColors).toHaveProperty('red');
      expect(iconColors).toHaveProperty('cyan');
      expect(iconColors).toHaveProperty('yellow');
    });

    it('should have correct color classes', () => {
      expect(iconColors.blue).toBe('text-blue-400');
      expect(iconColors.purple).toBe('text-purple-400');
      expect(iconColors.green).toBe('text-green-400');
      expect(iconColors.orange).toBe('text-orange-400');
      expect(iconColors.red).toBe('text-red-400');
      expect(iconColors.cyan).toBe('text-cyan-400');
      expect(iconColors.yellow).toBe('text-yellow-400');
    });

    it('should use 400 shade for all colors', () => {
      Object.values(iconColors).forEach(color => {
        expect(color).toMatch(/text-\w+-400$/);
      });
    });
  });

  describe('style consistency', () => {
    it('should use consistent opacity values', () => {
      // Check slate-700/50 consistency
      expect(dialogStyles.content).toContain('border-slate-700/50');
      expect(dialogStyles.card).toContain('border-slate-700/50');
      expect(dialogStyles.input).toContain('bg-slate-700/50');
      expect(dialogStyles.select).toContain('bg-slate-700/50');
    });

    it('should use consistent border radius', () => {
      expect(dialogStyles.content).toContain('rounded-3xl');
      expect(dialogStyles.primaryButton).toContain('rounded-xl');
      expect(dialogStyles.secondaryButton).toContain('rounded-xl');
      expect(dialogStyles.card).toContain('rounded-2xl');
      expect(dialogStyles.input).toContain('rounded-xl');
    });

    it('should use consistent transition durations', () => {
      const transitionElements = [
        dialogStyles.primaryButton,
        dialogStyles.secondaryButton,
        dialogStyles.card,
        dialogStyles.input
      ];

      transitionElements.forEach(element => {
        expect(element).toContain('transition-all duration-300');
      });
    });
  });

  describe('accessibility', () => {
    it('should have disabled states for interactive elements', () => {
      expect(dialogStyles.primaryButton).toContain('disabled:from-slate-600');
      expect(dialogStyles.primaryButton).toContain('disabled:to-slate-600');
      expect(dialogStyles.primaryButton).toContain('disabled:cursor-not-allowed');
    });

    it('should have focus states for form elements', () => {
      expect(dialogStyles.input).toContain('focus:outline-none');
      expect(dialogStyles.input).toContain('focus:border-blue-500/70');
      expect(dialogStyles.input).toContain('focus:bg-slate-700/70');
    });

    it('should have hover states', () => {
      expect(dialogStyles.primaryButton).toContain('hover:from-blue-500');
      expect(dialogStyles.secondaryButton).toContain('hover:bg-slate-600/50');
      expect(dialogStyles.card).toContain('hover:border-slate-600/50');
      expect(dialogStyles.input).toContain('hover:border-blue-500/50');
      expect(dialogStyles.tabInactive).toContain('hover:text-white');
    });
  });
});
