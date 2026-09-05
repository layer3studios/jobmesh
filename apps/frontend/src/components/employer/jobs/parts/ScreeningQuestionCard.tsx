'use client';
// FILE: src/components/employer/jobs/parts/ScreeningQuestionCard.tsx
// One question in the editor. Collapses to a single line once written, so a
// posting with five questions stays a form rather than becoming five stacked
// forms — the JD above it is the thing being edited, not this.

import { ChevronDown, ChevronUp, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button, Input, Select, Stack, Switch } from '@/components/ui';
import { COPY } from '@/theme/brand';
import {
  MAXIMUM_SELECT_OPTIONS, MAXIMUM_QUESTION_TEXT_LENGTH, type ScreeningQuestion,
} from '@/types/employer-jobs';
import {
  addOption, canFlagAnswer, changeQuestionType, optionsFor, questionError, removeOption, setOption,
} from './screening-question-helpers';

const TEXT = COPY.employer.screening;

const TYPE_OPTIONS = [
  { value: 'text', label: TEXT.typeText },
  { value: 'single_select', label: TEXT.typeSelect },
  { value: 'yes_no', label: TEXT.typeYesNo },
];

const iconButtonStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
  color: 'var(--ink-faint)', display: 'inline-flex', lineHeight: 0,
};

function IconButton({ label, disabled, onClick, children }: {
  label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}
      style={{ ...iconButtonStyle, opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >
      {children}
    </button>
  );
}

/** The multiple-choice option rows, with add/remove. */
function OptionEditor({ question, onChange }: {
  question: ScreeningQuestion;
  onChange: (next: ScreeningQuestion) => void;
}) {
  return (
    <Stack gap={6}>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)' }}>{TEXT.optionsLabel}</span>
      {question.options.map((option, index) => (
        <Stack key={index} gap={6} dir="row" align="center">
          <div style={{ flex: 1 }}>
            <Input
              value={option}
              aria-label={`${TEXT.optionsLabel} ${index + 1}`}
              onChange={(e) => onChange(setOption(question, index, e.target.value))}
            />
          </div>
          <IconButton
            label={TEXT.removeOption}
            disabled={question.options.length <= 2}
            onClick={() => onChange(removeOption(question, index))}
          >
            <Trash2 size={14} aria-hidden="true" />
          </IconButton>
        </Stack>
      ))}
      {question.options.length < MAXIMUM_SELECT_OPTIONS && (
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(addOption(question))}>
            {TEXT.addOption}
          </Button>
        </div>
      )}
    </Stack>
  );
}

export default function ScreeningQuestionCard({
  question, index, total, isOpen, onToggle, onChange, onMove, onRemove,
}: {
  question: ScreeningQuestion;
  index: number;
  total: number;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (next: ScreeningQuestion) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const error = questionError(question);
  const choices = optionsFor(question);

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-raised)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
        <button
          type="button" onClick={onToggle} aria-expanded={isOpen}
          style={{ ...iconButtonStyle, flex: 1, justifyContent: 'flex-start', textAlign: 'left', gap: 8, alignItems: 'center' }}
        >
          {isOpen ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          <span style={{
            fontSize: 13, color: question.questionText ? 'var(--ink)' : 'var(--ink-faint)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {question.questionText || TEXT.collapsedUntitled}
          </span>
        </button>
        <IconButton label={TEXT.moveUp} disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp size={14} aria-hidden="true" />
        </IconButton>
        <IconButton label={TEXT.moveDown} disabled={index === total - 1} onClick={() => onMove(1)}>
          <ArrowDown size={14} aria-hidden="true" />
        </IconButton>
        <IconButton label={TEXT.remove} onClick={onRemove}>
          <Trash2 size={14} aria-hidden="true" />
        </IconButton>
      </div>

      {isOpen && (
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <Stack gap={12}>
            <Input
              label={TEXT.questionLabel}
              value={question.questionText}
              placeholder={TEXT.questionPlaceholder}
              maxLength={MAXIMUM_QUESTION_TEXT_LENGTH}
              error={error}
              onChange={(e) => onChange({ ...question, questionText: e.target.value })}
            />

            <Select
              label={TEXT.typeLabel}
              value={question.questionType}
              options={TYPE_OPTIONS}
              onChange={(e) => onChange(changeQuestionType(question, e.target.value as ScreeningQuestion['questionType']))}
            />

            {question.questionType === 'single_select' && (
              <OptionEditor question={question} onChange={onChange} />
            )}

            <Switch
              checked={question.isRequired}
              onChange={(checked) => onChange({ ...question, isRequired: checked })}
              label={TEXT.requiredLabel}
            />

            {/* Free text cannot be flagged: an exact string match would flag almost
                nobody, and offering it would imply otherwise. */}
            {canFlagAnswer(question) && (
              <Stack gap={6}>
                <Switch
                  checked={question.knockoutAnswer !== null}
                  onChange={(checked) => onChange({
                    ...question, knockoutAnswer: checked ? (choices[0] ?? null) : null,
                  })}
                  label={TEXT.flagToggle}
                />
                {question.knockoutAnswer !== null && (
                  <>
                    <Select
                      label={TEXT.flagSelectLabel}
                      value={question.knockoutAnswer}
                      options={choices.map((choice) => ({ value: choice, label: choice || '—' }))}
                      onChange={(e) => onChange({ ...question, knockoutAnswer: e.target.value })}
                    />
                    <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{TEXT.flagHint}</span>
                  </>
                )}
              </Stack>
            )}
          </Stack>
        </div>
      )}
    </div>
  );
}
