import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';

// 1. Start a Session & Generate Secret
export const startAttendanceSession = async (req, res) => {
  try {
    const { schedule_id } = req.body;
    const session_secret = crypto.randomBytes(32).toString('hex');
    
    const { data, error } = await supabaseAdmin
      .from('attendance_sessions')
      .insert([{
        schedule_id,
        faculty_id: req.user.id,
        session_secret,
        expires_at: new Date(Date.now() + 60 * 60 * 1000) // Valid for 1 hour
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ session_id: data.id, session_secret: data.session_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Student Verification Logic
export const verifyDynamicQR = async (req, res) => {
  try {
    const { session_id, qr_token, roll_number } = req.body;

    // Fetch session secret
    const { data: session, error } = await supabaseAdmin
      .from('attendance_sessions')
      .select('session_secret, is_active')
      .eq('id', session_id)
      .single();

    if (error || !session.is_active) return res.status(403).json({ error: "Session inactive" });

    // Generate valid tokens for current and previous 5sec window (lag tolerance)
    const now = Math.floor(Date.now() / 5000);
    const validTokens = [
      crypto.createHmac('sha256', session.session_secret).update(now.toString()).digest('hex'),
      crypto.createHmac('sha256', session.session_secret).update((now - 1).toString()).digest('hex')
    ];

    if (!validTokens.includes(qr_token)) {
      return res.status(401).json({ error: "QR Code expired. Scan again." });
    }

    // If valid, proceed to mark attendance in your 'attendance' table
    res.status(200).json({ message: "Attendance verified successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};