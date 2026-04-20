export type Goal = "fat_loss" | "muscle_gain" | "maintenance";
export type Level = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
}
export interface DayPlan {
  day: string;
  focus: string;
  duration: string;
  exercises: Exercise[];
}
export interface WeeklyPlan {
  name: string;
  summary: string;
  days: DayPlan[];
}

const SETS = { beginner: 3, intermediate: 4, advanced: 5 } as const;
const REST = { fat_loss: "45s", muscle_gain: "75s", maintenance: "60s" } as const;
const REPS = { fat_loss: "12-15", muscle_gain: "8-10", maintenance: "10-12" } as const;

const ex = (name: string, goal: Goal, level: Level): Exercise => ({
  name,
  sets: SETS[level],
  reps: REPS[goal],
  rest: REST[goal],
});

export function generateWeeklyPlan(goal: Goal, level: Level): WeeklyPlan {
  const e = (n: string) => ex(n, goal, level);
  const cardio: Exercise = { name: "Steady-state cardio", sets: 1, reps: "25-35 min", rest: "—" };
  const hiit: Exercise = { name: "HIIT intervals", sets: 6, reps: "40s on / 20s off", rest: "1 min" };

  const push: DayPlan = {
    day: "Monday", focus: "Push (Chest · Shoulders · Triceps)", duration: "45-55 min",
    exercises: [e("Bench Press"), e("Overhead Press"), e("Incline Dumbbell Press"), e("Tricep Pushdown"), e("Lateral Raises")],
  };
  const pull: DayPlan = {
    day: "Tuesday", focus: "Pull (Back · Biceps)", duration: "45-55 min",
    exercises: [e("Pull-ups / Lat Pulldown"), e("Barbell Row"), e("Seated Cable Row"), e("Face Pulls"), e("Bicep Curls")],
  };
  const legs: DayPlan = {
    day: "Thursday", focus: "Legs (Quads · Hamstrings · Glutes)", duration: "50-60 min",
    exercises: [e("Back Squat"), e("Romanian Deadlift"), e("Walking Lunges"), e("Leg Curl"), e("Calf Raises")],
  };
  const fullBody: DayPlan = {
    day: "Wednesday", focus: "Full Body Strength", duration: "40-50 min",
    exercises: [e("Goblet Squat"), e("Push-ups"), e("Dumbbell Row"), e("Glute Bridge"), e("Plank (3 × 45s)")],
  };
  const conditioning: DayPlan = {
    day: goal === "fat_loss" ? "Wednesday" : "Saturday",
    focus: goal === "fat_loss" ? "Conditioning · HIIT" : "Active recovery · Cardio",
    duration: "25-35 min",
    exercises: goal === "fat_loss" ? [hiit, { name: "Core circuit", sets: 3, reps: "12 reps × 4 moves", rest: "30s" }] : [cardio, { name: "Mobility flow", sets: 1, reps: "10 min", rest: "—" }],
  };
  const upperBody: DayPlan = {
    day: "Friday", focus: "Upper Body Hypertrophy", duration: "45 min",
    exercises: [e("Incline Press"), e("Cable Row"), e("Dumbbell Curl"), e("Tricep Dips"), e("Rear Delt Fly")],
  };
  const rest: DayPlan = { day: "Sunday", focus: "Rest · Recovery", duration: "—", exercises: [{ name: "Walk + stretching", sets: 1, reps: "20-30 min", rest: "—" }] };

  let days: DayPlan[];
  if (goal === "fat_loss") {
    days = [push, pull, conditioning, legs, upperBody, { ...cardio && conditioning, day: "Saturday", focus: "Steady cardio + core", duration: "35 min", exercises: [cardio, { name: "Core circuit", sets: 3, reps: "15 reps × 3 moves", rest: "30s" }] }, rest];
  } else if (goal === "muscle_gain") {
    days = [push, pull, { day: "Wednesday", focus: "Rest", duration: "—", exercises: [{ name: "Mobility + light walk", sets: 1, reps: "20 min", rest: "—" }] }, legs, upperBody, conditioning, rest];
  } else {
    days = [fullBody, conditioning, { day: "Wednesday", focus: "Mobility", duration: "20 min", exercises: [{ name: "Yoga flow", sets: 1, reps: "20 min", rest: "—" }] }, push, conditioning, pull, rest];
  }

  const goalLabel = { fat_loss: "Fat Loss", muscle_gain: "Muscle Gain", maintenance: "Maintenance" }[goal];
  const levelLabel = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" }[level];

  return {
    name: `${goalLabel} · ${levelLabel} · Week 1`,
    summary: `A 7-day plan tuned for ${goalLabel.toLowerCase()} at the ${levelLabel.toLowerCase()} level. Sets and rest periods are adapted to your goal.`,
    days,
  };
}

export const goalLabels: Record<Goal, string> = { fat_loss: "Fat Loss", muscle_gain: "Muscle Gain", maintenance: "Maintenance" };
export const levelLabels: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
