import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyqcxpqdrwcpphvzmikt.supabase.co';
const supabaseAnonKey = 'sb_publishable_nFQQc8cqGzOg8lIq84VRgg_Jn5dVXXv';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
