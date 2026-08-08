export const ALLOWED_LEVELS = [
  "Absolute Beginner",
  "Junior Analyst",
  "Intermediate",
  "Advanced Practitioner",
];

export const MAX_TOPIC_LENGTH = 300;
export const MAX_GOAL_LENGTH = 300;

export interface ValidatedInputs {
  topic: string;
  level: string;
  time: string;
  goal: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: ValidatedInputs;
}

function isValidTime(value: string): boolean {
  if (value === "No Time Set") return true;
  if (!/^\d+$/.test(value)) return false;
  const n = Number(value);
  return n > 0 && n <= 300;
}

export function validateInputs(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Invalid request body." };
  }

  const { topic, level, time, goal } = body as Record<string, unknown>;

  if (
    typeof topic !== "string" ||
    typeof level !== "string" ||
    typeof time !== "string" ||
    typeof goal !== "string"
  ) {
    return { valid: false, error: "All fields are required and must be text." };
  }

  const trimmedTopic = topic.trim();
  const trimmedLevel = level.trim();
  const trimmedTime = time.trim();
  const trimmedGoal = goal.trim();

  if (!trimmedTopic || !trimmedLevel || !trimmedTime || !trimmedGoal) {
    return { valid: false, error: "All fields are required." };
  }

  if (trimmedTopic.length > MAX_TOPIC_LENGTH) {
    return { valid: false, error: `Topic must be ${MAX_TOPIC_LENGTH} characters or fewer.` };
  }

  if (trimmedGoal.length > MAX_GOAL_LENGTH) {
    return { valid: false, error: `Learning goal must be ${MAX_GOAL_LENGTH} characters or fewer.` };
  }

  if (!ALLOWED_LEVELS.includes(trimmedLevel)) {
    return { valid: false, error: "Experience level is not a recognized value." };
  }

  if (!isValidTime(trimmedTime)) {
    return { valid: false, error: "Available time value is not valid." };
  }

  return {
    valid: true,
    data: { topic: trimmedTopic, level: trimmedLevel, time: trimmedTime, goal: trimmedGoal },
  };
}
