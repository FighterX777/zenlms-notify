export interface Test {
  id: string;
  title: string;
  subject: string;
  topic: string;
  fixedStartAt: string;
  expiresAt: string;
  attemptsUsed: number;
  open: boolean;
  canStart: boolean;
  availabilityReason: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FetchTestsResponse {
  items: Test[];
}

export interface TestState {
  fixedStartAt: string;
  expiresAt: string;
  // Reminder flags: keys are "start_6h", "start_1h", "end_6h", "end_1h", "opened", "missed"
  sentReminders: string[];
}

export interface StoredState {
  // Map of test ID -> TestState
  tests: Record<string, TestState>;
}
