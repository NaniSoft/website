import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';
import { color, font, radius } from '@nanisoft/identity';

/*
 * antd themes mapped onto @nanisoft/identity (SPEC §2). Values come verbatim
 * from the identity package — no new hexes here.
 *
 * Shape lock: seed borderRadius = inner (12); borderRadiusLG is overridden to
 * card (20) because antd's genRadius would otherwise derive 14; buttons become
 * pills per-instance via shape="round" (antd v6 component config accepts no
 * global radius override, and "round" sets radius to the control height).
 *
 * The interactive base is monochrome-inverted per mode: petrol buttons with
 * bone text in light mode, bone buttons with petrol text in dark mode. Teal
 * stays the supporting/secondary color and jade never enters the theme —
 * jade is reserved for live/active states only.
 */

const shared = {
  fontFamily: font.voice,
  fontSize: 16,
  borderRadius: radius.inner,
  // Map-token override: cards (and large controls) use the card radius.
  borderRadiusLG: radius.card,
};

export const lightTokens = {
  ...shared,
  colorPrimary: color.petrol,
  colorInfo: color.teal,
  colorBgLayout: color.bone,
  colorBgContainer: color.boneElev,
  colorBorder: color.boneSunken,
  colorText: color.ink,
  colorTextSecondary: color.inkMuted,
  // Text on solid fills is bone, never pure white.
  colorTextLightSolid: color.bone,
};

export const darkTokens = {
  ...shared,
  colorPrimary: color.boneElev,
  colorInfo: color.teal,
  colorBgLayout: color.petrol,
  colorBgContainer: color.petrolMid,
  colorBorder: color.petrolSoft,
  colorText: color.bone,
  colorTextSecondary: color.petrolTint,
  colorTextLightSolid: color.petrol,
};

export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: lightTokens,
  components: { Button: { primaryColor: color.bone } },
};

export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: darkTokens,
  components: { Button: { primaryColor: color.petrol } },
};
