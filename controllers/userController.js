import { supabaseAdmin } from '../config/supabase.js';

export const createSubUser = async (req, res) => {
  try {
    const { email, password, fullName, role, department, year, section } = req.body;
    const creator = req.user; // From Middleware
    const creatorRole = creator.user_metadata.role;

    // Hierarchy Validation
    const canCreate = 
      (creatorRole === 'super_admin' && role === 'dept_head') ||
      (creatorRole === 'dept_head' && ['mentor', 'faculty'].includes(role)) ||
      (creatorRole === 'mentor' && role === 'staff');

    if (!canCreate) return res.status(403).json({ error: "Invalid Hierarchy Creation Attempt" });

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role, fullName }
    });
    if (authError) throw authError;

    // 2. Create Profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert([{
      id: authUser.user.id,
      full_name: fullName,
      role,
      department: creatorRole === 'super_admin' ? department : creator.user_metadata.department,
      year: year || null,
      section: section || null,
      parent_id: creator.id
    }]);

    if (profileError) throw profileError;
    res.status(201).json({ message: `${role} created successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};