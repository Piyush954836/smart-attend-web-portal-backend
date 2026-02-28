import { supabaseAdmin } from './config/supabase.js';

const bootstrapAdmin = async () => {
  const adminEmail = "admin@college.edu";
  const adminPassword = "AdminPassword123!"; 
  const fullName = "Super Administrator";

  console.log("🚀 Starting System Bootstrap...");

  try {
    let adminId;

    // 1. Try to create the Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { role: 'super_admin', fullName }
    });

    if (authError) {
      // If user exists, we need to find their ID to sync the profile
      if (authError.message.includes("already been registered")) {
        console.log("ℹ️ User exists in Auth. Fetching existing ID...");
        
        // Use the Admin API to list users and find the one with this email
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.find(u => u.email === adminEmail);
        adminId = existingUser.id;
      } else {
        throw authError;
      }
    } else {
      adminId = authUser.user.id;
    }

    // 2. Sync the Profile (Upsert handles Create or Update)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: adminId,
        full_name: fullName,
        email: adminEmail,
        role: 'super_admin'
      }, { onConflict: 'id' });

    if (profileError) throw profileError;

    // 3. Force Metadata Sync (Ensures middleware works)
    await supabaseAdmin.auth.admin.updateUserById(adminId, {
      user_metadata: { role: 'super_admin', fullName }
    });

    console.log("✅ Bootstrap Successful!");
    console.log(`User ID: ${adminId}`);

  } catch (err) {
    console.error("❌ Bootstrap Failed:", err.message);
  }
};

bootstrapAdmin();