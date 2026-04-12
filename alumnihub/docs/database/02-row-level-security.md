# Row-Level Security (RLS)

## What is RLS?

Row-Level Security is a PostgreSQL feature that restricts which rows a user can access based on policies. Even if the API has a bug, RLS ensures users can only access data they're authorized to see.

## Policy Summary

### profiles
| Action | Policy |
|--------|--------|
| SELECT | Own profile always visible. Faculty/Admin see all. Alumni see non-private profiles only. |
| UPDATE | Own profile, or Faculty/Admin can update any. |

### career_milestones
| Action | Policy |
|--------|--------|
| SELECT | Everyone can view (public career data). |
| INSERT/UPDATE/DELETE | Own milestones only. |

### job_listings
| Action | Policy |
|--------|--------|
| SELECT | Active jobs visible to all. Poster can see their own inactive jobs. |
| INSERT | Any authenticated user. |
| UPDATE/DELETE | Poster or Faculty/Admin. |

### job_match_scores
| Action | Policy |
|--------|--------|
| SELECT | Own scores only. |

### career_predictions
| Action | Policy |
|--------|--------|
| SELECT | Own predictions, or Faculty/Admin can see all. |

### curriculum_impact
| Action | Policy |
|--------|--------|
| SELECT | Faculty/Admin only. |

### conversations
| Action | Policy |
|--------|--------|
| SELECT | Only conversations user is a participant of. |

### messages
| Action | Policy |
|--------|--------|
| SELECT | Only in conversations user is a participant of. |
| INSERT | Sender must be current user. |

### message_requests
| Action | Policy |
|--------|--------|
| SELECT | Sender or recipient only. |
| INSERT | Sender must be current user. |
| UPDATE | Recipient only (accept/decline). |
| DELETE | Sender only (pending requests). |

### cv_parsed_data
| Action | Policy |
|--------|--------|
| SELECT | Own data, or Faculty/Admin. |
| INSERT/UPDATE/DELETE | Own data only. |

### feedback
| Action | Policy |
|--------|--------|
| SELECT | Own feedback, or Admin sees all. |
| INSERT | Submitted_by must be current user. |
| UPDATE | Admin only. |

### announcements
| Action | Policy |
|--------|--------|
| SELECT | Published announcements visible to all. Faculty/Admin see unpublished too. |
| INSERT/UPDATE | Faculty/Admin. |
| DELETE | Admin only. |

## Helper Function

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

This function is used in policies to check the current user's role without exposing the profiles table directly.
