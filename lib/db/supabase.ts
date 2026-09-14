/**
 * Persistence stub. The MVP keeps child profile, parent PIN and the last
 * session result in localStorage (see lib/store). Replace these functions with
 * Supabase queries once the project is provisioned:
 *
 *   profiles(id, name, age, grade, parent_pin_hash)
 *   sessions(id, profile_id, lesson_id, started_at, ended_at, questions, correct, reexplain, start_difficulty, end_difficulty)
 *   events(id, session_id, ts, name, payload)
 *   summaries(id, session_id, narrative, recommendations)
 */
import type { SessionResult } from "@/lib/lesson-engine/types";

export interface DbProfile {
  id: string;
  name: string;
  age: number;
  grade: number;
}

export async function saveSession(_profileId: string, result: SessionResult): Promise<{ id: string }> {
  void _profileId;
  void result;
  // TODO(db): insert into `sessions`, then `events` from the analytics buffer.
  return { id: `local-${Date.now()}` };
}

export async function loadRecentSessions(_profileId: string): Promise<SessionResult[]> {
  void _profileId;
  return [];
}
