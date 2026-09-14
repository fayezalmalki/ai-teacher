"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import SessionView from "@/components/session/SessionView";
import LessonNotFound from "@/components/LessonNotFound";
import Frame from "@/components/Frame";
import { getLesson } from "@/lib/lesson-engine";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const lesson = getLesson(id);
  if (!lesson) return <LessonNotFound />;
  return (
    <Suspense fallback={<Frame variant="session">{null}</Frame>}>
      <SessionView lesson={lesson} />
    </Suspense>
  );
}
