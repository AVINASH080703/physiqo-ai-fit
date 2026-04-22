-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.diet_category AS ENUM ('veg', 'non_veg', 'vegan', 'dairy', 'grain', 'fruit', 'nut_seed', 'beverage', 'supplement');
CREATE TYPE public.diet_preference AS ENUM ('veg', 'non_veg', 'vegan');
CREATE TYPE public.unit_system AS ENUM ('metric', 'imperial');
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE public.exercise_category AS ENUM ('strength', 'cardio', 'mobility', 'hiit', 'sports');
CREATE TYPE public.water_unit AS ENUM ('ml', 'oz');

-- =========================================
-- PUBLIC LIBRARIES
-- =========================================
CREATE TABLE public.food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category public.diet_category NOT NULL,
  serving_size_g numeric NOT NULL DEFAULT 100,
  calories numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  fiber_g numeric NOT NULL DEFAULT 0,
  magnesium_mg numeric NOT NULL DEFAULT 0,
  potassium_mg numeric NOT NULL DEFAULT 0,
  calcium_mg numeric NOT NULL DEFAULT 0,
  iron_mg numeric NOT NULL DEFAULT 0,
  sodium_mg numeric NOT NULL DEFAULT 0,
  primary_nutrient text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_food_items_category ON public.food_items(category);
CREATE INDEX idx_food_items_name ON public.food_items USING gin (to_tsvector('simple', name));

ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Food items are public" ON public.food_items FOR SELECT USING (true);

CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category public.exercise_category NOT NULL,
  muscle_group text,
  equipment text,
  difficulty text,
  met_value numeric NOT NULL DEFAULT 4,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exercises_category ON public.exercises(category);
CREATE INDEX idx_exercises_name ON public.exercises USING gin (to_tsvector('simple', name));

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are public" ON public.exercises FOR SELECT USING (true);

-- =========================================
-- USER PREFERENCES + TARGETS
-- =========================================
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  unit_system public.unit_system NOT NULL DEFAULT 'metric',
  diet_preference public.diet_preference NOT NULL DEFAULT 'non_veg',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own prefs" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own prefs" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own prefs" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_preferences_updated BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.nutrition_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  calories numeric NOT NULL DEFAULT 2000,
  protein_g numeric NOT NULL DEFAULT 100,
  carbs_g numeric NOT NULL DEFAULT 250,
  fat_g numeric NOT NULL DEFAULT 65,
  fiber_g numeric NOT NULL DEFAULT 30,
  water_ml numeric NOT NULL DEFAULT 2500,
  magnesium_mg numeric NOT NULL DEFAULT 400,
  potassium_mg numeric NOT NULL DEFAULT 3500,
  calcium_mg numeric NOT NULL DEFAULT 1000,
  iron_mg numeric NOT NULL DEFAULT 15,
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_nutrition_targets_user ON public.nutrition_targets(user_id);
ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own targets" ON public.nutrition_targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own targets" ON public.nutrition_targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own targets" ON public.nutrition_targets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own targets" ON public.nutrition_targets FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_nutrition_targets_updated BEFORE UPDATE ON public.nutrition_targets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- LOG TABLES
-- =========================================
CREATE TABLE public.nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  food_item_id uuid REFERENCES public.food_items(id) ON DELETE SET NULL,
  custom_name text,
  servings numeric NOT NULL DEFAULT 1,
  meal public.meal_type NOT NULL DEFAULT 'snack',
  logged_at timestamptz NOT NULL DEFAULT now(),
  -- snapshot values so deletes/edits to library don't break history
  calories numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_nutrition_logs_user_date ON public.nutrition_logs(user_id, logged_at DESC);
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own nutrition logs" ON public.nutrition_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own nutrition logs" ON public.nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own nutrition logs" ON public.nutrition_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own nutrition logs" ON public.nutrition_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  unit public.water_unit NOT NULL DEFAULT 'ml',
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_water_logs_user_date ON public.water_logs(user_id, logged_at DESC);
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own water logs" ON public.water_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own water logs" ON public.water_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own water logs" ON public.water_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own water logs" ON public.water_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE SET NULL,
  custom_name text,
  duration_min numeric,
  sets integer,
  reps integer,
  weight_kg numeric,
  calories_burned numeric,
  notes text,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exercise_logs_user_date ON public.exercise_logs(user_id, logged_at DESC);
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own exercise logs" ON public.exercise_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own exercise logs" ON public.exercise_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own exercise logs" ON public.exercise_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own exercise logs" ON public.exercise_logs FOR DELETE USING (auth.uid() = user_id);

-- =========================================
-- SEED: FOODS (per 100 g unless noted)
-- =========================================
INSERT INTO public.food_items (name, category, serving_size_g, calories, protein_g, carbs_g, fat_g, fiber_g, magnesium_mg, potassium_mg, calcium_mg, iron_mg, sodium_mg, primary_nutrient) VALUES
-- VEG / VEGAN proteins
('Lentils (cooked)', 'veg', 100, 116, 9, 20, 0.4, 7.9, 36, 369, 19, 3.3, 2, 'protein'),
('Chickpeas (cooked)', 'veg', 100, 164, 8.9, 27.4, 2.6, 7.6, 48, 291, 49, 2.9, 7, 'protein'),
('Kidney beans (cooked)', 'veg', 100, 127, 8.7, 22.8, 0.5, 6.4, 42, 405, 35, 2.9, 1, 'protein'),
('Tofu (firm)', 'veg', 100, 144, 17, 2.8, 8.7, 2.3, 58, 237, 683, 2.7, 14, 'protein'),
('Tempeh', 'veg', 100, 192, 20, 7.6, 11, 1.4, 81, 412, 111, 2.7, 9, 'protein'),
('Paneer', 'dairy', 100, 296, 25, 3.6, 20, 0, 12, 81, 480, 0.2, 22, 'protein'),
('Greek yogurt (plain)', 'dairy', 100, 59, 10, 3.6, 0.4, 0, 11, 141, 110, 0.1, 36, 'protein'),
('Milk (whole)', 'dairy', 100, 61, 3.2, 4.8, 3.3, 0, 11, 132, 113, 0, 43, 'calcium'),
('Almonds', 'nut_seed', 30, 173, 6.3, 6.5, 14.9, 3.7, 81, 215, 79, 1.1, 0, 'magnesium'),
('Pumpkin seeds', 'nut_seed', 30, 168, 8.6, 4.5, 14.3, 1.8, 156, 240, 13, 2.5, 5, 'magnesium'),
('Spinach (raw)', 'veg', 100, 23, 2.9, 3.6, 0.4, 2.2, 79, 558, 99, 2.7, 79, 'magnesium'),
('Banana', 'fruit', 100, 89, 1.1, 22.8, 0.3, 2.6, 27, 358, 5, 0.3, 1, 'potassium'),
('Avocado', 'fruit', 100, 160, 2, 8.5, 14.7, 6.7, 29, 485, 12, 0.6, 7, 'potassium'),
('Sweet potato (baked)', 'veg', 100, 90, 2, 20.7, 0.2, 3.3, 27, 475, 38, 0.7, 36, 'potassium'),
('Brown rice (cooked)', 'grain', 100, 123, 2.7, 25.6, 1, 1.6, 39, 79, 3, 0.4, 4, 'carbs'),
('Oats (rolled, dry)', 'grain', 40, 156, 5.4, 26.8, 2.8, 4.1, 70, 175, 21, 1.6, 1, 'carbs'),
('Quinoa (cooked)', 'grain', 100, 120, 4.4, 21.3, 1.9, 2.8, 64, 172, 17, 1.5, 7, 'carbs'),
('Whole-wheat bread', 'grain', 50, 124, 6.1, 20.7, 1.7, 3.1, 39, 128, 53, 1.4, 230, 'carbs'),
('Peanut butter', 'nut_seed', 32, 188, 7.1, 7.7, 16, 1.6, 51, 208, 17, 0.6, 152, 'fat'),
('Olive oil', 'veg', 14, 119, 0, 0, 13.5, 0, 0, 1, 0, 0, 0, 'fat'),
-- NON-VEG proteins
('Chicken breast (cooked)', 'non_veg', 100, 165, 31, 0, 3.6, 0, 29, 256, 15, 1, 74, 'protein'),
('Egg (whole, large)', 'non_veg', 50, 72, 6.3, 0.4, 4.8, 0, 6, 69, 28, 0.9, 71, 'protein'),
('Salmon (cooked)', 'non_veg', 100, 208, 22, 0, 13, 0, 30, 363, 12, 0.5, 59, 'protein'),
('Tuna (canned in water)', 'non_veg', 100, 116, 26, 0, 0.8, 0, 27, 237, 11, 1.6, 247, 'protein'),
('Shrimp (cooked)', 'non_veg', 100, 99, 24, 0.2, 0.3, 0, 39, 259, 70, 0.5, 111, 'protein'),
('Beef (lean, cooked)', 'non_veg', 100, 250, 26, 0, 15, 0, 21, 318, 18, 2.6, 66, 'protein'),
('Mackerel (cooked)', 'non_veg', 100, 262, 24, 0, 18, 0, 82, 401, 15, 1.6, 83, 'protein'),
-- Hydration / extras
('Coconut water', 'beverage', 240, 46, 1.7, 8.9, 0.5, 2.6, 60, 600, 58, 0.7, 252, 'potassium'),
('Watermelon', 'fruit', 100, 30, 0.6, 7.6, 0.2, 0.4, 10, 112, 7, 0.2, 1, 'water'),
('Cucumber', 'veg', 100, 16, 0.7, 3.6, 0.1, 0.5, 13, 147, 16, 0.3, 2, 'water'),
('Dark chocolate (70%)', 'veg', 30, 170, 2.2, 13, 12, 3.3, 65, 219, 22, 3.4, 6, 'magnesium');

-- =========================================
-- SEED: EXERCISES
-- =========================================
INSERT INTO public.exercises (name, category, muscle_group, equipment, difficulty, met_value, instructions) VALUES
('Push-up', 'strength', 'Chest, Triceps, Core', 'Bodyweight', 'beginner', 3.8, 'Plank position, lower chest to floor, push back up keeping core tight.'),
('Pull-up', 'strength', 'Back, Biceps', 'Pull-up bar', 'advanced', 8, 'Hang from bar, pull until chin clears the bar, lower with control.'),
('Squat', 'strength', 'Quads, Glutes', 'Bodyweight', 'beginner', 5, 'Feet shoulder-width, lower hips back and down, drive through heels.'),
('Deadlift', 'strength', 'Posterior chain', 'Barbell', 'intermediate', 6, 'Hinge at hips, neutral spine, drive through floor to lockout.'),
('Bench press', 'strength', 'Chest, Triceps, Shoulders', 'Barbell', 'intermediate', 6, 'Lower bar to mid-chest, press up to lockout.'),
('Lunge', 'strength', 'Quads, Glutes', 'Bodyweight', 'beginner', 4, 'Step forward, lower back knee toward floor, push back to start.'),
('Plank', 'mobility', 'Core', 'Bodyweight', 'beginner', 3, 'Forearms down, body straight, hold without sagging.'),
('Burpee', 'hiit', 'Full body', 'Bodyweight', 'intermediate', 8, 'Squat, kick back to plank, push-up, jump up.'),
('Jumping jack', 'cardio', 'Full body', 'Bodyweight', 'beginner', 8, 'Jump feet out while raising arms overhead.'),
('Mountain climber', 'hiit', 'Core, Cardio', 'Bodyweight', 'beginner', 8, 'Plank position, drive knees to chest alternately at speed.'),
('Running (moderate)', 'cardio', 'Legs, Heart', 'None', 'beginner', 9.8, 'Steady pace ~10 km/h, nasal breathing if possible.'),
('Cycling (moderate)', 'cardio', 'Legs, Heart', 'Bike', 'beginner', 7.5, 'Steady RPM ~80, moderate resistance.'),
('Yoga (Hatha)', 'mobility', 'Full body', 'Mat', 'beginner', 2.5, 'Flow through standing and seated poses with breath awareness.'),
('Jump rope', 'cardio', 'Calves, Cardio', 'Rope', 'intermediate', 12.3, 'Quick wrist rotations, light bounce on balls of feet.'),
('Overhead press', 'strength', 'Shoulders, Triceps', 'Dumbbell', 'intermediate', 5, 'Press weights overhead, lower to shoulder level with control.'),
('Bent-over row', 'strength', 'Back, Biceps', 'Barbell', 'intermediate', 5, 'Hinge forward, pull weight to lower ribs, squeeze shoulder blades.'),
('Glute bridge', 'strength', 'Glutes, Hamstrings', 'Bodyweight', 'beginner', 3.5, 'Lie on back, drive hips up, squeeze glutes at top.'),
('Russian twist', 'strength', 'Core, Obliques', 'Bodyweight', 'beginner', 4, 'Seated, lean back, rotate torso side to side.');