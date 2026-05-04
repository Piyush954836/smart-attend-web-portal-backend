import { supabase, supabaseAdmin } from '../config/supabase.js';
import axios from 'axios';

// AI Engine URL from environment variables
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

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

// --- NEW: Trigger Python AI Engine Enrollment ---
export const startAiEnrollment = async (req, res) => {
  try {
    // 1. EXTRACT BOTH fields from the frontend request
    const { roll_number, images_base64 } = req.body;

    // 2. Validate input
    if (!roll_number) {
      return res.status(400).json({ 
        error: "roll_number is required to start AI enrollment." 
      });
    }

    // 3. Ensure the images actually arrived from React
    if (!images_base64 || !Array.isArray(images_base64)) {
      console.error("❌ Node.js did not receive the images_base64 array");
      return res.status(400).json({ 
        error: "Missing biometric frame sequence from camera." 
      });
    }

    console.log(`🔄 [AI Enrollment] Starting for roll_number: ${roll_number}`);
    console.log(`📡 [AI Enrollment] Forwarding ${images_base64.length} frames to Python...`);
    
    // 4. Send BOTH fields to the Python FastAPI /enroll endpoint
    const response = await axios.post(`${AI_ENGINE_URL}/enroll`, { 
      roll_number: roll_number,
      images_base64: images_base64 // <-- THIS IS THE CRITICAL FIX
    }, {
      timeout: 35000 // 35 second timeout
    });

    console.log(`✅ [AI Enrollment] Success for ${roll_number}:`, response.data);
    res.status(200).json(response.data);
    
  } catch (err) {
    console.error("🚨 [AI Enrollment] Error Details:");
    console.error("   - Message:", err.message);
    console.error("   - Status:", err.response?.status);
    console.error("   - Data:", err.response?.data);
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({ 
        error: `AI Engine unavailable at ${AI_ENGINE_URL}. Ensure ai_service.py is running.` 
      });
    }

    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: "AI Engine timeout. Processing took too long. Try again." 
      });
    }

    // Pass the specific FastAPI error message back to the frontend if available
    if (err.response?.status) {
      return res.status(err.response.status).json({ 
        error: err.response.data?.detail || err.response.data?.error || "AI Engine returned an error." 
      });
    }

    res.status(500).json({ 
      error: "AI Engine connection failed. Please try again later." 
    });
  }
};

export const enrollStudent = async (req, res) => {
  try {
    const { 
      full_name, roll_number, email, 
      section, year, phone_number, 
      parent_name, parent_phone_number 
    } = req.body;
    
    const context = await resolveCreatorContext(req.user);

    // 1. Create Auth User first so student can login
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: roll_number, // Default password is Roll Number
      email_confirm: true,
      user_metadata: { role: 'student', full_name }
    });

    if (authError) throw authError;

    // 2. Insert into students table using the new Auth ID[cite: 5]
    const { data, error } = await supabaseAdmin
      .from('students')
      .insert([
        {
          id: authUser.user.id, // Link to Auth[cite: 1]
          full_name,
          roll_number,
          email,
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

    if (error) throw error;

    res.status(201).json({ 
      message: "Student enrolled and Auth account created.", 
      student: data[0] 
    });
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

    // Map through students and create Auth accounts in a loop[cite: 1, 5]
    const results = await Promise.all(students.map(async (s) => {
      const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
        email: s.email,
        password: s.roll_number,
        email_confirm: true,
        user_metadata: { role: 'student', full_name: s.full_name }
      });

      return {
        id: authUser?.user?.id,
        full_name: s.full_name,
        roll_number: s.roll_number,
        email: s.email,
        phone_number: s.phone_number,
        parent_name: s.parent_name,
        parent_phone_number: s.parent_phone_number,
        department: context.department,
        mentor_id: req.user.id,
        year: s.year || context.year,
        section: s.section || context.section,
      };
    }));

    const { error } = await supabaseAdmin.from('students').insert(results);
    if (error) throw error;

    res.status(201).json({ message: `${students.length} students synced and imported.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

export const updateFaceEmbedding = async (req, res) => {
  try {
    const { face_embedding } = req.body;
    const studentId = req.user.id;

    // Log the data being sent to verify it's an array of numbers
    console.log("Updating face for student:", studentId);
    console.log("Vector length:", face_embedding?.length);

    const { data, error } = await supabaseAdmin
      .from('students')
      .update({ 
        face_embedding: face_embedding // Should be [0.12, -0.44, ...]
      })
      .eq('id', studentId)
      .select();

    if (error) {
      console.error("Supabase Update Error:", error);
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ message: "Face profile updated successfully.", data });
  } catch (err) {
    console.error("Server Crash Error:", err.message);
    res.status(500).json({ error: "Internal Server Error: Check backend logs" });
  }
};