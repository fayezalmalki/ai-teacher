/**
 * Looks of الأستاذ نواف. One rig, several outfits: the child (or parent)
 * picks a look and every renderer draws it. Keep ids stable: they are stored
 * per child (ChildSettings.teacherLook) and synced to the account.
 */
export type TeacherLook = "classic" | "shemagh" | "ghutra" | "young";

export interface LookSpec {
  id: TeacherLook;
  /** Label in the picker. */
  name: string;
  skin: string;
  skinShade: string;
  hair: string;
  /** none: hair shows; shemagh: red-checked with igal; ghutra: white with igal. */
  headwear: "none" | "shemagh" | "ghutra";
  glasses: boolean;
  beard: boolean;
  /** Outfit: the white thobe, or a coloured shirt. */
  outfit: "thobe" | "shirt";
}

export const LOOKS: Record<TeacherLook, LookSpec> = {
  classic: { id: "classic", name: "الكلاسيكي", skin: "#F1C9A5", skinShade: "#D9A07C", hair: "#2B2320", headwear: "none", glasses: true, beard: true, outfit: "thobe" },
  shemagh: { id: "shemagh", name: "بالشماغ", skin: "#E8B98F", skinShade: "#C98F66", hair: "#2B2320", headwear: "shemagh", glasses: true, beard: true, outfit: "thobe" },
  ghutra: { id: "ghutra", name: "بالغترة", skin: "#D9A574", skinShade: "#B8804F", hair: "#1E1815", headwear: "ghutra", glasses: false, beard: true, outfit: "thobe" },
  young: { id: "young", name: "الشاب", skin: "#F1C9A5", skinShade: "#D9A07C", hair: "#3A2A22", headwear: "none", glasses: false, beard: false, outfit: "shirt" },
};

export const LOOK_LIST: LookSpec[] = Object.values(LOOKS);
export const DEFAULT_LOOK: TeacherLook = "classic";

/** Any stored value → a known look (old profiles and unknown ids fall back to classic). */
export function resolveLook(id: unknown): LookSpec {
  return typeof id === "string" && id in LOOKS ? LOOKS[id as TeacherLook] : LOOKS[DEFAULT_LOOK];
}
