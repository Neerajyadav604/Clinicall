/**
 * FHIR Code System Lookup Tables
 * Provides common terminology codes for ICD-10, LOINC, SNOMED-CT
 */

const ICD10_COMMON = {
  'J00': 'Acute nasopharyngitis (common cold)',
  'J01': 'Acute sinusitis',
  'J02': 'Acute pharyngitis',
  'J03': 'Acute tonsillitis',
  'J04': 'Acute laryngitis and tracheitis',
  'J05': 'Acute obstructive laryngitis (croup) and epiglottitis',
  'J06': 'Acute upper respiratory infections of multiple and unspecified sites',
  'J20': 'Acute bronchitis',
  'J21': 'Acute bronchiolitis',
  'J22': 'Unspecified acute lower respiratory infection',
  'E11': 'Type 2 diabetes mellitus',
  'E10': 'Type 1 diabetes mellitus',
  'E13': 'Other specified diabetes mellitus',
  'I10': 'Essential (primary) hypertension',
  'I11': 'Hypertensive heart disease',
  'I21': 'ST elevation (STEMI) and non-ST elevation (NSTEMI) myocardial infarction',
  'I22': 'Subsequent myocardial infarction',
  'I23': 'Certain current complications following ST elevation and non-ST elevation myocardial infarction',
  'I24': 'Ischemic cardiomyopathy',
  'I25': 'Chronic ischemic heart disease',
  'I50': 'Heart failure',
  'J41': 'Simple and mucopurulent chronic bronchitis',
  'J42': 'Unspecified chronic bronchitis',
  'J43': 'Emphysema',
  'J44': 'Chronic obstructive pulmonary disease',
  'J45': 'Asthma',
  'J47': 'Bronchiectasis',
  'K21': 'Gastro-esophageal reflux disease',
  'K25': 'Gastric ulcer',
  'K26': 'Duodenal ulcer',
  'K29': 'Gastritis and gastropathy',
  'K50': 'Crohn disease [Crohns disease]',
  'K51': 'Ulcerative colitis',
  'K55': 'Vascular disorders of intestine',
  'K57': 'Diverticular disease of intestines',
  'K59': 'Functional intestinal disorders',
  'K70': 'Alcoholic liver disease',
  'K71': 'Toxic liver disease',
  'K72': 'Hepatic failure, not elsewhere classified',
  'K73': 'Chronic hepatitis, not elsewhere classified',
  'K74': 'Fibrosis and cirrhosis of liver',
  'K75': 'Other inflammatory liver diseases',
  'K76': 'Other diseases of liver',
  'F32': 'Major depressive disorder, single episode',
  'F33': 'Major depressive disorder, recurrent',
  'F34': 'Persistent mood [affective] disorders',
  'F40': 'Phobic anxiety disorders',
  'F41': 'Anxiety disorders',
  'F42': 'Obsessive-compulsive disorder',
  'F43': 'Reaction to severe stress, and adjustment disorders',
  'F48': 'Other neurotic disorders',
  'M05': 'Seronegative rheumatoid arthritis',
  'M06': 'Other rheumatoid arthritis',
  'M15': 'Polyarthrosis',
  'M16': 'Primary osteoarthritis of hip',
  'M17': 'Primary osteoarthritis of knee',
  'M19': 'Primary osteoarthritis, unspecified type, other sites',
};

const LOINC_VITALS = {
  '8310-5': { display: 'Body temperature', unit: '°C' },
  '8867-4': { display: 'Heart rate', unit: 'bpm' },
  '8480-6': { display: 'Systolic blood pressure', unit: 'mmHg' },
  '8462-4': { display: 'Diastolic blood pressure', unit: 'mmHg' },
  '9279-1': { display: 'Respiratory rate', unit: 'breaths/min' },
  '2708-6': { display: 'Oxygen saturation', unit: '%' },
  '29463-7': { display: 'Body weight', unit: 'kg' },
  '3141-9': { display: 'Body weight measured', unit: 'kg' },
  '8306-3': { display: 'Body height', unit: 'cm' },
  '39156-5': { display: 'BMI (Body mass index)', unit: 'kg/m2' },
  '2160-0': { display: 'Creatinine [Mass/volume] in Serum or Plasma', unit: 'mg/dL' },
  '2345-7': { display: 'Glucose [Mass/volume] in Serum or Plasma', unit: 'mg/dL' },
  '3094-0': { display: 'Urea nitrogen [Mass/volume] in Serum or Plasma', unit: 'mg/dL' },
  '1975-2': { display: 'Bilirubin.total [Mass/volume] in Serum or Plasma', unit: 'mg/dL' },
  '1742-6': { display: 'Alanine aminotransferase (ALT) [Enzymatic activity/volume]', unit: 'IU/L' },
  '1920-8': { display: 'Aspartate aminotransferase (AST) [Enzymatic activity/volume]', unit: 'IU/L' },
  '1975-2': { display: 'Bilirubin.total [Mass/volume] in Serum or Plasma', unit: 'mg/dL' },
  '2157-6': { display: 'Creatinine clearance in 24 hour Urine and Serum', unit: 'mL/min' },
};

const SNOMED_PROCEDURES = {
  '39352004': 'Coronary artery bypass grafting',
  '80146002': 'Excision of appendix',
  '18735003': 'Hysterectomy',
  '232717009': 'Coronary angioplasty',
  '414676002': 'Type 2 diabetes mellitus screening',
  '429892002': 'Knee arthroplasty',
  '308652002': 'Intravariceal alcohol injection',
  '25298007': 'Intubation',
  '119749002': 'Transfusion of red blood cells',
  '65801008': 'Excision of lacrimal gland',
  '257867005': 'Transurethral resection of prostate',
  '59514001': 'Amputation',
  '87342007': 'Bunionectomy',
  '12629004': 'Cardiopulmonary resuscitation',
  '429487005': 'Urinary catheterization',
  '410630005': 'Measurement of blood pressure',
  '86198006': 'Endoscopy',
  '386209006': 'Current medications review',
  '268551003': 'Sigmoidoscopy',
  '310252000': 'Colonoscopy',
  '279046008': 'Fetal imaging',
  '418775008': 'Procedure to establish airway',
  '441267002': 'Wound care',
  '241868005': 'Cardiopulmonary exercise test',
  '36228006': 'Gastroenterology laboratory procedure',
  '4148002': 'Echocardiography',
  '37322005': 'Psychometry',
  '11411000146106': 'Telehealth consultation',
};

/**
 * Look up ICD-10 code and return display name
 * @param {string} code - ICD-10 code (e.g. "E11.9")
 * @returns {string|null} Display name or null if not found
 */
const lookupICD10 = (code) => {
  if (!code) return null;
  // Remove trailing characters like .9 for broader search
  const baseCode = code.split('.')[0];
  return ICD10_COMMON[baseCode] || null;
};

/**
 * Look up LOINC code and return display name and unit
 * @param {string} code - LOINC code (e.g. "8310-5")
 * @returns {Object|null} Object with display and unit, or null if not found
 */
const lookupLOINC = (code) => {
  if (!code) return null;
  return LOINC_VITALS[code] || null;
};

/**
 * Look up SNOMED-CT code and return display name
 * @param {string} code - SNOMED-CT code (e.g. "39352004")
 * @returns {string|null} Display name or null if not found
 */
const lookupSNOMED = (code) => {
  if (!code) return null;
  return SNOMED_PROCEDURES[code] || null;
};

/**
 * Search code system for matching codes
 * @param {string} system - Code system (icd10, loinc, snomed)
 * @param {string} query - Search term (case-insensitive)
 * @returns {Array} Array of matching codes with display names
 */
const searchCodeSystem = (system, query) => {
  if (!query || query.length === 0) return [];
  
  const searchTerm = query.toLowerCase();
  let results = [];

  if (system === 'icd10' || system === 'http://hl7.org/fhir/sid/icd-10-cm') {
    Object.entries(ICD10_COMMON).forEach(([code, display]) => {
      if (code.toLowerCase().includes(searchTerm) || display.toLowerCase().includes(searchTerm)) {
        results.push({
          code,
          display,
          system: 'http://hl7.org/fhir/sid/icd-10-cm'
        });
      }
    });
  } else if (system === 'loinc' || system === 'http://loinc.org') {
    Object.entries(LOINC_VITALS).forEach(([code, data]) => {
      if (code.toLowerCase().includes(searchTerm) || data.display.toLowerCase().includes(searchTerm)) {
        results.push({
          code,
          display: data.display,
          unit: data.unit,
          system: 'http://loinc.org'
        });
      }
    });
  } else if (system === 'snomed' || system === 'http://snomed.info/sct') {
    Object.entries(SNOMED_PROCEDURES).forEach(([code, display]) => {
      if (code.toLowerCase().includes(searchTerm) || display.toLowerCase().includes(searchTerm)) {
        results.push({
          code,
          display,
          system: 'http://snomed.info/sct'
        });
      }
    });
  }

  return results.slice(0, 20); // Limit to 20 results
};

module.exports = {
  ICD10_COMMON,
  LOINC_VITALS,
  SNOMED_PROCEDURES,
  lookupICD10,
  lookupLOINC,
  lookupSNOMED,
  searchCodeSystem
};
