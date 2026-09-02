// FILE: src/types/admin-alert-settings.ts
// Shape contract for /api/admin/alerts.

export interface AlertSettings {
  alertsEnabled: boolean;
  dailyTokenThreshold: number;
  errorRateThresholdPct: number;
  alertEmails: string[];
  lastAlertSentAt: string | null;
  updatedAt: string | null;
}

export type AlertSettingsPatch = Partial<
  Pick<AlertSettings, 'alertsEnabled' | 'dailyTokenThreshold' | 'errorRateThresholdPct' | 'alertEmails'>
>;

export interface TestDigestResult {
  sent: boolean;
  reason?: string;
  recipients?: number;
}
