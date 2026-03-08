import { supabase, supabaseAdmin } from '../config/supabase.js';

// Helper: Ensure we have the creator's department/year even if JWT metadata is empty
const resolveCreatorContext = async (user) => {
  let context = {
    department: user.user_metadata?.department,
    year: user.user_metadata?.year,
    section: user.user_metadata?.section
  };

  if (!context.department) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('department, year, section')
      .eq('id', user.id)
      .single();
    if (data) context = data;
  }
  return context;
};

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

export const enrollStudent = async (req, res) => {
  try {
    const { 
      full_name, 
      roll_number, 
      email,           // New Field
      section, 
      year, 
      phone_number, 
      parent_name, 
      parent_phone_number 
    } = req.body;
    
    const context = await resolveCreatorContext(req.user);

    const { data, error } = await supabaseAdmin
      .from('students')
      .insert([
        {
          full_name,
          roll_number,
          email,               // Added to insert
          phone_number,
          parent_name,
          parent_phone_number,
          section: section || context.section,
          year: year || context.year,
          department: context.department, 
          mentor_id: req.user.id,
        },
      ])
      .select();

    if (error) {
      if (error.code === '23505') {
        const field = error.message.includes('email') ? 'Email' : 'Roll number';
        return res.status(400).json({ error: `${field} already exists.` });
      }
      throw error;
    }

    res.status(201).json({ message: "Student enrolled successfully.", student: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const bulkImportStudents = async (req, res) => {
  try {
    const { students } = req.body;
    const context = await resolveCreatorContext(req.user);

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: "Invalid student list." });
    }

    const enrichedStudents = students.map(s => ({
      full_name: s.full_name,
      roll_number: s.roll_number,
      email: s.email,          // Added to bulk mapping
      phone_number: s.phone_number,
      parent_name: s.parent_name,
      parent_phone_number: s.parent_phone_number,
      department: context.department,
      mentor_id: req.user.id,
      year: s.year || context.year,
      section: s.section || context.section,
      created_at: new Date()
    }));

    const { error } = await supabaseAdmin.from('students').insert(enrichedStudents);
    if (error) {
        if (error.code === '23505') return res.status(400).json({ error: "Duplicate roll numbers or emails detected." });
        throw error;
    }

    res.status(201).json({ message: `${students.length} students imported successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};