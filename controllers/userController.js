import { supabaseAdmin } from '../config/supabase.js';

export const getSubUsers = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('parent_id', creatorId);

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSubUser = async (req, res) => {
  try {
    const { email, password, fullName, role, department, year, section } = req.body;
    const creator = req.user; 
    const creatorRole = creator.user_metadata.role;

    // Resolve what the new user's department should be
    const finalDept = creatorRole === 'super_admin' ? department : creator.user_metadata.department;

    // Hierarchy Validation
    const canCreate = 
      (creatorRole === 'super_admin' && role === 'dept_head') ||
      (creatorRole === 'dept_head' && ['mentor', 'faculty'].includes(role)) ||
      (creatorRole === 'mentor' && role === 'staff');

    if (!canCreate) return res.status(403).json({ error: "Invalid Hierarchy Creation Attempt" });

    // 1. Create Auth User (Now including full metadata to prevent future NULLs)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, 
      password, 
      email_confirm: true,
      user_metadata: { 
        role, 
        fullName, 
        department: finalDept, 
        year: year || null, 
        section: section || null 
      }
    });
    if (authError) throw authError;

    // 2. Create Profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert([{
      id: authUser.user.id,
      full_name: fullName,
      email: email, // Added email to profile for easier management
      role,
      department: finalDept,
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