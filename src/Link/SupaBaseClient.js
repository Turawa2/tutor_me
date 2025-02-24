import { createClient } from '@supabase/supabase-js';

const supabaseURL = "https://rbxxifqxnlmbuvlvuppn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieHhpZnF4bmxtYnV2bHZ1cHBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNTExMDIsImV4cCI6MjA1NTYyNzEwMn0.nEHAcSIAf3_bwiTosgVRaZOFweIt05AkIYLicZ3L5Zg";



const supabase = createClient(supabaseURL, supabaseAnonKey);

export default supabase;

