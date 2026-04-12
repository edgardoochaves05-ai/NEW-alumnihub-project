import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

const router = Router();

// ── Get conversations (with search and filters) ──
router.get("/conversations", authenticate, async (req, res, next) => {
  try {
    const { search, program, unread_only } = req.query;

    // Get all conversation IDs the user is part of
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("profile_id", req.user.id);

    if (!participations?.length) return res.json([]);

    const convIds = participations.map((p) => p.conversation_id);

    // Get conversations with participants and messages
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        id, updated_at,
        conversation_participants(
          profile_id,
          profiles(id, first_name, last_name, avatar_url, role, program)
        ),
        messages(id, content, sender_id, created_at, is_read)
      `)
      .in("id", convIds)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // Format and apply filters
    let formatted = conversations.map((conv) => {
      const otherParticipants = conv.conversation_participants
        .filter((p) => p.profile_id !== req.user.id)
        .map((p) => p.profiles);

      const lastMessage = conv.messages
        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      const unreadCount = conv.messages?.filter(
        (m) => m.sender_id !== req.user.id && !m.is_read
      ).length || 0;

      return {
        id: conv.id,
        participants: otherParticipants,
        lastMessage,
        unreadCount,
        updatedAt: conv.updated_at,
      };
    });

    // Filter: search by participant name
    if (search) {
      const searchLower = search.toLowerCase();
      formatted = formatted.filter((conv) =>
        conv.participants.some((p) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchLower)
        )
      );
    }

    // Filter: by program of the other participant
    if (program) {
      formatted = formatted.filter((conv) =>
        conv.participants.some((p) => p.program === program)
      );
    }

    // Filter: unread only
    if (unread_only === "true") {
      formatted = formatted.filter((conv) => conv.unreadCount > 0);
    }

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// ── Get messages in a conversation ──
router.get("/:conversationId", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*, profiles!sender_id(first_name, last_name, avatar_url)")
      .eq("conversation_id", req.params.conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Mark as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", req.params.conversationId)
      .neq("sender_id", req.user.id);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Send message (with privacy check) ──
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { recipientId, content, conversationId } = req.body;
    let convId = conversationId;

    // If starting a new conversation, check if recipient is private
    if (!convId && recipientId) {
      const { data: recipient } = await supabase
        .from("profiles")
        .select("is_private")
        .eq("id", recipientId)
        .single();

      if (recipient?.is_private) {
        // Check if there's an accepted message request
        const { data: request } = await supabase
          .from("message_requests")
          .select("status")
          .eq("sender_id", req.user.id)
          .eq("recipient_id", recipientId)
          .single();

        if (!request || request.status !== "accepted") {
          return res.status(403).json({
            error: "This user has a private profile. Send a message request first.",
            requiresRequest: true,
          });
        }
      }
    }

    // Create new conversation if needed
    if (!convId) {
      const { data: conv } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      convId = conv.id;

      await supabase.from("conversation_participants").insert([
        { conversation_id: convId, profile_id: req.user.id },
        { conversation_id: convId, profile_id: recipientId },
      ]);
    }

    // Insert message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        sender_id: req.user.id,
        content,
      })
      .select("*, profiles!sender_id(first_name, last_name, avatar_url)")
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);

    res.status(201).json({ message, conversationId: convId });
  } catch (err) {
    next(err);
  }
});

export default router;
