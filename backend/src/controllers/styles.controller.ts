import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { db } from '../db/client';
import { userProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface StyleGuidelines {
  colors: string[];
  fonts: string[];
  variables: Array<{ name: string; value: string }>;
}

function parseCssGuidelines(cssText: string): StyleGuidelines {
  const colors = [...cssText.matchAll(/(?:color|background|border)[^:]*:\s*(#[0-9a-fA-F]{3,8}|rgb[^;]+)/gi)]
    .map(m => m[1].trim());
  const fonts = [...cssText.matchAll(/font-family:\s*([^;]+)/gi)]
    .map(m => m[1].trim().replace(/['"]/g, ''));
  const variables = [...cssText.matchAll(/--([\w-]+):\s*([^;}\n]+)/g)]
    .map(m => ({ name: m[1], value: m[2].trim() }));
  return {
    colors: [...new Set(colors)].slice(0, 20),
    fonts: [...new Set(fonts)].slice(0, 10),
    variables: variables.slice(0, 30),
  };
}

export async function uploadStyleHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  if (file.size > 50 * 1024) {
    res.status(400).json({ error: 'File too large. Maximum 50KB.' });
    return;
  }

  const cssText = file.buffer.toString('utf-8');
  const guidelines = parseCssGuidelines(cssText);

  // Upload to Supabase Storage
  const supabase = getSupabase();
  const path = `styles/${userId}/style.css`;
  const { error: uploadError } = await supabase.storage
    .from('styles')
    .upload(path, file.buffer, { contentType: 'text/css', upsert: true });

  if (uploadError) {
    console.error('[Styles] Upload error:', uploadError);
    res.status(500).json({ error: 'Failed to upload file' });
    return;
  }

  await db.update(userProfiles)
    .set({ styleGuidelines: guidelines, styleFileUrl: path })
    .where(eq(userProfiles.userId, userId));

  res.json({ guidelines, fileUrl: path });
}

export async function getStyleHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const profile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) });
  res.json({
    guidelines: profile?.styleGuidelines ?? null,
    fileUrl: profile?.styleFileUrl ?? null,
  });
}

export async function deleteStyleHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const profile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) });

  if (profile?.styleFileUrl) {
    const supabase = getSupabase();
    await supabase.storage.from('styles').remove([profile.styleFileUrl]);
  }

  await db.update(userProfiles)
    .set({ styleGuidelines: null, styleFileUrl: null })
    .where(eq(userProfiles.userId, userId));

  res.json({ success: true });
}

export async function getProfileHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const profile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) });
  res.json({
    userId,
    role: req.user!.role,
    monthlySpendUsd: req.user!.monthlySpendUsd,
    monthlyLimitUsd: 0.10,
    styleGuidelines: profile?.styleGuidelines ?? null,
    hasStyle: !!profile?.styleFileUrl,
  });
}
