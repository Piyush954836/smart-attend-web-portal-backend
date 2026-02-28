import { supabase, supabaseAdmin } from '../config/supabase.js';

// 1. Get students scoped by Role (Handled by RLS)
export const getMyStudents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('roll_number', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Bulk Import Students (For Mentors)
export const bulkImportStudents = async (req, res) => {
  try {
    const { students } = req.body; // Array of student objects
    const creator = req.user;

    // Enrich data with creator's department/year context
    const enrichedStudents = students.map(s => ({
      ...s,
      department: creator.user_metadata.department,
      mentor_id: creator.id,
      created_at: new Date()
    }));

    const { data, error } = await supabaseAdmin
      .from('students')
      .insert(enrichedStudents);

    if (error) throw error;
    res.status(201).json({ message: `${students.length} students imported successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};