// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fpbgvbnldvxswldsdhtu.supabase.co";
const supabaseKey = "sb_publishable_g5KxRYARF3VW2dMvr08uuw_BMdDdjJk";

export const supabase = createClient(supabaseUrl, supabaseKey);