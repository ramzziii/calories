// YumTrack visual identity
// Warm, appetite-friendly palette — cream backgrounds, coral accent.
// Deliberately avoids the stark-white / neon-green "fitness app" look.

export const colors = {
  // Backgrounds
  background: "#FBF3EA", // warm cream
  backgroundAlt: "#F5E9DA", // slightly deeper cream, for section breaks
  card: "#FFFFFF",
  cardAlt: "#FFF8F0",

  // Accent — warm coral
  accent: "#F0664D",
  accentDark: "#D6492F",
  accentLight: "#FADCD3",
  accentSoft: "#FCEEE9",

  // Macro colors (kept warm/muted, not neon)
  protein: "#C1553A", // terracotta-red
  carbs: "#D9A441", // warm mustard
  fat: "#7C8C64", // muted sage

  // Text
  text: "#2B2320",
  textMuted: "#7A6F65",
  textFaint: "#B0A69B",
  textOnAccent: "#FFFFFF",

  // Utility
  border: "#E7DACB",
  success: "#6E8B5C",
  error: "#C0392B",
  overlay: "rgba(43, 35, 32, 0.55)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: colors.text,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: colors.text,
    lineHeight: 22,
  },
  bodyMuted: {
    fontSize: 15,
    fontWeight: "400" as const,
    color: colors.textMuted,
    lineHeight: 21,
  },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  button: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.textOnAccent,
  },
};

export const shadow = {
  card: {
    shadowColor: "#3A2C22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

const theme = { colors, spacing, radii, typography, shadow };
export default theme;
