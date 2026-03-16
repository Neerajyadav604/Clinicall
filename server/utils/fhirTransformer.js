/**
 * FHIR R4 Transformer Utilities
 * Converts Clinicall DB models to FHIR R4 resources
 */

/**
 * Transform User + UserProfile to FHIR Patient resource
 * @param {Object} user - User document from MongoDB
 * @param {Object} userProfile - UserProfile document from MongoDB
 * @returns {Object} FHIR Patient resource
 */
const toFhirPatient = (user, userProfile) => {
  if (!user) return null;

  const patient = {
    resourceType: 'Patient',
    id: user._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
      lastUpdated: user.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/patient',
        value: user._id.toString()
      }
    ],
    name: [
      {
        use: 'official',
        text: user.fullName,
        family: user.fullName.split(' ').slice(-1)[0],
        given: user.fullName.split(' ').slice(0, -1)
      }
    ],
    telecom: [
      {
        system: 'email',
        value: user.email,
        use: 'home'
      },
      {
        system: 'phone',
        value: user.contact,
        use: 'mobile'
      }
    ]
  };

  // Add profile picture if available
  if (user.image) {
    patient.photo = [
      {
        url: user.image,
        title: 'Profile Picture'
      }
    ];
  }

  // Add demographics from UserProfile
  if (userProfile) {
    if (userProfile.dob) {
      patient.birthDate = userProfile.dob.toISOString().split('T')[0];
    }

    if (userProfile.gender) {
      patient.gender = userProfile.gender.toLowerCase();
    }

    if (userProfile.address) {
      patient.address = [
        {
          use: 'home',
          text: userProfile.address,
          type: 'physical'
        }
      ];
    }

    // Contact information
    if (userProfile.emergencyContact) {
      patient.contact = [
        {
          relationship: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                  code: 'N',
                  display: 'Emergency Contact'
                }
              ]
            }
          ],
          telecom: [
            {
              system: 'phone',
              value: userProfile.emergencyContact
            }
          ]
        }
      ];
    }
  }

  return patient;
};

/**
 * Transform Doctor + DoctorProfile to FHIR Practitioner resource
 * @param {Object} doctor - Doctor document from MongoDB
 * @param {Object} doctorProfile - DoctorProfile document from MongoDB
 * @returns {Object} FHIR Practitioner resource
 */
const toFhirPractitioner = (doctor, doctorProfile) => {
  if (!doctor) return null;

  const practitioner = {
    resourceType: 'Practitioner',
    id: doctor._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Practitioner'],
      lastUpdated: doctor.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/practitioner',
        value: doctor._id.toString()
      }
    ],
    name: [
      {
        use: 'official',
        text: doctor.fullName,
        family: doctor.fullName.split(' ').slice(-1)[0],
        given: doctor.fullName.split(' ').slice(0, -1)
      }
    ],
    telecom: [
      {
        system: 'email',
        value: doctor.email,
        use: 'work'
      },
      {
        system: 'phone',
        value: doctor.contact,
        use: 'work'
      }
    ]
  };

  // Medical specialization and qualification
  if (doctor.specialization || doctor.qualification) {
    practitioner.qualification = [
      {
        identifier: doctor.licenseNumber ? [
          {
            system: 'http://clinicall.local/license',
            value: doctor.licenseNumber
          }
        ] : [],
        code: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
              code: 'MD',
              display: doctor.specialization || 'Medical Doctor'
            }
          ],
          text: doctor.specialization
        },
        issuer: {
          display: 'Medical Council'
        },
        period: {
          start: doctor.submittedAt ? doctor.submittedAt.toISOString().split('T')[0] : undefined
        }
      }
    ];
  }

  // Doctor photo if available
  if (doctor.image) {
    practitioner.photo = [
      {
        url: doctor.image
      }
    ];
  }

  return practitioner;
};

/**
 * Transform Hospital to FHIR Organization resource
 * @param {Object} hospital - Hospital document from MongoDB
 * @returns {Object} FHIR Organization resource
 */
const toFhirOrganization = (hospital) => {
  if (!hospital) return null;

  const organization = {
    resourceType: 'Organization',
    id: hospital._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Organization'],
      lastUpdated: hospital.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/organization',
        value: hospital._id.toString()
      }
    ],
    name: hospital.name,
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/organization-type',
            code: hospital.entityType || 'prov',
            display: hospital.entityType || 'Healthcare Provider'
          }
        ]
      }
    ],
    telecom: [
      {
        system: 'email',
        value: hospital.email
      },
      {
        system: 'phone',
        value: hospital.phone
      }
    ],
    address: hospital.address ? [
      {
        type: 'physical',
        use: 'work',
        text: `${hospital.address.street}, ${hospital.address.city}, ${hospital.address.state} ${hospital.address.pincode}`,
        line: [hospital.address.street],
        city: hospital.address.city,
        state: hospital.address.state,
        postalCode: hospital.address.pincode,
        country: hospital.address.country || 'India'
      }
    ] : [],
    website: hospital.website || undefined
  };

  // Add logo if available
  if (hospital.logo) {
    organization.logo = [
      {
        url: hospital.logo
      }
    ];
  }

  // Specialty services
  if (hospital.specializations && hospital.specializations.length > 0) {
    organization.specialty = hospital.specializations.map(spec => ({
      coding: [
        {
          system: 'http://snomed.info/sct',
          display: spec
        }
      ]
    }));
  }

  return organization;
};

/**
 * Transform Appointment to FHIR Encounter resource
 * @param {Object} appointment - Appointment document from MongoDB
 * @param {Object} user - User document (patient)
 * @param {Object} doctor - Doctor document (practitioner)
 * @returns {Object} FHIR Encounter resource
 */
const toFhirEncounter = (appointment, user, doctor) => {
  if (!appointment) return null;

  const encounter = {
    resourceType: 'Encounter',
    id: appointment._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Encounter'],
      lastUpdated: appointment.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/encounter',
        value: appointment._id.toString()
      }
    ],
    status: mapAppointmentStatus(appointment.status),
    statusHistory: [
      {
        status: mapAppointmentStatus(appointment.status),
        period: {
          start: appointment.createdAt.toISOString()
        }
      }
    ],
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: appointment.consultationMode === 'online' ? 'VR' : 'IMP',
      display: appointment.consultationMode === 'online' ? 'virtual' : 'inpatient'
    },
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'PTSF',
            display: 'Patient Support'
          }
        ],
        text: 'Medical Consultation'
      }
    ],
    subject: {
      reference: `Patient/${appointment.userId.toString()}`,
      display: user ? user.fullName : undefined
    },
    participant: [
      {
        individual: {
          reference: `Practitioner/${appointment.doctorId.toString()}`,
          display: doctor ? doctor.fullName : undefined
        },
        type: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                code: 'PPRF',
                display: 'Primary Performer'
              }
            ]
          }
        ]
      }
    ],
    period: {
      start: appointment.appointmentDate ? new Date(appointment.appointmentDate).toISOString() : undefined
    },
    reason: appointment.reason ? [
      {
        text: appointment.reason
      }
    ] : [],
    diagnosis: appointment.approvalstatus === 'APPROVED' ? [
      {
        condition: {
          text: 'Scheduled Consultation'
        },
        role: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/diagnosis-role',
              code: 'CC',
              display: 'Chief Complaint'
            }
          ]
        },
        rank: 1
      }
    ] : []
  };

  return encounter;
};

/**
 * Helper: Map Appointment status to FHIR Encounter status
 */
const mapAppointmentStatus = (appointmentStatus) => {
  const statusMap = {
    'SCHEDULED': 'arrived',
    'COMPLETED': 'finished',
    'NOT SCHEDULED': 'planned',
    'CANCELLED': 'cancelled'
  };
  return statusMap[appointmentStatus] || 'unknown';
};

/**
 * Transform Condition to FHIR Condition resource
 * @param {Object} condition - Condition document from MongoDB
 * @returns {Object} FHIR Condition resource
 */
const toFhirCondition = (condition) => {
  if (!condition) return null;

  return {
    resourceType: 'Condition',
    id: condition._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Condition'],
      lastUpdated: condition.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/condition',
        value: condition._id.toString()
      }
    ],
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: condition.clinicalStatus || 'active'
        }
      ]
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: condition.verificationStatus || 'confirmed'
        }
      ]
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'problem-list-item'
          }
        ]
      }
    ],
    severity: condition.severity ? {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: condition.severity,
          display: condition.severity
        }
      ]
    } : undefined,
    code: {
      coding: [
        {
          system: condition.code?.system || 'http://hl7.org/fhir/sid/icd-10-cm',
          code: condition.code?.coding || 'unknown'
        }
      ],
      text: condition.code?.display || 'Unknown Condition'
    },
    subject: {
      reference: `Patient/${condition.userId.toString()}`
    },
    onsetDate: condition.onsetDate?.toISOString().split('T')[0] || undefined,
    abatementDate: condition.abatementDate?.toISOString().split('T')[0] || undefined,
    recordedDate: condition.recordedDate?.toISOString() || new Date().toISOString(),
    note: condition.notes ? [{ text: condition.notes }] : []
  };
};

/**
 * Transform Observation to FHIR Observation resource
 * @param {Object} observation - Observation document from MongoDB
 * @returns {Object} FHIR Observation resource
 */
const toFhirObservation = (observation) => {
  if (!observation) return null;

  const obs = {
    resourceType: 'Observation',
    id: observation._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Observation'],
      lastUpdated: observation.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/observation',
        value: observation._id.toString()
      }
    ],
    status: observation.status || 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: observation.category || 'vital-signs'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: observation.code?.system || 'http://loinc.org',
          code: observation.code?.coding || 'unknown'
        }
      ],
      text: observation.code?.display || 'Unknown Observation'
    },
    subject: {
      reference: `Patient/${observation.userId.toString()}`
    },
    effectiveDateTime: observation.effectiveDate?.toISOString() || new Date().toISOString(),
    issued: observation.updatedAt?.toISOString() || new Date().toISOString()
  };

  // Add value
  if (observation.value) {
    if (observation.value.quantity) {
      obs.valueQuantity = {
        value: observation.value.quantity.value,
        system: 'http://unitsofmeasure.org',
        code: observation.value.quantity.code,
        unit: observation.value.quantity.unit
      };
    } else if (observation.value.codeableConcept) {
      obs.valueCodeableConcept = observation.value.codeableConcept;
    } else if (observation.value.string) {
      obs.valueString = observation.value.string;
    } else if (typeof observation.value.boolean === 'boolean') {
      obs.valueBoolean = observation.value.boolean;
    }
  }

  // Add reference range if available
  if (observation.referenceRange) {
    obs.referenceRange = [
      {
        low: observation.referenceRange.low ? { value: observation.referenceRange.low } : undefined,
        high: observation.referenceRange.high ? { value: observation.referenceRange.high } : undefined,
        text: observation.referenceRange.text
      }
    ];
  }

  // Add interpretation
  if (observation.interpretation) {
    obs.interpretation = [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: observation.interpretation
          }
        ]
      }
    ];
  }

  // Add note
  if (observation.notes) {
    obs.note = [{ text: observation.notes }];
  }

  return obs;
};

/**
 * Transform AllergyIntolerance to FHIR AllergyIntolerance resource
 * @param {Object} allergy - AllergyIntolerance document from MongoDB
 * @returns {Object} FHIR AllergyIntolerance resource
 */
const toFhirAllergyIntolerance = (allergy) => {
  if (!allergy) return null;

  return {
    resourceType: 'AllergyIntolerance',
    id: allergy._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/AllergyIntolerance'],
      lastUpdated: allergy.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/allergy',
        value: allergy._id.toString()
      }
    ],
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
          code: allergy.clinicalStatus || 'active'
        }
      ]
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
          code: allergy.verificationStatus || 'confirmed'
        }
      ]
    },
    type: allergy.type || 'allergy',
    category: [allergy.category || 'medication'],
    criticality: allergy.criticality || 'low',
    code: {
      coding: [
        {
          system: allergy.substance?.system || 'http://snomed.info/sct',
          code: allergy.substance?.code || 'unknown'
        }
      ],
      text: allergy.substance?.display || 'Unknown Substance'
    },
    patient: {
      reference: `Patient/${allergy.userId.toString()}`
    },
    recordedDate: allergy.recordedDate?.toISOString() || new Date().toISOString(),
    reaction: allergy.reaction ? allergy.reaction.map(r => ({
      substance: r.substance ? {
        coding: [
          {
            system: 'http://snomed.info/sct',
            display: r.substance
          }
        ]
      } : undefined,
      manifestation: r.manifestation ? r.manifestation.map(m => ({
        coding: [
          {
            system: 'http://snomed.info/sct',
            display: m
          }
        ]
      })) : [],
      severity: r.severity || 'mild',
      exposureRoute: r.exposureRoute ? {
        coding: [
          {
            system: 'http://snomed.info/sct',
            display: r.exposureRoute
          }
        ]
      } : undefined,
      note: r.notes ? [{ text: r.notes }] : []
    })) : []
  };
};

/**
 * Transform Medication to FHIR Medication resource
 * @param {Object} medication - Medication document from MongoDB
 * @returns {Object} FHIR Medication resource
 */
const toFhirMedication = (medication) => {
  if (!medication) return null;

  return {
    resourceType: 'Medication',
    id: medication._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Medication'],
      lastUpdated: medication.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/medication',
        value: medication._id.toString()
      }
    ],
    code: {
      coding: [
        {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: medication.code
        }
      ],
      text: medication.display
    },
    status: 'active',
    form: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          display: medication.form || 'tablet'
        }
      ]
    },
    amount: medication.strength ? {
      numerator: {
        value: parseInt(medication.strength.split(/[a-zA-Z]/)[0]) || 1,
        unit: medication.unit || 'mg',
        system: 'http://unitsofmeasure.org'
      }
    } : undefined,
    manufacturer: medication.manufacturer ? {
      display: medication.manufacturer
    } : undefined
  };
};

/**
 * Transform MedicationRequest to FHIR MedicationRequest resource
 * @param {Object} request - MedicationRequest document from MongoDB
 * @param {Object} medication - Medication document (populated ref)
 * @returns {Object} FHIR MedicationRequest resource
 */
const toFhirMedicationRequest = (request, medication) => {
  if (!request) return null;

  return {
    resourceType: 'MedicationRequest',
    id: request._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/MedicationRequest'],
      lastUpdated: request.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/medicationrequest',
        value: request._id.toString()
      }
    ],
    status: request.status || 'active',
    intent: request.intent || 'order',
    medicationReference: {
      reference: `Medication/${request.medication_ref.toString()}`,
      display: medication?.display || request.medication_ref?.display
    },
    subject: {
      reference: `Patient/${request.user_ref.toString()}`
    },
    authoredOn: request.authoredOn?.toISOString() || new Date().toISOString(),
    requester: {
      reference: `Practitioner/${request.doctor_ref.toString()}`,
      display: request.doctor_ref?.fullName
    },
    dosageInstruction: request.dosageInstruction ? [
      {
        text: request.dosageInstruction.text,
        timing: request.dosageInstruction.frequency ? {
          repeat: {
            frequency: request.dosageInstruction.frequency.value || 1,
            period: 1,
            periodUnit: request.dosageInstruction.frequency.unit?.charAt(0).toUpperCase() || 'd'
          }
        } : undefined,
        route: request.dosageInstruction.route ? {
          coding: [
            {
              system: 'http://snomed.info/sct',
              display: request.dosageInstruction.route
            }
          ]
        } : undefined,
        doseAndRate: request.dosageInstruction.dose ? [
          {
            doseQuantity: {
              value: request.dosageInstruction.dose.value,
              unit: request.dosageInstruction.dose.unit,
              system: 'http://unitsofmeasure.org'
            }
          }
        ] : []
      }
    ] : [],
    note: request.note ? [{ text: request.note }] : []
  };
};

/**
 * Transform DiagnosticReport to FHIR DiagnosticReport resource
 * @param {Object} report - DiagnosticReport document from MongoDB
 * @returns {Object} FHIR DiagnosticReport resource
 */
const toFhirDiagnosticReport = (report) => {
  if (!report) return null;

  return {
    resourceType: 'DiagnosticReport',
    id: report._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/DiagnosticReport'],
      lastUpdated: report.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/diagnosticreport',
        value: report._id.toString()
      }
    ],
    status: report.status || 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
            display: 'Laboratory'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: report.code
        }
      ],
      text: report.display
    },
    subject: {
      reference: `Patient/${report.user_ref.toString()}`
    },
    issued: report.issued?.toISOString() || new Date().toISOString(),
    performer: [
      {
        reference: `Practitioner/${report.doctor_ref.toString()}`
      }
    ],
    effectiveDateTime: report.effectiveDate?.toISOString() || new Date().toISOString(),
    result: report.result ? report.result.map(obsId => ({
      reference: `Observation/${obsId.toString()}`
    })) : [],
    conclusion: report.conclusion,
    presentedForm: report.attachment?.url ? [
      {
        contentType: report.attachment.contentType || 'application/pdf',
        url: report.attachment.url,
        title: report.attachment.title
      }
    ] : []
  };
};

/**
 * Transform Procedure to FHIR Procedure resource
 * @param {Object} procedure - Procedure document from MongoDB
 * @returns {Object} FHIR Procedure resource
 */
const toFhirProcedure = (procedure) => {
  if (!procedure) return null;

  return {
    resourceType: 'Procedure',
    id: procedure._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Procedure'],
      lastUpdated: procedure.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/procedure',
        value: procedure._id.toString()
      }
    ],
    status: procedure.status || 'completed',
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: procedure.code
        }
      ],
      text: procedure.display
    },
    subject: {
      reference: `Patient/${procedure.user_ref.toString()}`
    },
    performer: [
      {
        actor: {
          reference: `Practitioner/${procedure.doctor_ref.toString()}`
        }
      }
    ],
    performedDateTime: procedure.performedDate?.toISOString() || new Date().toISOString(),
    bodySite: procedure.bodySite ? [
      {
        coding: [
          {
            system: 'http://snomed.info/sct',
            display: procedure.bodySite
          }
        ]
      }
    ] : [],
    outcome: procedure.outcome ? {
      coding: [
        {
          system: 'http://snomed.info/sct',
          display: procedure.outcome
        }
      ]
    } : undefined,
    note: procedure.note ? [{ text: procedure.note }] : []
  };
};

/**
 * Transform Immunization to FHIR Immunization resource
 * @param {Object} immunization - Immunization document from MongoDB
 * @returns {Object} FHIR Immunization resource
 */
const toFhirImmunization = (immunization) => {
  if (!immunization) return null;

  return {
    resourceType: 'Immunization',
    id: immunization._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Immunization'],
      lastUpdated: immunization.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/immunization',
        value: immunization._id.toString()
      }
    ],
    status: immunization.status || 'completed',
    vaccineCode: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/cvx',
          code: immunization.vaccineCode
        }
      ],
      text: immunization.vaccineDisplay
    },
    patient: {
      reference: `Patient/${immunization.user_ref.toString()}`
    },
    occurrenceDateTime: immunization.occurrenceDate?.toISOString() || new Date().toISOString(),
    recorded: new Date().toISOString(),
    lotNumber: immunization.lotNumber,
    site: immunization.site ? {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActSite',
          code: immunization.site,
          display: immunization.site
        }
      ]
    } : undefined,
    route: immunization.route ? {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration',
          code: immunization.route,
          display: immunization.route
        }
      ]
    } : undefined,
    doseQuantity: immunization.doseQuantity ? {
      value: immunization.doseQuantity.value,
      unit: immunization.doseQuantity.unit,
      system: 'http://unitsofmeasure.org'
    } : undefined
  };
};

/**
 * Transform DocumentReference to FHIR DocumentReference resource
 * @param {Object} doc - DocumentReference document from MongoDB
 * @returns {Object} FHIR DocumentReference resource
 */
const toFhirDocumentReference = (doc) => {
  if (!doc) return null;

  return {
    resourceType: 'DocumentReference',
    id: doc._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/DocumentReference'],
      lastUpdated: doc.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/documentreference',
        value: doc._id.toString()
      }
    ],
    status: doc.status || 'current',
    docStatus: doc.docStatus || 'final',
    type: {
      coding: [
        {
          system: 'http://loinc.org',
          code: doc.type?.code || 'unknown'
        }
      ],
      text: doc.type?.display || 'Clinical Document'
    },
    subject: {
      reference: `Patient/${doc.user_ref.toString()}`
    },
    date: doc.date?.toISOString() || new Date().toISOString(),
    author: [
      {
        reference: `Practitioner/${doc.doctor_ref.toString()}`
      }
    ],
    description: doc.description,
    content: doc.content && doc.content.length > 0 ? doc.content.map(c => ({
      attachment: {
        contentType: c.attachment?.contentType || 'application/pdf',
        url: c.attachment?.url,
        title: c.attachment?.title,
        size: c.attachment?.size
      }
    })) : [],
    context: {
      encounter: doc.context?.encounter_ref ? [
        {
          reference: `Encounter/${doc.context.encounter_ref.toString()}`
        }
      ] : [],
      period: doc.context?.period ? {
        start: doc.context.period.start?.toISOString(),
        end: doc.context.period.end?.toISOString()
      } : undefined,
      practiceSetting: doc.context?.practiceSetting ? {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: doc.context.practiceSetting.code,
            display: doc.context.practiceSetting.display
          }
        ]
      } : undefined
    }
  };
};

/**
 * Transform Consent to FHIR Consent resource
 * @param {Object} consent - Consent document from MongoDB
 * @returns {Object} FHIR Consent resource
 */
const toFhirConsent = (consent) => {
  if (!consent) return null;

  return {
    resourceType: 'Consent',
    id: consent._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Consent'],
      lastUpdated: consent.updatedAt || new Date()
    },
    identifier: [
      {
        system: 'http://clinicall.local/consent',
        value: consent._id.toString()
      }
    ],
    status: mapConsentStatus(consent.status),
    scope: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/consentscope',
          code: 'patient-privacy',
          display: 'Privacy Consent'
        }
      ]
    },
    category: [
      {
        coding: [
          {
            system: 'http://loinc.org',
            code: '59284-0',
            display: 'Consent'
          }
        ]
      }
    ],
    patient: {
      reference: `Patient/${consent.patient_ref.toString()}`
    },
    dateTime: consent.createdAt?.toISOString(),
    performer: [
      {
        reference: consent.grantedToType === 'doctor'
          ? `Practitioner/${consent.grantedTo_ref.toString()}`
          : `Organization/${consent.grantedTo_ref.toString()}`
      }
    ],
    organization: [
      {
        reference: consent.grantedToType === 'hospital'
          ? `Organization/${consent.grantedTo_ref.toString()}`
          : 'Organization/clinicall'
      }
    ],
    sourceReference: {
      reference: `Consent/${consent._id.toString()}`
    },
    provision: {
      type: 'permit',
      period: {
        start: consent.period?.start?.toISOString(),
        end: consent.period?.end?.toISOString()
      },
      class: consent.resourceTypes ? consent.resourceTypes.map(rt => ({
        system: 'http://hl7.org/fhir/resource-types',
        code: rt,
        display: rt
      })) : [],
      purpose: consent.purpose ? [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
          code: mapPurposeToCode(consent.purpose),
          display: consent.purpose
        }
      ] : []
    }
  };
};

/**
 * Transform AuditEvent to FHIR AuditEvent resource
 * @param {Object} auditEvent - AuditEvent document from MongoDB
 * @returns {Object} FHIR AuditEvent resource
 */
const toFhirAuditEvent = (auditEvent) => {
  if (!auditEvent) return null;

  return {
    resourceType: 'AuditEvent',
    id: auditEvent._id.toString(),
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/AuditEvent'],
      lastUpdated: auditEvent.updatedAt || new Date()
    },
    type: auditEvent.type || {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'RESTful Operation'
    },
    subtype: auditEvent.subtype || [],
    action: auditEvent.action,
    recorded: auditEvent.recorded?.toISOString() || new Date().toISOString(),
    outcome: auditEvent.outcome || '0',
    outcomeDesc: auditEvent.outcomeDesc,
    agent: auditEvent.agent && auditEvent.agent.length > 0 ? auditEvent.agent.map(a => ({
      type: a.type || {
        system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
        code: 'person'
      },
      role: a.userRole ? [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationFunction',
              display: a.userRole
            }
          ]
        }
      ] : [],
      name: a.name,
      requestor: a.requestor !== false,
      media: a.media,
      network: a.network ? {
        address: a.network.address,
        type: a.network.type
      } : undefined
    })) : [],
    source: auditEvent.source || {
      site: 'Clinicall',
      type: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/security-source-type',
          code: '4',
          display: 'Application'
        }
      ]
    },
    entity: auditEvent.entity && auditEvent.entity.length > 0 ? auditEvent.entity.map(e => ({
      type: e.type,
      role: e.role,
      reference: e.reference,
      name: e.name,
      description: e.description,
      query: e.query,
      detail: e.detail
    })) : []
  };
};

/**
 * Helper: Map Consent status to FHIR Consent status
 */
const mapConsentStatus = (status) => {
  const statusMap = {
    'active': 'active',
    'inactive': 'inactive',
    'rejected': 'rejected',
    'pending': 'proposed'
  };
  return statusMap[status] || 'proposed';
};

/**
 * Helper: Map purpose to FHIR ActReason code
 */
const mapPurposeToCode = (purpose) => {
  const purposeMap = {
    'treatment': 'TREAT',
    'referral': 'HRES',
    'research': 'RESEARCH',
    'operations': 'OPS'
  };
  return purposeMap[purpose] || 'PATREG';
};

module.exports = {
  toFhirPatient,
  toFhirPractitioner,
  toFhirOrganization,
  toFhirEncounter,
  toFhirCondition,
  toFhirObservation,
  toFhirAllergyIntolerance,
  toFhirMedication,
  toFhirMedicationRequest,
  toFhirDiagnosticReport,
  toFhirProcedure,
  toFhirImmunization,
  toFhirDocumentReference,
  toFhirConsent,
  toFhirAuditEvent
};
