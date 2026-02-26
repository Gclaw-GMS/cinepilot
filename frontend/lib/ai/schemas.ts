import { z } from 'zod';

// =============================================================================
// Zod schemas for all strict JSON outputs from AI calls.
// Used with jsonCompletion() to validate + repair LLM responses.
// =============================================================================

// -----------------------------------------------------------------------------
// N16 — Script Parsing & AI Breakdown
// -----------------------------------------------------------------------------

export const SceneBoundarySchema = z.object({
  scenes: z.array(
    z.object({
      scene_index: z.number(),
      scene_number: z.string(),
      heading_raw: z.string().optional(),
      int_ext: z.string().optional(),
      time_of_day: z.string().optional(),
      location_text: z.string().optional(),
      start_line: z.number(),
      end_line: z.number(),
      page_start: z.number().optional(),
      page_end: z.number().optional(),
      confidence: z.number().min(0).max(1),
    })
  ),
  notes: z.array(z.string()).optional(),
});
export type SceneBoundaryResult = z.infer<typeof SceneBoundarySchema>;

export const EntityExtractionSchema = z.object({
  scene_number: z.string(),
  characters: z.array(
    z.object({
      name: z.string(),
      aliases: z.array(z.string()).optional(),
      role_hint: z.string().optional(),
      confidence: z.number().min(0).max(1),
    })
  ),
  locations: z.array(
    z.object({
      name: z.string(),
      details: z.string().optional(),
      confidence: z.number().min(0).max(1),
    })
  ),
  props: z.array(
    z.object({
      name: z.string(),
      quantity_hint: z.string().optional(),
      confidence: z.number().min(0).max(1),
    })
  ),
  vfx: z.array(
    z.object({
      description: z.string(),
      type: z.enum(['explicit', 'implied']),
      confidence: z.number().min(0).max(1),
    })
  ).optional(),
  safety_notes: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      severity: z.enum(['low', 'med', 'high']),
    })
  ).optional(),
});
export type EntityExtractionResult = z.infer<typeof EntityExtractionSchema>;

export const CanonicalizationSchema = z.object({
  characters: z.array(
    z.object({
      canonical: z.string(),
      aliases: z.array(z.string()),
      merge_keys: z.array(z.string()).optional(),
    })
  ),
  locations: z.array(
    z.object({
      canonical: z.string(),
      aliases: z.array(z.string()),
      merge_keys: z.array(z.string()).optional(),
    })
  ),
});
export type CanonicalizationResult = z.infer<typeof CanonicalizationSchema>;

export const QualityScoreSchema = z.object({
  scores: z.object({
    formatting: z.number().min(0).max(100),
    pacing: z.number().min(0).max(100),
    dialogue_density: z.number().min(0).max(100),
    readability: z.number().min(0).max(100),
    overall: z.number().min(0).max(100),
  }),
  notes: z.array(z.string()).optional(),
  quick_fixes: z.array(z.string()).optional(),
});
export type QualityScoreResult = z.infer<typeof QualityScoreSchema>;

export const CharacterConsistencySchema = z.object({
  issues: z.array(
    z.object({
      character: z.string(),
      type: z.enum(['continuity', 'personality', 'timeline']),
      severity: z.enum(['low', 'med', 'high']),
      description: z.string(),
      scene_refs: z.array(z.string()),
    })
  ),
});
export type CharacterConsistencyResult = z.infer<typeof CharacterConsistencySchema>;

export const PlotHolesSchema = z.object({
  plot_holes: z.array(
    z.object({
      severity: z.enum(['low', 'med', 'high']),
      description: z.string(),
      scene_refs: z.array(z.string()),
      suggested_fix: z.string().optional(),
    })
  ),
});
export type PlotHolesResult = z.infer<typeof PlotHolesSchema>;

export const BreakdownSummarySchema = z.object({
  total_scenes: z.number(),
  unique_characters: z.number(),
  unique_locations: z.number(),
  key_props: z.array(z.string()),
  vfx_count: z.number(),
  safety_warnings_count: z.number(),
  estimated_shoot_days: z.number().optional(),
  cultural_notes: z.array(z.string()).optional(),
  summary: z.string(),
});
export type BreakdownSummaryResult = z.infer<typeof BreakdownSummarySchema>;

// -----------------------------------------------------------------------------
// N15 — Shot Hub
// -----------------------------------------------------------------------------

export const BeatSegmentationSchema = z.object({
  beats: z.array(
    z.object({
      beat_index: z.number(),
      summary: z.string(),
      characters: z.array(z.string()),
      tone: z.array(z.string()),
      pacing: z.enum(['slow', 'medium', 'fast']),
    })
  ),
});
export type BeatSegmentationResult = z.infer<typeof BeatSegmentationSchema>;

export const ShotGenerationSchema = z.object({
  scene_id: z.string(),
  shots: z.array(
    z.object({
      shot_index: z.number(),
      beat_index: z.number(),
      shot_text: z.string(),
      characters: z.array(z.string()),
      camera: z.object({
        shot_size: z.string().nullable(),
        angle: z.string().nullable(),
        movement: z.string().nullable(),
      }),
      lens: z.object({
        focal_length_mm: z.number().nullable(),
        lens_type: z.string().nullable(),
      }),
      lighting: z.object({
        key_style: z.string().nullable(),
        color_temp: z.string().nullable().optional(),
      }),
      duration_estimate_sec: z.number().nullable(),
      confidence: z.object({
        camera: z.number(),
        lens: z.number(),
        lighting: z.number(),
        duration: z.number(),
      }),
      ai_reason_missing: z.record(z.string(), z.string()).optional(),
    })
  ),
});
export type ShotGenerationResult = z.infer<typeof ShotGenerationSchema>;

export const FillNullSchema = z.object({
  suggestions: z.array(
    z.object({
      shot_id: z.string(),
      camera: z.array(
        z.object({ shot_size: z.string(), angle: z.string().optional(), movement: z.string().optional(), confidence: z.number() })
      ).optional(),
      lens: z.array(
        z.object({ focal_length_mm: z.number(), lens_type: z.string().optional(), confidence: z.number() })
      ).optional(),
      lighting: z.array(
        z.object({ key_style: z.string(), confidence: z.number() })
      ).optional(),
      duration: z.array(
        z.object({ duration_estimate_sec: z.number(), confidence: z.number() })
      ).optional(),
      notes: z.string().optional(),
    })
  ),
});
export type FillNullResult = z.infer<typeof FillNullSchema>;

export const DurationEstimationSchema = z.object({
  durations: z.array(
    z.object({
      shot_id: z.string(),
      duration_estimate_sec: z.number(),
      reasoning: z.string().optional(),
    })
  ),
});
export type DurationEstimationResult = z.infer<typeof DurationEstimationSchema>;

// -----------------------------------------------------------------------------
// N13 — Location Scouter
// -----------------------------------------------------------------------------

export const LocationKeywordsSchema = z.object({
  keywords: z.array(z.string()),
  terrain_type: z.string().optional(),
  required_features: z.array(z.string()).optional(),
  avoid_features: z.array(z.string()).optional(),
  time_of_day: z.string().optional(),
  season_preference: z.string().optional(),
});
export type LocationKeywordsResult = z.infer<typeof LocationKeywordsSchema>;

// -----------------------------------------------------------------------------
// N14 — Schedule Engine
// -----------------------------------------------------------------------------

export const ConstraintNormalizerSchema = z.object({
  hard_constraints: z.object({
    max_hours_per_day: z.number().optional(),
    tfpc_rules: z.array(z.string()).optional(),
    cast_blocks: z.array(z.unknown()).optional(),
    location_locks: z.array(z.unknown()).optional(),
    equipment_locks: z.array(z.unknown()).optional(),
  }),
  soft_constraints: z.object({
    preferred_sequence: z.array(z.unknown()).optional(),
    weather_preferences: z.array(z.unknown()).optional(),
    cost_optimizations: z.array(z.unknown()).optional(),
    travel_minimization: z.boolean().optional(),
    penalties: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type ConstraintNormalizerResult = z.infer<typeof ConstraintNormalizerSchema>;

export const ConflictResolverSchema = z.object({
  proposals: z.array(
    z.object({
      rank: z.number(),
      action: z.string(),
      description: z.string(),
      scenes_affected: z.array(z.string()).optional(),
      tradeoff: z.string(),
      estimated_impact: z.string().optional(),
    })
  ),
});
export type ConflictResolverResult = z.infer<typeof ConflictResolverSchema>;

// -----------------------------------------------------------------------------
// N17 — Budget Engine
// -----------------------------------------------------------------------------

export const BudgetRefinementSchema = z.object({
  refined_items: z.array(
    z.object({
      category: z.string(),
      subcategory: z.string().optional(),
      description: z.string(),
      quantity: z.number(),
      unit: z.string().optional(),
      rate_low: z.number(),
      rate_high: z.number(),
      total_low: z.number(),
      total_high: z.number(),
      source: z.string(),
      notes: z.string().optional(),
    })
  ),
  risks: z.array(
    z.object({
      category: z.string(),
      description: z.string(),
      severity: z.enum(['low', 'med', 'high']),
    })
  ).optional(),
  questions_for_user: z.array(z.string()).optional(),
});
export type BudgetRefinementResult = z.infer<typeof BudgetRefinementSchema>;

export const AnomalyClassificationSchema = z.object({
  classification: z.string(),
  severity: z.enum(['low', 'med', 'high']),
  description: z.string(),
  investigation_steps: z.array(z.string()),
});
export type AnomalyClassificationResult = z.infer<typeof AnomalyClassificationSchema>;

export const ReallocationSchema = z.object({
  reallocations: z.array(
    z.object({
      rank: z.number(),
      title: z.string(),
      savings_low: z.number(),
      savings_high: z.number(),
      impact_risk: z.enum(['low', 'med', 'high']),
      creative_risk: z.enum(['low', 'med', 'high']),
      tradeoff: z.string(),
      steps: z.array(z.string()),
    })
  ),
});
export type ReallocationResult = z.infer<typeof ReallocationSchema>;

export const InvoiceVerificationSchema = z.object({
  extracted: z.object({
    vendor_name: z.string(),
    invoice_number: z.string(),
    invoice_date: z.string(),
    line_items: z.array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        rate: z.number(),
        amount: z.number(),
      })
    ),
    tax: z.number(),
    total: z.number(),
  }),
  checks: z.object({
    over_contract_rate: z.array(z.string()),
    duplicate_invoice: z.boolean(),
    missing_po: z.boolean(),
    unexpected_category: z.array(z.string()),
  }),
  recommended_action: z.enum(['approve', 'flag', 'reject']),
  notes: z.array(z.string()).optional(),
});
export type InvoiceVerificationResult = z.infer<typeof InvoiceVerificationSchema>;

// -----------------------------------------------------------------------------
// N19 — Censor Board
// -----------------------------------------------------------------------------

export const SceneFlaggingSchema = z.object({
  scene_id: z.string(),
  flags: z.array(
    z.object({
      category: z.enum(['violence', 'profanity', 'drugs', 'sexual_content', 'hate', 'child_harm']),
      severity: z.number().min(0).max(5),
      context: z.enum(['glorified', 'condemned', 'comic', 'serious']),
      evidence: z.array(
        z.object({
          line_start: z.number(),
          line_end: z.number(),
          snippet: z.string(),
        })
      ),
    })
  ),
});
export type SceneFlaggingResult = z.infer<typeof SceneFlaggingSchema>;

export const CertificateCalibrationSchema = z.object({
  predicted_certificate: z.string(),
  confidence: z.enum(['low', 'med', 'high']),
  top_drivers: z.array(z.string()),
  high_risk_scenes: z.array(
    z.object({
      scene_number: z.string(),
      reason: z.string(),
    })
  ),
  uncertainties: z.array(z.string()),
});
export type CertificateCalibrationResult = z.infer<typeof CertificateCalibrationSchema>;

export const TargetOptimizerSchema = z.object({
  target: z.string(),
  recommendations: z.array(
    z.object({
      rank: z.number(),
      scene_number: z.string(),
      issue: z.string(),
      suggested_change: z.string(),
      why: z.string().optional(),
      expected_severity_delta: z.number(),
      effort: z.enum(['low', 'med', 'high']),
      creative_risk: z.enum(['low', 'med', 'high']),
      expected_certificate_impact: z.string().optional(),
    })
  ),
});
export type TargetOptimizerResult = z.infer<typeof TargetOptimizerSchema>;
