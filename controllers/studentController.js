import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * 1. Get Students
 * Fetches students based on the user's role and scope.
 * RLS in Supabase handles the actual filtering logic.
 */
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

/**
 * 2. Single Student Enrollment
 * Enrolls one student and inherits context from the logged-in user.
 */
export const enrollStudent = async (req, res) => {
  try {
    const { full_name, roll_number, section, year } = req.body;
    const creator = req.user;

    const { data, error } = await supabaseAdmin
      .from('students')
      .insert([
        {
          full_name,
          roll_number,
          section: section || creator.user_metadata.section,
          year: year || creator.user_metadata.year,
          department: creator.user_metadata.department, // Inherited from creator
          mentor_id: creator.id,                        // Linked to creator
        },
      ])
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "A student with this roll number already exists." });
      }
      throw error;
    }

    res.status(201).json({
      message: "Student enrolled successfully.",
      student: data[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 3. Bulk Import Students
 * Handles multiple enrollments from a list (e.g., CSV/Excel import).
 */
export const bulkImportStudents = async (req, res) => {
  try {
    const { students } = req.body; // Expects an array of objects
    const creator = req.user;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: "Invalid student list provided." });
    }

    // Enrich data with creator's department/year context
    const enrichedStudents = students.map(s => ({
      ...s,
      department: creator.user_metadata.department,
      mentor_id: creator.id,
      // Fallback to creator metadata if specific year/section isn't in the object
      year: s.year || creator.user_metadata.year,
      section: s.section || creator.user_metadata.section,
      created_at: new Date()
    }));

    const { error } = await supabaseAdmin
      .from('students')
      .insert(enrichedStudents);

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "Bulk import failed: One or more roll numbers already exist." });
      }
      throw error;
    }

    res.status(201).json({ message: `${students.length} students imported successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};