import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * 1. Bulk Upload Schedule
 * Used for initial setup or adding multiple slots at once.
 */
export const uploadSchedule = async (req, res) => {
  try {
    const { scheduleSlots } = req.body; 
    const facultyId = req.user.id;

    if (!Array.isArray(scheduleSlots) || scheduleSlots.length === 0) {
      return res.status(400).json({ error: "Invalid schedule format. Expected an array of slots." });
    }

    // Enrich slots with faculty_id from the authenticated user
    const enrichedSlots = scheduleSlots.map(slot => ({
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
 * 2. Get My Schedule
 * Returns all slots for the logged-in faculty member, ordered by day and time.
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
 * 3. Update Specific Slot
 * Allows manual editing of a single class/slot.
 */
export const updateScheduleSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const facultyId = req.user.id;

    // Security: Ensure the faculty member owns this slot
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
 * 4. Delete Specific Slot
 */
export const deleteScheduleSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.user.id;

    const { error } = await supabaseAdmin
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('faculty_id', facultyId); // Inline ownership check

    if (error) throw error;
    res.status(200).json({ message: "Slot deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};