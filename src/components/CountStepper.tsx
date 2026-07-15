import { sanitizeRsvpCountInput, stepRsvpCount } from '../lib/rsvp';

interface CountStepperProps {
  label: string;
  value: string;
  min: number;
  max: number;
  error?: string;
  onChange: (value: string) => void;
}

export function CountStepper({
  label,
  value,
  min,
  max,
  error,
  onChange,
}: CountStepperProps) {
  const inputId = label.replace(/\s/g, '-').toLowerCase();
  const parsed = value.trim() === '' ? null : Number(value);
  const minusDisabled = parsed === null || Number.isNaN(parsed) || parsed <= min;
  const plusDisabled = parsed !== null && !Number.isNaN(parsed) && parsed >= max;

  const handleStep = (delta: number) => {
    onChange(stepRsvpCount(value, delta, min, max));
  };

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div
        className={`rsvp-count-stepper ${error ? 'rsvp-count-stepper-error' : ''}`}
      >
        <button
          type="button"
          className="rsvp-count-stepper-btn"
          aria-label={`减少${label}`}
          disabled={minusDisabled}
          onClick={() => handleStep(-1)}
        >
          −
        </button>
        <input
          id={inputId}
          type="number"
          min={min}
          max={max}
          step={1}
          inputMode="numeric"
          placeholder={`${min}-${max}`}
          value={value}
          className="rsvp-count-stepper-input"
          onChange={(e) => onChange(sanitizeRsvpCountInput(e.target.value))}
        />
        <button
          type="button"
          className="rsvp-count-stepper-btn"
          aria-label={`增加${label}`}
          disabled={plusDisabled}
          onClick={() => handleStep(1)}
        >
          +
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
