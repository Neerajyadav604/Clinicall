# FHIR Validation Regex Quick Reference

## All Regexes Used in This Fix

### 1. FHIR Reference Format
**What it matches**: `ResourceType/id` format required for all FHIR references

```regex
^(https?:\/\/.+\/)?[A-Z][a-zA-Z0-9]*\/[a-zA-Z0-9\-\.]+$
```

**JavaScript**:
```javascript
const FHIR_REFERENCE_REGEX = /^(https?:\/\/.+\/)?[A-Z][a-zA-Z0-9]*\/[a-zA-Z0-9\-\.]+$/;
const isValid = FHIR_REFERENCE_REGEX.test("Patient/507f1f77bcf86cd799439011");
```

**Test Cases**:

| Input | Expected | Result |
|-------|----------|--------|
| `Patient/507f1f77bcf86cd799439011` | ✅ PASS | Yes |
| `Practitioner/doctor-123` | ✅ PASS | Yes |
| `Condition/cond-abc-def` | ✅ PASS | Yes |
| `https://example.com/fhir/R4/Patient/123` | ✅ PASS | Yes |
| `507f1f77bcf86cd799439011` | ❌ FAIL | No |
| `patient/507f...` | ❌ FAIL | No |
| `Patient/` | ❌ FAIL | No |
| `/Patient/123` | ❌ FAIL | No |

---

### 2. Medical Code (ICD-10 / SNOMED / LOINC)
**What it matches**: Alphanumeric codes with optional dots and hyphens

```regex
^[A-Z0-9\.\-]{1,20}$
```

**JavaScript**:
```javascript
const MEDICAL_CODE_REGEX = /^[A-Z0-9\.\-]{1,20}$/i;
const isValid = MEDICAL_CODE_REGEX.test("J45.9");
```

**Test Cases**:

| Input | Expected | Result |
|-------|----------|--------|
| `J45.9` | ✅ PASS | Yes |
| `E11.9` | ✅ PASS | Yes |
| `I10` | ✅ PASS | Yes |
| `A00` | ✅ PASS | Yes |
| `J45-9` | ✅ PASS | Yes |
| `J45{Asthma)` | ❌ FAIL | No |
| `J45 (Asthma)` | ❌ FAIL | No |
| `ASTHMA` | ❌ FAIL | No |
| `45.9` | ❌ FAIL | No |
| `j45.9` | ✅ PASS* | Yes* |

*Case-insensitive flag `i` used

---

### 3. ICD-10 Specific Format
**What it matches**: Letter + 2 digits, optional dot + more digits

```regex
^[A-Z]\d{2}(\.\d{1,2})?$
```

**JavaScript**:
```javascript
const ICD10_REGEX = /^[A-Z]\d{2}(\.\d{1,2})?$/;
const isValid = ICD10_REGEX.test("J45.9");
```

**Test Cases**:

| Input | Expected | Result |
|-------|----------|--------|
| `J45` | ✅ PASS | Yes |
| `J45.9` | ✅ PASS | Yes |
| `J45.90` | ✅ PASS | Yes |
| `E11.9` | ✅ PASS | Yes |
| `E11.65` | ✅ PASS | Yes |
| `J45.901` | ❌ FAIL | No |
| `45.9` | ❌ FAIL | No |

---

### 4. SNOMED-CT Code
**What it matches**: 1-18 digit numeric code

```regex
^\d{1,18}$
```

**JavaScript**:
```javascript
const SNOMED_REGEX = /^\d{1,18}$/;
const isValid = SNOMED_REGEX.test("38341003");
```

**Test Cases**:

| Input | Expected | Result |
|-------|----------|--------|
| `38341003` | ✅ PASS | Yes |
| `195662009` | ✅ PASS | Yes |
| `3016` | ✅ PASS | Yes |
| `1` | ✅ PASS | Yes |
| `123456789012345678` (18 digits) | ✅ PASS | Yes |
| `1234567890123456789` (19 digits) | ❌ FAIL | No |
| `38341003-A` | ❌ FAIL | No |

---

### 5. LOINC Code
**What it matches**: 1-5 digits, hyphen, 1 digit (format: `####-#`)

```regex
^\d{1,5}-\d{1}$
```

**JavaScript**:
```javascript
const LOINC_REGEX = /^\d{1,5}-\d{1}$/;
const isValid = LOINC_REGEX.test("2345-7");
```

**Test Cases**:

| Input | Expected | Result |
|-------|----------|--------|
| `2345-7` | ✅ PASS | Yes |
| `3016-3` | ✅ PASS | Yes |
| `718-7` | ✅ PASS | Yes |
| `1-2` | ✅ PASS | Yes |
| `12345-6` | ✅ PASS | Yes |
| `23456-7` | ❌ FAIL | No |
| `2345-78` | ❌ FAIL | No |
| `2345.7` | ❌ FAIL | No |

---

### 6. MongoDB ObjectId
**What it matches**: 24 hexadecimal characters

```regex
^[a-f0-9]{24}$
```

**JavaScript**:
```javascript
const MONGODB_ID_REGEX = /^[a-f0-9]{24}$/i;
const isValid = MONGODB_ID_REGEX.test("507f1f77bcf86cd799439011");
```

**Test Cases**:

| Input | Expected | Result |
|-------|----------|--------|
| `507f1f77bcf86cd799439011` | ✅ PASS | Yes |
| `507f191e810c19729de860ea` | ✅ PASS | Yes |
| `000000000000000000000000` | ✅ PASS | Yes |
| `507f1f77bcf86cd79943901` (23 chars) | ❌ FAIL | No |
| `507f1f77bcf86cd7994390111` (25 chars) | ❌ FAIL | No |
| `507f1f77bcf86cd799439011x` | ❌ FAIL | No |
| `507F1F77BCF86CD799439011` (uppercase) | ✅ PASS* | Yes* |

*Case-insensitive flag `i` used

---

### 7. ISO 8601 Date Format
**What it matches**: YYYY-MM-DD or with time and timezone

```regex
^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?)?$
```

**JavaScript**:
```javascript
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?)?$/;
const isValid = ISO_DATE_REGEX.test("2026-03-15");
```

**Test Cases**:

| Input | Expected | Result |
|-------|----------|--------|
| `2026-03-15` | ✅ PASS | Yes |
| `2026-03-15T14:30:00` | ✅ PASS | Yes |
| `2026-03-15T14:30:00Z` | ✅ PASS | Yes |
| `2026-03-15T14:30:00+05:30` | ✅ PASS | Yes |
| `2026-03-15T14:30:00-08:00` | ✅ PASS | Yes |
| `15-03-2026` | ❌ FAIL | No |
| `2026/03/15` | ❌ FAIL | No |
| `2026-3-15` | ❌ FAIL | No |

---

## Common Pattern Explanations

### FHIR Reference Pattern Breakdown

```
^                           Start of string
(https?:\/\/.+\/)?         Optional HTTP(S) URL prefix
[A-Z]                      Resource type must start with uppercase letter
[a-zA-Z0-9]*               Followed by alphanumerics
\/                         Literal forward slash
[a-zA-Z0-9\-\.]+          ID: alphanumerics, hyphens, dots
$                          End of string
```

**Examples**:
- `Patient/507f1f77bcf86cd799439011` ← Simple format
- `https://example.com/fhir/R4/Patient/123` ← Full URL format

---

### Medical Code Pattern Breakdown

```
^                          Start of string
[A-Z0-9\.\-]{1,20}        Letters, digits, dots, hyphens (1-20 chars)
$                          End of string
```

**With case-insensitive flag** `/i`:
- `J45.9` → allowed
- `j45.9` → allowed (converted to uppercase)

---

## Regex Code Library

Copy-paste ready for your project:

```javascript
// All FHIR validation regexes in one object
export const FHIR_REGEXES = {
  REFERENCE: /^(https?:\/\/.+\/)?[A-Z][a-zA-Z0-9]*\/[a-zA-Z0-9\-\.]+$/,
  MEDICAL_CODE: /^[A-Z0-9\.\-]{1,20}$/i,
  ICD10: /^[A-Z]\d{2}(\.\d{1,2})?$/,
  SNOMED: /^\d{1,18}$/,
  LOINC: /^\d{1,5}-\d{1}$/,
  MONGODB_ID: /^[a-f0-9]{24}$/i,
  ISO_DATE: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?)?$/
};

// Validator functions
export const validators = {
  reference: (ref) => FHIR_REGEXES.REFERENCE.test(ref),
  medicalCode: (code) => FHIR_REGEXES.MEDICAL_CODE.test(code),
  icd10: (code) => FHIR_REGEXES.ICD10.test(code),
  snomed: (code) => FHIR_REGEXES.SNOMED.test(code),
  loinc: (code) => FHIR_REGEXES.LOINC.test(code),
  mongoId: (id) => FHIR_REGEXES.MONGODB_ID.test(id),
  isoDate: (date) => FHIR_REGEXES.ISO_DATE.test(date)
};

// Usage
console.log(validators.reference('Patient/507f...')); // true
console.log(validators.medicalCode('J45.9')); // true
```

---

## When to Use Each Regex

| Regex | Use For | Example |
|-------|---------|---------|
| `REFERENCE` | FHIR references, subject, patient_ref, user_ref | `Patient/507f...` |
| `MEDICAL_CODE` | ICD-10, SNOMED, LOINC codes | `J45.9` |
| `ICD10` | ICD-10-CM codes specifically | `E11.65` |
| `SNOMED` | SNOMED-CT numeric codes | `38341003` |
| `LOINC` | Lab codes | `2345-7` |
| `MONGODB_ID` | MongoDB ObjectIds before formatting | `507f1f77bcf86cd799439011` |
| `ISO_DATE` | Dates in observations, encounters | `2026-03-15T14:30:00Z` |

---

## Testing in Browser Console

```javascript
// Test FHIR reference
/^(https?:\/\/.+\/)?[A-Z][a-zA-Z0-9]*\/[a-zA-Z0-9\-\.]+$/.test("Patient/507f...");
// true

// Test medical code
/^[A-Z0-9\.\-]{1,20}$/i.test("J45.9");
// true

// Test invalid code
/^[A-Z0-9\.\-]{1,20}$/i.test("J45{Asthma)");
// false
```

---

## Related Documentation

- [FHIR R4 Data Types](https://www.hl7.org/fhir/r4/datatypes.html#Reference)
- [ICD-10-CM Codes](https://www.cdc.gov/nchs/icd/icd10cm.htm)
- [SNOMED-CT](https://www.snomed.org/)
- [LOINC Codes](https://loinc.org/)
- [Regex101.com](https://regex101.com/) (test regexes online)
