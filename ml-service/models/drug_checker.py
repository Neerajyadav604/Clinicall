"""
Drug Interaction Checker — Module 4
Rule-based classifier with 60+ hardcoded clinical interactions.
100% offline — no API calls, no internet required.

Pipeline:
  1. Load interaction database from drug_interactions.json
  2. Normalize all drug names (lowercase, strip spaces)
  3. Check all pairwise drug-drug interactions
  4. Check allergy family conflicts
  5. Compute overall risk level
  6. Return structured warnings with recommendations
"""

import json
import os
import re
from typing import List, Dict, Any, Optional


# ══════════════════════════════════════════════════════════════════════
# ALLERGY FAMILY MAP (comprehensive)
# ══════════════════════════════════════════════════════════════════════

ALLERGY_FAMILIES = {
    "penicillin": [
        "amoxicillin", "ampicillin", "cloxacillin",
        "flucloxacillin", "piperacillin", "nafcillin",
        "oxacillin", "co-amoxiclav", "augmentin",
        "amoxicillin-clavulanate", "dicloxacillin"
    ],
    "sulfa": [
        "sulfamethoxazole", "co-trimoxazole", "trimethoprim",
        "bactrim", "septran", "sulfadiazine",
        "furosemide", "hydrochlorothiazide",
        "acetazolamide", "celecoxib"
    ],
    "cephalosporin": [
        "cephalexin", "cefazolin", "ceftriaxone", "cefuroxime",
        "cefixime", "cefpodoxime", "cefdinir", "cephalothin",
        "cefotaxime", "ceftazidime", "cefepime"
    ],
    "nsaid": [
        "ibuprofen", "naproxen", "diclofenac", "aspirin",
        "ketorolac", "indomethacin", "celecoxib", "piroxicam",
        "mefenamic acid", "meloxicam", "etoricoxib",
        "nimesulide", "aceclofenac"
    ],
    "tetracycline": [
        "doxycycline", "minocycline", "tetracycline",
        "oxytetracycline", "demeclocycline"
    ],
    "macrolide": [
        "azithromycin", "clarithromycin", "erythromycin",
        "roxithromycin", "telithromycin"
    ],
    "fluoroquinolone": [
        "ciprofloxacin", "levofloxacin", "ofloxacin",
        "norfloxacin", "moxifloxacin", "gatifloxacin",
        "sparfloxacin"
    ],
    "ace inhibitor": [
        "enalapril", "lisinopril", "ramipril", "perindopril",
        "captopril", "benazepril", "fosinopril", "quinapril",
        "trandolapril"
    ],
    "statin": [
        "atorvastatin", "rosuvastatin", "simvastatin",
        "pravastatin", "lovastatin", "fluvastatin",
        "pitavastatin"
    ],
    "beta blocker": [
        "metoprolol", "atenolol", "propranolol", "bisoprolol",
        "carvedilol", "labetalol", "nebivolol", "nadolol"
    ],
    "calcium channel blocker": [
        "amlodipine", "nifedipine", "diltiazem", "verapamil",
        "felodipine", "lercanidipine", "nimodipine"
    ],
    "ssri": [
        "fluoxetine", "sertraline", "paroxetine", "escitalopram",
        "citalopram", "fluvoxamine"
    ],
    "maoi": [
        "phenelzine", "tranylcypromine", "isocarboxazid",
        "selegiline", "moclobemide"
    ],
    "anticoagulant": [
        "warfarin", "heparin", "enoxaparin", "dabigatran",
        "rivaroxaban", "apixaban", "fondaparinux"
    ],
    "corticosteroid": [
        "prednisolone", "dexamethasone", "hydrocortisone",
        "methylprednisolone", "betamethasone", "budesonide",
        "fluticasone", "beclomethasone"
    ],
}


# ══════════════════════════════════════════════════════════════════════
# SEVERITY RANKING
# ══════════════════════════════════════════════════════════════════════

SEVERITY_RANK = {
    "CRITICAL": 4,
    "HIGH":     3,
    "MODERATE": 2,
    "LOW":      1,
    "SAFE":     0,
}

RANK_TO_SEVERITY = {v: k for k, v in SEVERITY_RANK.items()}


# ══════════════════════════════════════════════════════════════════════
# DATABASE LOADER WITH CACHING
# ══════════════════════════════════════════════════════════════════════

_db_cache = None


def _load_interaction_db() -> list:
    """
    Load interaction database from JSON file with in-memory caching.
    Returns list of interaction dicts.
    
    Steps:
    1. If _db_cache is not None, return it (cached)
    2. Try to load from data/drug_interactions.json
    3. If file missing or malformed, return FALLBACK_INTERACTIONS
    4. Set _db_cache = loaded interactions
    5. Print: [ML] Drug interaction database loaded: N interactions
    6. Return _db_cache
    """
    global _db_cache
    
    # Return cached version if available
    if _db_cache is not None:
        return _db_cache
    
    # Fallback hardcoded interactions (critical ones only)
    FALLBACK_INTERACTIONS = [
        {
            "drug1": "Fluoxetine",
            "drug2": "Phenelzine",
            "severity": "CRITICAL",
            "effect": "Serotonin syndrome — potentially fatal.",
            "recommendation": "NEVER combine. 14-day washout required.",
            "mechanism": "Pharmacodynamic — additive serotonergic effect"
        },
        {
            "drug1": "Warfarin",
            "drug2": "Aspirin",
            "severity": "HIGH",
            "effect": "Increased bleeding risk.",
            "recommendation": "Monitor INR closely.",
            "mechanism": "Pharmacodynamic — additive anticoagulant effect"
        },
        {
            "drug1": "Lithium",
            "drug2": "Ibuprofen",
            "severity": "CRITICAL",
            "effect": "Lithium toxicity from reduced renal clearance.",
            "recommendation": "Avoid combination.",
            "mechanism": "Pharmacokinetic — reduced renal elimination"
        },
        {
            "drug1": "Digoxin",
            "drug2": "Amiodarone",
            "severity": "CRITICAL",
            "effect": "Digoxin toxicity from increased levels.",
            "recommendation": "Reduce digoxin dose by 50%.",
            "mechanism": "Pharmacokinetic — P-glycoprotein inhibition"
        },
        {
            "drug1": "Tramadol",
            "drug2": "Phenelzine",
            "severity": "CRITICAL",
            "effect": "Serotonin syndrome and seizures.",
            "recommendation": "NEVER combine.",
            "mechanism": "Pharmacodynamic — serotonergic effect"
        },
        {
            "drug1": "Metformin",
            "drug2": "Alcohol",
            "severity": "MODERATE",
            "effect": "Lactic acidosis risk.",
            "recommendation": "Limit alcohol consumption.",
            "mechanism": "Pharmacokinetic — reduced hepatic metabolism"
        },
        {
            "drug1": "Warfarin",
            "drug2": "Ibuprofen",
            "severity": "HIGH",
            "effect": "Increased bleeding risk.",
            "recommendation": "Avoid combination.",
            "mechanism": "Pharmacodynamic — additive antiplatelet effect"
        },
        {
            "drug1": "Lisinopril",
            "drug2": "Potassium",
            "severity": "HIGH",
            "effect": "Hyperkalemia risk.",
            "recommendation": "Monitor potassium levels.",
            "mechanism": "Pharmacodynamic — additive potassium-sparing effect"
        },
        {
            "drug1": "Simvastatin",
            "drug2": "Clarithromycin",
            "severity": "HIGH",
            "effect": "Myopathy risk from increased statin levels.",
            "recommendation": "Use alternative antibiotic.",
            "mechanism": "Pharmacokinetic — CYP3A4 inhibition"
        },
        {
            "drug1": "Ciprofloxacin",
            "drug2": "Antacid",
            "severity": "LOW",
            "effect": "Reduced ciprofloxacin absorption.",
            "recommendation": "Separate administration by 2 hours.",
            "mechanism": "Pharmacokinetic — reduced absorption"
        },
    ]
    
    try:
        # Get the directory of this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(current_dir, "..", "data", "drug_interactions.json")
        
        # Load from JSON file
        with open(db_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        interactions = data.get("interactions", [])
        if not interactions:
            print("[ML] Warning: drug_interactions.json has empty interactions. Using fallback.")
            interactions = FALLBACK_INTERACTIONS
        
        _db_cache = interactions
        print(f"[ML] Drug interaction database loaded: {len(interactions)} interactions")
        return _db_cache
        
    except FileNotFoundError:
        print("[ML] Warning: drug_interactions.json not found. Using fallback interactions.")
        _db_cache = FALLBACK_INTERACTIONS
        return _db_cache
    except json.JSONDecodeError as e:
        print(f"[ML] Warning: Failed to parse drug_interactions.json: {e}. Using fallback.")
        _db_cache = FALLBACK_INTERACTIONS
        return _db_cache
    except Exception as e:
        print(f"[ML] Warning: Unexpected error loading drug DB: {e}. Using fallback.")
        _db_cache = FALLBACK_INTERACTIONS
        return _db_cache


# ══════════════════════════════════════════════════════════════════════
# DRUG NAME NORMALIZER
# ══════════════════════════════════════════════════════════════════════

def _normalize_drug(name: str) -> str:
    """
    Normalize drug name for matching.
    Steps:
    1. Strip whitespace
    2. Lowercase
    3. Remove trailing/leading punctuation
    4. Handle common brand→generic mappings
    5. Return normalized string
    """
    if not name:
        return ""
    
    # Step 1-3: Strip, lowercase, remove punctuation
    normalized = name.strip().lower()
    normalized = re.sub(r'^[^\w]+|[^\w]+$', '', normalized)
    
    # Step 4: Brand name mappings
    brand_mappings = {
        "augmentin":    "amoxicillin-clavulanate",
        "bactrim":      "co-trimoxazole",
        "crocin":       "paracetamol",
        "dolo":         "paracetamol",
        "brufen":       "ibuprofen",
        "combiflam":    "ibuprofen",
        "disprin":      "aspirin",
        "pan":          "pantoprazole",
        "rantac":       "ranitidine",
        "clavam":       "amoxicillin-clavulanate",
        "nexium":       "esomeprazole",
        "prilosec":     "omeprazole",
        "advil":        "ibuprofen",
        "motrin":       "ibuprofen",
        "aleve":        "naproxen",
        "tylenol":      "paracetamol",
        "acetaminophen":"paracetamol",
    }
    
    if normalized in brand_mappings:
        normalized = brand_mappings[normalized]
    
    return normalized


# ══════════════════════════════════════════════════════════════════════
# PAIRWISE INTERACTION CHECKER
# ══════════════════════════════════════════════════════════════════════

def _find_interactions(normalized_meds: list, original_meds: list) -> list:
    """
    Check all pairwise combinations of medications against
    the interaction database.
    Returns list of interaction dicts with original drug names.
    """
    interactions = []
    seen_pairs = set()
    
    # Load database
    db = _load_interaction_db()
    
    # For each interaction record in DB
    for record in db:
        db_drug1 = _normalize_drug(record.get("drug1", ""))
        db_drug2 = _normalize_drug(record.get("drug2", ""))
        
        # Skip if normalization failed
        if not db_drug1 or not db_drug2:
            continue
        
        # Check if both drugs are in normalized_meds (bidirectional)
        match_found = False
        if db_drug1 in normalized_meds and db_drug2 in normalized_meds:
            match_found = True
        elif db_drug2 in normalized_meds and db_drug1 in normalized_meds:
            match_found = True
        
        if match_found:
            # Create canonical pair key for deduplication
            pair_key = tuple(sorted([db_drug1, db_drug2]))
            if pair_key not in seen_pairs:
                seen_pairs.add(pair_key)
                interactions.append({
                    "drug1": record.get("drug1", db_drug1),
                    "drug2": record.get("drug2", db_drug2),
                    "severity": record.get("severity", "LOW"),
                    "effect": record.get("effect", "Unknown interaction"),
                    "recommendation": record.get("recommendation", "Consult doctor"),
                    "mechanism": record.get("mechanism", "Unknown mechanism")
                })
    
    # Family-level matching: medications in same family
    for family_name, family_drugs in ALLERGY_FAMILIES.items():
        drugs_in_family = [
            med for med in original_meds
            if _normalize_drug(med) in family_drugs
        ]
        
        # If 2+ drugs from same family, add warning
        if len(drugs_in_family) >= 2:
            pair_key = tuple(sorted([family_name, family_name]))
            if pair_key not in seen_pairs:
                seen_pairs.add(pair_key)
                interactions.append({
                    "drug1": drugs_in_family[0],
                    "drug2": drugs_in_family[1] if len(drugs_in_family) > 1 else drugs_in_family[0],
                    "severity": "MODERATE",
                    "effect": f"Multiple {family_name}s prescribed simultaneously. Potential for drug accumulation or redundant therapy.",
                    "recommendation": f"Verify necessity of all {family_name} medications. Consider consolidating therapy.",
                    "mechanism": "Pharmacodynamic — potential additive effects"
                })
    
    return interactions


# ══════════════════════════════════════════════════════════════════════
# ALLERGY CONFLICT CHECKER
# ══════════════════════════════════════════════════════════════════════

def _find_allergy_conflicts(
        normalized_meds: list,
        original_meds: list,
        normalized_allergies: list) -> list:
    """
    Check for allergy-drug family conflicts.
    Returns list of conflict dicts.
    """
    conflicts = []
    seen_conflicts = set()
    
    for orig_allergy in normalized_allergies:
        norm_allergy = _normalize_drug(orig_allergy)
        
        if not norm_allergy:
            continue
        
        for i, orig_med in enumerate(original_meds):
            norm_med = normalized_meds[i]
            
            if not norm_med:
                continue
            
            # Direct match
            if norm_med == norm_allergy:
                conflict_key = (norm_med, norm_allergy)
                if conflict_key not in seen_conflicts:
                    seen_conflicts.add(conflict_key)
                    conflicts.append({
                        "drug": orig_med,
                        "allergy": orig_allergy,
                        "severity": "HIGH",
                        "message": f"Direct allergy match: {orig_med} is contraindicated in patients allergic to {orig_allergy}",
                        "conflict_type": "direct_match"
                    })
                continue
            
            # Family match: check if allergy is a family
            if norm_allergy in ALLERGY_FAMILIES:
                if norm_med in ALLERGY_FAMILIES[norm_allergy]:
                    conflict_key = (norm_med, norm_allergy)
                    if conflict_key not in seen_conflicts:
                        seen_conflicts.add(conflict_key)
                        conflicts.append({
                            "drug": orig_med,
                            "allergy": orig_allergy,
                            "severity": "HIGH",
                            "message": f"{orig_med} belongs to {orig_allergy} family — cross-reactivity risk",
                            "conflict_type": "family_match"
                        })
            
            # Reverse family match: check if med is a family
            if norm_med in ALLERGY_FAMILIES:
                if norm_allergy in ALLERGY_FAMILIES[norm_med]:
                    conflict_key = (norm_med, norm_allergy)
                    if conflict_key not in seen_conflicts:
                        seen_conflicts.add(conflict_key)
                        conflicts.append({
                            "drug": orig_med,
                            "allergy": orig_allergy,
                            "severity": "HIGH",
                            "message": f"{orig_allergy} is in {orig_med} family — cross-reactivity risk",
                            "conflict_type": "family_match"
                        })
    
    return conflicts


# ══════════════════════════════════════════════════════════════════════
# SAFE COMBINATION REPORTER
# ══════════════════════════════════════════════════════════════════════

def _get_safe_combinations(
        original_meds: list,
        found_interactions: list) -> list:
    """
    Report which drug combinations appear to be safe.
    Returns list of safe combination strings.
    """
    safe_combos = []
    
    # Build set of drug pairs that have known interactions
    interaction_pairs = set()
    for interaction in found_interactions:
        d1 = interaction.get("drug1", "").lower().strip()
        d2 = interaction.get("drug2", "").lower().strip()
        if d1 and d2:
            interaction_pairs.add(tuple(sorted([d1, d2])))
    
    # Single medication
    if len(original_meds) <= 1:
        return ["Single medication — no pairwise interactions to check"]
    
    # Check all pairs
    pair_count = 0
    for i in range(len(original_meds)):
        for j in range(i + 1, len(original_meds)):
            med1 = original_meds[i].lower().strip()
            med2 = original_meds[j].lower().strip()
            
            pair_key = tuple(sorted([med1, med2]))
            if pair_key not in interaction_pairs:
                safe_combos.append(
                    f"{original_meds[i]} + {original_meds[j]}: no known interaction"
                )
                pair_count += 1
                
                # Limit output to 10 combinations
                if pair_count >= 10:
                    remaining = (len(original_meds) * (len(original_meds) - 1) // 2) - pair_count
                    if remaining > 0:
                        safe_combos.append(f"... and {remaining} more safe combinations")
                    return safe_combos
    
    if not safe_combos:
        safe_combos = ["All medication pairs have documented interactions — review carefully"]
    
    return safe_combos


# ══════════════════════════════════════════════════════════════════════
# MAIN CHECK FUNCTION
# ══════════════════════════════════════════════════════════════════════

def check(medications: List[str], allergies: List[str] = None) -> Dict[str, Any]:
    """
    Full drug interaction and allergy conflict check.
    
    Args:
        medications: list of drug name strings
        allergies: list of allergy strings
    
    Returns:
    {
      "interactions": [...],
      "allergy_conflicts": [...],
      "safe_combinations": [...],
      "overall_risk": "CRITICAL"|"HIGH"|"MODERATE"|"LOW"|"SAFE",
      "summary": {
        "total_medications": int,
        "interactions_found": int,
        "allergy_conflicts_found": int,
        "highest_severity": str,
        "requires_immediate_attention": bool
      }
    }
    """
    
    try:
        # Default allergies to empty list
        if allergies is None:
            allergies = []
        
        # Handle edge cases
        if not medications:
            return {
                "interactions": [],
                "allergy_conflicts": [],
                "safe_combinations": [],
                "overall_risk": "SAFE",
                "summary": {
                    "total_medications": 0,
                    "interactions_found": 0,
                    "allergy_conflicts_found": 0,
                    "highest_severity": "SAFE",
                    "requires_immediate_attention": False
                }
            }
        
        # Single medication — check allergies only
        if len(medications) == 1:
            normalized_meds = [_normalize_drug(med) for med in medications]
            normalized_allergies = [_normalize_drug(allergy) for allergy in allergies]
            
            allergy_conflicts = _find_allergy_conflicts(
                normalized_meds, medications, normalized_allergies
            )
            
            overall_risk = "SAFE"
            if allergy_conflicts:
                overall_risk = "HIGH"
            
            return {
                "interactions": [],
                "allergy_conflicts": allergy_conflicts,
                "safe_combinations": ["Single medication — no pairwise interactions"],
                "overall_risk": overall_risk,
                "summary": {
                    "total_medications": 1,
                    "interactions_found": 0,
                    "allergy_conflicts_found": len(allergy_conflicts),
                    "highest_severity": overall_risk,
                    "requires_immediate_attention": overall_risk in ["CRITICAL", "HIGH"]
                }
            }
        
        # Deduplicate medications (case-insensitive)
        unique_meds = []
        seen_norm = set()
        for med in medications:
            norm = _normalize_drug(med)
            if norm and norm not in seen_norm:
                unique_meds.append(med)
                seen_norm.add(norm)
        
        # Normalize all medication and allergy names
        normalized_meds = [_normalize_drug(med) for med in unique_meds]
        normalized_allergies = [_normalize_drug(allergy) for allergy in allergies]
        
        # Find drug-drug interactions
        interactions = _find_interactions(normalized_meds, unique_meds)
        
        # Find allergy conflicts
        allergy_conflicts = _find_allergy_conflicts(
            normalized_meds, unique_meds, normalized_allergies
        )
        
        # Get safe combinations
        safe_combos = _get_safe_combinations(unique_meds, interactions)
        
        # Compute overall_risk: max severity from interactions + allergy_conflicts
        max_rank = 0
        for interaction in interactions:
            rank = SEVERITY_RANK.get(interaction.get("severity", "LOW"), 0)
            max_rank = max(max_rank, rank)
        
        for conflict in allergy_conflicts:
            rank = SEVERITY_RANK.get(conflict.get("severity", "HIGH"), 0)
            max_rank = max(max_rank, rank)
        
        overall_risk = RANK_TO_SEVERITY.get(max_rank, "SAFE")
        
        # Sort by severity (descending)
        severity_order = {"CRITICAL": 4, "HIGH": 3, "MODERATE": 2, "LOW": 1}
        interactions.sort(
            key=lambda x: severity_order.get(x.get("severity", "LOW"), 0),
            reverse=True
        )
        allergy_conflicts.sort(
            key=lambda x: severity_order.get(x.get("severity", "HIGH"), 0),
            reverse=True
        )
        
        # Build summary
        summary = {
            "total_medications": len(unique_meds),
            "interactions_found": len(interactions),
            "allergy_conflicts_found": len(allergy_conflicts),
            "highest_severity": overall_risk,
            "requires_immediate_attention": overall_risk in ["CRITICAL", "HIGH"]
        }
        
        # Logging
        print(f"[ML] Drug check: {len(unique_meds)} medications, {len(allergies)} allergies")
        print(f"[ML] Found: {len(interactions)} interactions, {len(allergy_conflicts)} allergy conflicts")
        print(f"[ML] Overall risk: {overall_risk}")
        
        return {
            "interactions": interactions,
            "allergy_conflicts": allergy_conflicts,
            "safe_combinations": safe_combos,
            "overall_risk": overall_risk,
            "summary": summary
        }
    
    except Exception as e:
        print(f"[ML] Drug check error: {e}")
        return {
            "interactions": [],
            "allergy_conflicts": [],
            "safe_combinations": [],
            "overall_risk": "SAFE",
            "summary": {
                "total_medications": len(medications) if medications else 0,
                "interactions_found": 0,
                "allergy_conflicts_found": 0,
                "highest_severity": "SAFE",
                "requires_immediate_attention": False
            },
            "error": str(e)
        }


# ══════════════════════════════════════════════════════════════════════
# MODULE RELOAD FUNCTION (for testing)
# ══════════════════════════════════════════════════════════════════════

def reload_database():
    """
    Force reload the interaction database (clears cache).
    Call this if drug_interactions.json is updated at runtime.
    """
    global _db_cache
    _db_cache = None
    return _load_interaction_db()
