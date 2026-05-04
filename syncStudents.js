// backend/syncStudents.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use SERVICE ROLE KEY, not ANON KEY
);

async function syncStudentsToAuth() {
  // 1. Fetch students from your public table
  const { data: students, error: fetchError } = await supabaseAdmin
    .from('students')
    .select('id, email, roll_number, full_name');

  if (fetchError) {
    console.error("Error fetching students:", fetchError);
    return;
  }

  console.log(`Starting sync for ${students.length} students...`);

  for (const student of students) {
    if (!student.email) continue;

    // 2. Create the user in Auth properly
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: student.email,
      password: student.roll_number, // Roll Number as password
      email_confirm: true,
      user_metadata: { 
        role: 'student', 
        full_name: student.full_name 
      }
    });

    if (error) {
      if (error.message.includes("already registered")) {
        console.log(`Skipping: ${student.email} (Already exists)`);
      } else {
        console.error(`Failed for ${student.email}:`, error.message);
      }
    } else {
      console.log(`✅ Synced: ${student.email}`);
      
      // 3. Update the existing student record ID to match the new Auth ID
      // If your current student IDs are already correct, this just confirms it.
      await supabaseAdmin
        .from('students')
        .update({ id: data.user.id })
        .eq('email', student.email);
    }
  }
  console.log("Sync complete!");
}

syncStudentsToAuth();