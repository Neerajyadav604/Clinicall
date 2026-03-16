# FHIR Medication & Clinical Data Rendering Audit

**Date:** March 15, 2026  
**Purpose:** Search for direct rendering of FHIR objects in medication and clinical components

---

## 🔴 CRITICAL ISSUES FOUND

### Issue 1: AllergyWarningBanner.jsx (Line 80) - Objects Rendered Directly

**File:** [frontend/src/components/clinical/AllergyWarningBanner.jsx](frontend/src/components/clinical/AllergyWarningBanner.jsx#L80)

**Problem Code:**
```jsx
{allergy.reaction && allergy.reaction.length > 0 && (
  <p className="text-xs text-red-700 mt-1">
    Reactions: {allergy.reaction.map(r => r.manifestation).flat().join(', ')}
  </p>
)}
```

**Line:** 80

**Issue:** 
- `r.manifestation` is a FHIR CodeableConcept object: `{ coding: [...], text: "..." }`
- `.map(r => r.manifestation)` extracts raw objects
- `.flat()` doesn't convert objects to strings
- `.join(', ')` renders objects as `[object Object]`
- **Result:** Browser error "Objects are not valid as a React child" OR display shows "[object Object]"

**Data Flow:**
1. Backend returns: `allergy.reaction[0].manifestation = { text: "Urticaria", coding: [...] }`
2. Frontend extracts: `r.manifestation` (object, not string)
3. React tries to render object → **FAILS**

---

## ✅ CORRECT IMPLEMENTATIONS (For Reference)

### MyProfile.js (Lines 898-914) - CORRECT Pattern

**File:** [frontend/src/pages/MyProfile.js](frontend/src/pages/MyProfile.js#L898-L914)

**Correct Code:**
```jsx
{allergy.reaction
  .map((r) => {
    // r.manifestation is a CodeableConcept: { coding: [...], text: "..." }
    const manifestation = r.manifestation;
    return getFhirDisplay(manifestation);  // ✅ Extract display value
  })
  .filter(Boolean)  // Remove empty strings
  .join(", ")}
```

**Why This Works:**
- Uses `getFhirDisplay()` helper function
- Extracts the `.text` or `.display` property from CodeableConcept
- Returns a string, not an object
- Returns fallback value if no display available

---

### MedicationList.jsx (Lines 1-30) - CORRECT Pattern

**File:** [frontend/src/components/clinical/MedicationList.jsx](frontend/src/components/clinical/MedicationList.jsx#L1-L30)

**Correct Implementation:**
```jsx
const getFhirDisplay = (field, fallback = '—') => {
  if (!field) return fallback;
  if (typeof field === 'string') return field;
  if (typeof field === 'number') return String(field);
  if (field.text) return field.text;                    // ✅ Extract text
  if (field.display) return field.display;              // ✅ Extract display
  if (field.coding?.[0]?.display) return field.coding[0].display;  // ✅ Extract from coding array
  if (field.reference) return field.reference;
  if (Array.isArray(field)) return field[0]?.text || fallback;
  return fallback;
};

const getMedicationName = (med) => {
  return (
    getFhirDisplay(med.medication_ref?.display, '') ||
    getFhirDisplay(med.medication, '') ||
    getFhirDisplay(med.medicationCodeableConcept, '') ||  // ✅ Properly extracted
    'Unknown Medication'
  );
};
```

**Protected Fields Being Rendered:**
- **Line 28:** `med.medicationCodeableConcept` → Properly extracted via `getFhirDisplay()`
- **Line 34-36:** `med.dosageInstruction` → Array access, not direct object rendering
- **Line 175-177:** `med.note` array → Properly checks if string, extracts `.text` if object

---

## 🔍 MEDICATION DATA RENDERING LOCATIONS

### Component: MedicationList.jsx
**File:** [frontend/src/components/clinical/MedicationList.jsx](frontend/src/components/clinical/MedicationList.jsx)

**Data Rendered:**
- **Line 28:** `medication_ref.display` → ✅ Safe (already a string)
- **Line 28:** `medicationCodeableConcept` → ✅ Safe (uses `getFhirDisplay()`)
- **Line 36:** `dosageInstruction[0]` → ✅ Safe (accessing properties, not rendering object)
- **Line 43-47:** `dosage.dose.value`, `dosage.dose.unit` → ✅ Safe (primitive values)
- **Line 51-52:** `dosage.frequency.value`, `dosage.timing.repeat.frequency` → ✅ Safe (primitive values)
- **Line 148:** `med.authoredOn` → ✅ Safe (date string)
- **Line 175-177:** `med.note` → ✅ Safe (checks typeof and extracts `.text`)
- **Line 195:** `med.doctor_ref.fullName` → ✅ Safe (string)

**Status:** ✅ **SAFE** - Properly uses `getFhirDisplay()` helper for complex objects

---

### Component: AllergyWarningBanner.jsx
**File:** [frontend/src/components/clinical/AllergyWarningBanner.jsx](frontend/src/components/clinical/AllergyWarningBanner.jsx)

**Data Rendered:**
- **Line 76:** `allergy.substance?.display` → ✅ Safe (accessing string property with fallback)
- **Line 80:** `allergy.reaction.map(r => r.manifestation)` → 🔴 **UNSAFE** (rendering CodeableConcept objects directly)
- **Line 91:** `allergy.criticality` → ✅ Safe (string status)

**Status:** 🔴 **UNSAFE** - Line 80 needs fix

---

### Page: MedicalRecords.js
**File:** [frontend/src/pages/MedicalRecords.js](frontend/src/pages/MedicalRecords.js)

**Usage:**
- **Line 441-442:** Passes `medications` array to `MedicationList` component
- Component handles extraction safely

**Status:** ✅ **SAFE** - Delegates rendering to MedicationList

---

### Page: MyProfile.js
**File:** [frontend/src/pages/MyProfile.js](frontend/src/pages/MyProfile.js)

**Data Rendered:**
- **Line 833:** `cond.code` → ✅ Safe (uses `getFhirDisplay()`)
- **Line 842:** `cond.severity` → ✅ Safe (uses `getFhirDisplay()`)
- **Line 875:** `allergy.substance` → ✅ Safe (uses `getFhirDisplay()`)
- **Line 879:** `allergy.type`, `allergy.category` → ✅ Safe (uses `getFhirDisplay()`)
- **Line 890:** `allergy.criticality` → ✅ Safe (checks typeof + `getFhirDisplay()`)
- **Line 901-902:** `r.manifestation` → ✅ Safe (uses `getFhirDisplay()`)

**Status:** ✅ **SAFE** - All objects properly extracted with `getFhirDisplay()`

---

### Component: MedicalTimeline.jsx
**File:** [frontend/src/components/clinical/MedicalTimeline.jsx](frontend/src/components/clinical/MedicalTimeline.jsx)

**Data Rendered:**
- **Line 46:** `c.code?.display` → ✅ Safe (accessing display property)
- **Line 47:** `c.clinicalStatus` → ✅ Safe (string)
- **Line 48:** `c.severity` → ✅ Safe (string/simple value)
- **Line 50:** `o.code?.display` → ✅ Safe (accessing display property)
- **Line 51:** `o.value?.quantity?.value` → ✅ Safe (primitive value)
- **Line 61:** `p.bodySite` → ✅ Safe (string/simple)
- **Line 68:** `i.vaccineDisplay` → ✅ Safe (already a display string)

**Status:** ✅ **SAFE** - Uses optional chaining and accesses display properties

---

### Component: VitalSignsChart.jsx
**File:** [frontend/src/components/clinical/VitalSignsChart.jsx](frontend/src/components/clinical/VitalSignsChart.jsx)

**Data Rendered:**
- **Line 189:** `obs.value?.quantity?.value` → ✅ Safe (accessing primitive value)
- **Line 189:** `vital.unit` → ✅ Safe (string)

**Status:** ✅ **SAFE** - Only accesses primitive values

---

### Component: LabResultsViewer.jsx
**File:** [frontend/src/components/clinical/LabResultsViewer.jsx](frontend/src/components/clinical/LabResultsViewer.jsx)

**Code Inspection:**
- Safe rendering pattern for documents
- Accesses primitive properties only

**Status:** ✅ **SAFE**

---

## 📊 Summary Table

| Component | File | Issue | Severity |
|-----------|------|-------|----------|
| AllergyWarningBanner | `clinical/AllergyWarningBanner.jsx:80` | Direct object rendering `.manifestation` | 🔴 CRITICAL |
| MedicationList | `clinical/MedicationList.jsx` | None detected | ✅ SAFE |
| MedicalTimeline | `clinical/MedicalTimeline.jsx` | None detected | ✅ SAFE |
| VitalSignsChart | `clinical/VitalSignsChart.jsx` | None detected | ✅ SAFE |
| LabResultsViewer | `clinical/LabResultsViewer.jsx` | None detected | ✅ SAFE |
| MedicalRecords | `pages/MedicalRecords.js` | None (delegates to components) | ✅ SAFE |
| MyProfile | `pages/MyProfile.js` | None detected | ✅ SAFE |

---

## 🛠️ FHIR Object Structures Reference

### CodeableConcept (Medication/Reaction/etc)
```javascript
{
  text: "Amoxicillin",              // Human-readable display
  coding: [
    {
      system: "http://snomed.info/sct",
      code: "27355003",
      display: "Amoxicillin"        // ← Use this
    }
  ]
}
```

### Dosage Instruction
```javascript
{
  dose: {
    value: 500,
    unit: "mg"
  },
  frequency: {
    value: 2,
    unit: "per day"
  },
  route: { text: "Oral" },
  timing: {
    repeat: {
      frequency: 2,
      periodUnit: "d"
    }
  }
}
```

### Allergy Reaction
```javascript
{
  manifestation: {                   // ← This is a CodeableConcept
    text: "Urticaria",
    coding: [...]
  },
  onset: "2024-01-15"
}
```

---

## ✅ Fix Required

**File to Fix:** [frontend/src/components/clinical/AllergyWarningBanner.jsx](frontend/src/components/clinical/AllergyWarningBanner.jsx#L78-L82)

**Current (Broken):**
```jsx
{allergy.reaction && allergy.reaction.length > 0 && (
  <p className="text-xs text-red-700 mt-1">
    Reactions: {allergy.reaction.map(r => r.manifestation).flat().join(', ')}
  </p>
)}
```

**Required Fix:**
```jsx
{allergy.reaction && allergy.reaction.length > 0 && (
  <p className="text-xs text-red-700 mt-1">
    Reactions: {allergy.reaction
      .map(r => r.manifestation)
      .map(manifestation => {
        // Extract display value from CodeableConcept
        if (typeof manifestation === 'string') return manifestation;
        if (manifestation?.text) return manifestation.text;
        if (manifestation?.display) return manifestation.display;
        if (manifestation?.coding?.[0]?.display) return manifestation.coding[0].display;
        return 'Unknown';
      })
      .filter(Boolean)
      .join(', ')}
  </p>
)}
```

---

## 📝 Notes

1. **MyProfile.js is the reference:** Contains all the proper patterns for handling FHIR object extraction
2. **MedicationList.jsx is well-implemented:** Color-coded patterns for extracting display from CodeableConcepts
3. **AllergyWarningBanner.jsx needs immediate fix:** Copy pattern from MyProfile.js line 898-914
4. **No medication rendering issues found:** MedicationList component properly handles all medication fields
5. **Other clinical components are safe:** Timeline, vitals, labs all use proper extraction patterns

---

**End of Audit Report**
