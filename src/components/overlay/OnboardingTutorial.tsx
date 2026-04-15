import { useState, useEffect, useCallback, useRef } from 'react';

interface TutorialStep {
  selector: string;
  title: string;
  description: string;
  cardSide: 'bottom' | 'right' | 'left' | 'top';
}

const STEPS: TutorialStep[] = [
  {
    selector: '[data-tour="market-stats"]',
    title: 'Market Stats',
    description: 'Live price, funding rate, and key metrics stream here in real-time.',
    cardSide: 'bottom',
  },
  {
    selector: '[data-tour="symbol-selector"]',
    title: 'Token Selector',
    description: 'Switch between SOL, BTC, ETH and other Pacifica perpetual markets.',
    cardSide: 'bottom',
  },
  {
    selector: '[data-tour="whale-feed"]',
    title: 'Whale Pulse Feed',
    description: 'Every large trade detected appears here. Hover any item for full details like entry price and size.',
    cardSide: 'right',
  },
  {
    selector: '[data-tour="whale-timeline"]',
    title: 'Activity Timeline',
    description: 'Temporal intensity bars show whale activity concentration over recent minutes.',
    cardSide: 'top',
  },
  {
    selector: '[data-tour="ai-panel"]',
    title: 'AI Insights',
    description: 'AI analyzes whale patterns and generates market intelligence in real-time.',
    cardSide: 'left',
  },
];

function getTargetCenter(selector: string): { x: number; y: number } | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function getCardPosition(selector: string, side: string): { top: number; left: number } {
  const el = document.querySelector(selector);
  if (!el) return { top: window.innerHeight / 2, left: window.innerWidth / 2 };
  const rect = el.getBoundingClientRect();
  switch (side) {
    case 'bottom':
      return { top: rect.bottom + 20, left: rect.left + rect.width / 2 };
    case 'top':
      return { top: rect.top - 20, left: rect.left + rect.width / 2 };
    case 'right':
      return { top: rect.top + rect.height / 2, left: rect.right + 20 };
    case 'left':
      return { top: rect.top + rect.height / 2, left: rect.left - 20 };
    default:
      return { top: rect.bottom + 20, left: rect.left + rect.width / 2 };
  }
}

export function OnboardingTutorial() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [pointerPos, setPointerPos] = useState({ x: -100, y: -100 });
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 });
  const [showContent, setShowContent] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const seen = localStorage.getItem('pacifica-onboarding-seen');
    if (!seen) {
      const timer = setTimeout(() => setActive(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updatePositions = useCallback(() => {
    if (!active) return;
    const s = STEPS[step];
    const center = getTargetCenter(s.selector);
    if (center) {
      setPointerPos(center);
      setCardPos(getCardPosition(s.selector, s.cardSide));
    }
  }, [step, active]);

  useEffect(() => {
    if (!active) return;
    setShowContent(false);
    // Small delay then position
    const t1 = setTimeout(() => {
      updatePositions();
      setShowContent(true);
    }, 400);
    return () => clearTimeout(t1);
  }, [step, active, updatePositions]);

  // Keep positions updated if layout shifts
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(updatePositions, 500);
    return () => clearInterval(interval);
  }, [active, updatePositions]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      setActive(false);
      localStorage.setItem('pacifica-onboarding-seen', 'true');
    }
  }, [step]);

  const skip = useCallback(() => {
    setActive(false);
    localStorage.setItem('pacifica-onboarding-seen', 'true');
  }, []);

  if (!active) return null;

  const currentStep = STEPS[step];
  const transformCard = currentStep.cardSide === 'bottom' || currentStep.cardSide === 'top'
    ? 'translate(-50%, 0)'
    : currentStep.cardSide === 'left'
      ? 'translate(-100%, -50%)'
      : 'translate(0, -50%)';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={skip} />

      {/* Animated pointer ring */}
      <div
        className="absolute pointer-events-none transition-all duration-700 ease-out"
        style={{ left: pointerPos.x, top: pointerPos.y, transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative w-16 h-16">
          <div
            className="absolute inset-0 rounded-full border-2 animate-ping"
            style={{ borderColor: 'hsl(190, 100%, 50%)', animationDuration: '1.5s' }}
          />
          <div
            className="absolute inset-2 rounded-full border"
            style={{ borderColor: 'hsl(190, 100%, 50%, 0.5)' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{ backgroundColor: 'hsl(190, 100%, 50%)', boxShadow: '0 0 20px hsl(190, 100%, 50%, 0.8)' }}
          />
        </div>
      </div>

      {/* Step card */}
      <div
        className={`absolute pointer-events-auto transition-all duration-500 ease-out ${showContent ? 'opacity-100' : 'opacity-0 translate-y-2'}`}
        style={{ left: cardPos.left, top: cardPos.top, transform: transformCard, maxWidth: '300px' }}
      >
        <div
          className="glass-surface rounded-xl px-5 py-4 space-y-3"
          style={{ borderTop: '2px solid hsl(190, 100%, 50%)', boxShadow: '0 0 40px hsl(190, 100%, 50%, 0.15)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-[0.15em] uppercase" style={{ color: 'hsl(190, 100%, 50%)' }}>
              Step {step + 1}/{STEPS.length}
            </span>
            <button onClick={skip} className="text-muted-foreground hover:text-foreground text-xs">Skip</button>
          </div>
          <h3 className="text-sm font-bold text-foreground">{currentStep.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{currentStep.description}</p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i === step ? 'hsl(190, 100%, 50%)' : 'hsl(0, 0%, 30%)',
                    boxShadow: i === step ? '0 0 6px hsl(190, 100%, 50%, 0.8)' : 'none',
                  }}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="text-xs font-mono px-4 py-1.5 rounded-md transition-colors"
              style={{ backgroundColor: 'hsl(190, 100%, 50%, 0.15)', color: 'hsl(190, 100%, 50%)', border: '1px solid hsl(190, 100%, 50%, 0.3)' }}
            >
              {step < STEPS.length - 1 ? 'Next →' : 'Start Watching'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
