import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * 1. Create Single Schedule Slot (Manual Entry)
 * Handles POST /api/schedules
 */
export const createScheduleSlot = async (req, res) => {
  try {
    const facultyId = req.user.id;
    
    // Insert single slot with faculty_id from JWT
    const { data, error } = await supabaseAdmin
      .from('schedules')
      .insert([{ ...req.body, faculty_id: facultyId }])
      .select();

    if (error) throw error;
    res.status(201).json({ message: "Slot created successfully", data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 2. Bulk Upload Schedule
 * Corrected to look for 'schedules' key from frontend
 */
export const uploadSchedule = async (req, res) => {
  try {
    const { schedules } = req.body; // Changed from scheduleSlots to match frontend
    const facultyId = req.user.id;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ error: "Invalid schedule format. Expected an array." });
    }

    const enrichedSlots = schedules.map(slot => ({
      ...slot,
      faculty_id: facultyId
    }));

    const { data, error } = await supabaseAdmin
      .from('schedules')
      .insert(enrichedSlots)
      .select();

    if (error) throw error;
    res.status(201).json({ message: "Schedule uploaded successfully", count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 3. Get My Schedule
 */
export const getMySchedule = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('faculty_id', facultyId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 4. Update Specific Slot
 */
export const updateScheduleSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const facultyId = req.user.id;

    const { data: checkSlot, error: fetchError } = await supabaseAdmin
      .from('schedules')
      .select('faculty_id')
      .eq('id', id)
      .single();

    if (fetchError || !checkSlot) return res.status(404).json({ error: "Slot not found." });
    if (checkSlot.faculty_id !== facultyId) return res.status(403).json({ error: "Unauthorized access." });

    const { data, error } = await supabaseAdmin
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.status(200).json({ message: "Slot updated successfully", data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 5. Delete Specific Slot
 */
export const deleteScheduleSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.user.id;

    const { error } = await supabaseAdmin
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('faculty_id', facultyId);

    if (error) throw error;
    res.status(200).json({ message: "Slot deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};