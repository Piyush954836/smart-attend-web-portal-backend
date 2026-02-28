import { supabaseAdmin } from '../config/supabaseAdmin';

export const createSubUser = async (creatorId, userData) => {
  // 1. Fetch Creator's info to check permissions
  const { data: creator } = await supabaseAdmin
    .from('profiles')
    .select('role, department')
    .eq('id', creatorId)
    .single();

  // 2. Permission Logic:
  // Super Admin -> Create Dept Head
  // Dept Head -> Create Mentor/Faculty (within same Dept)
  // Mentor -> Create Staff (within same Dept/Year)
  const isAuthorized = 
    (creator.role === 'super_admin' && userData.role === 'dept_head') ||
    (creator.role === 'dept_head' && ['mentor', 'faculty'].includes(userData.role)) ||
    (creator.role === 'mentor' && userData.role === 'staff');

  if (!isAuthorized) throw new Error("Unauthorized hierarchy leap.");

  // 3. Create Auth User
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: { role: userData.role }
  });

  if (authError) throw authError;

  // 4. Insert Profile with Scoped Data
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert([{
      id: authUser.user.id,
      full_name: userData.fullName,
      role: userData.role,
      department: creator.role === 'super_admin' ? userData.department : creator.department,
      year: userData.year || null,
      section: userData.section || null,
      parent_id: creatorId
    }]);

  if (profileError) throw profileError;
  return { success: true };
};