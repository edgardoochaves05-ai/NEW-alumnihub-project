import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

const router = Router();

// ── Get incoming requests (for current user) ──
router.get("/incoming", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("message_requests")
      .select(`
        *,
        sender:profiles!sender_id(id, first_name, last_name, avatar_url, program, current_job_title)
      `)
      .eq("recipient_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Get outgoing requests (sent by current user) ──
router.get("/outgoing", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("message_requests")
      .select(`
        *,
        recipient:profiles!recipient_id(id, first_name, last_name, avatar_url, program)
      `)
      .eq("sender_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Send a message request ──
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { recipientId, message } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    if (recipientId === req.user.id) {
      return res.status(400).json({ error: "You cannot send a request to yourself" });
    }

    // Check recipient is actually private
    const { data: recipient } = await supabase
      .from("profiles")
      .select("is_private, first_name, last_name")
      .eq("id", recipientId)
      .single();

    if (!recipient) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!recipient.is_private) {
      return res.status(400).json({
        error: "This user's profile is public. You can message them directly.",
      });
    }

    // Check if a request already exists
    const { data: existing } = await supabase
      .from("message_requests")
      .select("id, status")
      .eq("sender_id", req.user.id)
      .eq("recipient_id", recipientId)
      .single();

    if (existing) {
      if (existing.status === "pending") {
        return res.status(409).json({ error: "You already have a pending request to this user" });
      }
      if (existing.status === "accepted") {
        return res.status(409).json({ error: "Your request was already accepted. You can message them directly." });
      }
      if (existing.status === "declined") {
        // Allow re-sending if previously declined — update the existing record
        const { data, error } = await supabase
          .from("message_requests")
          .update({ status: "pending", message, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return res.json(data);
      }
    }

    // Create new request
    const { data, error } = await supabase
      .from("message_requests")
      .insert({
        sender_id: req.user.id,
        recipient_id: recipientId,
        message,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ── Accept a message request ──
router.patch("/:id/accept", authenticate, async (req, res, next) => {
  try {
    const { data: request, error: fetchError } = await supabase
      .from("message_requests")
      .select("*")
      .eq("id", req.params.id)
      .eq("recipient_id", req.user.id)
      .eq("status", "pending")
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: "Request not found or already processed" });
    }

    // Update status
    const { data, error } = await supabase
      .from("message_requests")
      .update({ status: "accepted" })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Automatically create a conversation between the two users
    const { data: conv } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    await supabase.from("conversation_participants").insert([
      { conversation_id: conv.id, profile_id: request.sender_id },
      { conversation_id: conv.id, profile_id: request.recipient_id },
    ]);

    // If the request had a message, add it as the first message
    if (request.message) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: request.sender_id,
        content: request.message,
      });
    }

    res.json({ request: data, conversationId: conv.id });
  } catch (err) {
    next(err);
  }
});

// ── Decline a message request ──
router.patch("/:id/decline", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("message_requests")
      .update({ status: "declined" })
      .eq("id", req.params.id)
      .eq("recipient_id", req.user.id)
      .eq("status", "pending")
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Request not found or already processed" });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
