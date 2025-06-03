export interface MedicalEmergency {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  symptoms: string[];
  immediateActions: string[];
  diversionRequired: boolean;
  timeToTreatment: number; // minutes
  oxygenRequired: boolean;
  aedRequired: boolean;
  doctorRequired: boolean;
}

export interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  type: 'medical' | 'weather' | 'mechanical' | 'security';
  severity: 'low' | 'medium' | 'high';
  estimatedDuration: string;
  learningObjectives: string[];
  emergencyDetails?: MedicalEmergency;
  decisionPoints: DecisionPoint[];
  successCriteria: string[];
}

export interface DecisionPoint {
  id: string;
  time: number; // seconds into scenario
  description: string;
  options: DecisionOption[];
  timeLimit: number; // seconds to decide
  criticalFactor: boolean;
}

export interface DecisionOption {
  id: string;
  text: string;
  consequences: string[];
  scoreImpact: number;
  followUpActions: string[];
}

export const medicalEmergencies: MedicalEmergency[] = [
  {
    type: "Cardiac Arrest",
    severity: "critical",
    symptoms: [
      "Unconsciousness",
      "No pulse",
      "No breathing",
      "Cyanosis"
    ],
    immediateActions: [
      "Call for medical assistance",
      "Begin CPR immediately",
      "Prepare AED",
      "Administer oxygen if available",
      "Consider immediate diversion"
    ],
    diversionRequired: true,
    timeToTreatment: 10,
    oxygenRequired: true,
    aedRequired: true,
    doctorRequired: true
  },
  {
    type: "Stroke",
    severity: "high",
    symptoms: [
      "Sudden weakness",
      "Facial drooping",
      "Speech difficulties",
      "Confusion",
      "Severe headache"
    ],
    immediateActions: [
      "Assess using FAST protocol",
      "Position patient comfortably",
      "Monitor vital signs",
      "Prepare for potential diversion",
      "Contact medical advisory service"
    ],
    diversionRequired: true,
    timeToTreatment: 60,
    oxygenRequired: false,
    aedRequired: false,
    doctorRequired: true
  },
  {
    type: "Severe Allergic Reaction",
    severity: "high",
    symptoms: [
      "Difficulty breathing",
      "Swelling of face/throat",
      "Widespread rash",
      "Rapid pulse",
      "Dizziness"
    ],
    immediateActions: [
      "Administer epinephrine if available",
      "Provide supplemental oxygen",
      "Monitor airway carefully",
      "Prepare antihistamines",
      "Consider diversion if severe"
    ],
    diversionRequired: true,
    timeToTreatment: 30,
    oxygenRequired: true,
    aedRequired: false,
    doctorRequired: true
  },
  {
    type: "Heart Attack",
    severity: "high",
    symptoms: [
      "Chest pain",
      "Shortness of breath",
      "Nausea",
      "Sweating",
      "Arm pain"
    ],
    immediateActions: [
      "Administer aspirin if not contraindicated",
      "Provide oxygen",
      "Monitor vital signs",
      "Keep patient calm",
      "Prepare for potential cardiac arrest"
    ],
    diversionRequired: true,
    timeToTreatment: 45,
    oxygenRequired: true,
    aedRequired: false,
    doctorRequired: true
  },
  {
    type: "Diabetic Emergency",
    severity: "medium",
    symptoms: [
      "Altered consciousness",
      "Confusion",
      "Rapid breathing",
      "Fruity breath odor",
      "Dehydration"
    ],
    immediateActions: [
      "Check blood glucose if available",
      "If conscious and glucose low, give sugar",
      "If unconscious, place in recovery position",
      "Monitor breathing",
      "Consider diversion based on severity"
    ],
    diversionRequired: false,
    timeToTreatment: 120,
    oxygenRequired: false,
    aedRequired: false,
    doctorRequired: false
  },
  {
    type: "Seizure",
    severity: "medium",
    symptoms: [
      "Convulsions",
      "Loss of consciousness",
      "Muscle rigidity",
      "Breathing difficulties",
      "Confusion after episode"
    ],
    immediateActions: [
      "Protect from injury",
      "Time the seizure",
      "Place in recovery position when safe",
      "Do not restrain",
      "Monitor for additional seizures"
    ],
    diversionRequired: false,
    timeToTreatment: 180,
    oxygenRequired: false,
    aedRequired: false,
    doctorRequired: false
  }
];

export const scenarios: TrainingScenario[] = [
  {
    id: "medical-cardiac-01",
    title: "Mid-Flight Cardiac Emergency",
    description: "A 58-year-old passenger experiences cardiac arrest during cruise flight over the Pacific Ocean. Nearest suitable airports are 2+ hours away.",
    type: "medical",
    severity: "high",
    estimatedDuration: "45 minutes",
    learningObjectives: [
      "Practice emergency medical assessment",
      "Coordinate between cabin crew and flight deck",
      "Make time-critical diversion decisions",
      "Manage passenger communication during emergency",
      "Coordinate with medical advisory services"
    ],
    emergencyDetails: medicalEmergencies[0], // Cardiac Arrest
    decisionPoints: [
      {
        id: "initial-response",
        time: 60,
        description: "Cabin crew reports unresponsive passenger. Initial assessment shows no pulse.",
        options: [
          {
            id: "immediate-diversion",
            text: "Declare emergency and divert immediately to nearest airport",
            consequences: ["Fuel implications", "Passenger disruption", "Fastest medical care"],
            scoreImpact: 15,
            followUpActions: ["Contact ATC", "Calculate fuel requirements", "Prepare for emergency landing"]
          },
          {
            id: "continue-assess",
            text: "Continue current heading while crew provides medical care",
            consequences: ["Potential delay in treatment", "Less fuel consumed", "Risk patient condition"],
            scoreImpact: -10,
            followUpActions: ["Monitor patient condition", "Reassess in 10 minutes"]
          },
          {
            id: "medical-consultation",
            text: "Contact medical advisory service before making diversion decision",
            consequences: ["Delay in decision making", "Professional medical input", "Time to assess"],
            scoreImpact: 5,
            followUpActions: ["Establish radio contact", "Relay patient condition", "Await recommendations"]
          }
        ],
        timeLimit: 120,
        criticalFactor: true
      },
      {
        id: "airport-selection",
        time: 300,
        description: "Emergency declared. Multiple airports available for diversion.",
        options: [
          {
            id: "closest-airport",
            text: "Divert to closest airport (45 minutes away, limited medical facilities)",
            consequences: ["Shortest flight time", "Basic medical care", "Potential need for medical transfer"],
            scoreImpact: 10,
            followUpActions: ["Calculate approach requirements", "Notify airport emergency services"]
          },
          {
            id: "major-hospital",
            text: "Divert to major city airport (65 minutes away, major trauma center)",
            consequences: ["Longer flight time", "Advanced medical care", "Higher fuel consumption"],
            scoreImpact: 12,
            followUpActions: ["Coordinate with trauma center", "Plan emergency approach"]
          },
          {
            id: "alternate-route",
            text: "Continue to nearest airport on current route (75 minutes, good facilities)",
            consequences: ["Balanced option", "Good medical facilities", "Less deviation from route"],
            scoreImpact: 8,
            followUpActions: ["Increase speed if possible", "Coordinate emergency services"]
          }
        ],
        timeLimit: 180,
        criticalFactor: true
      }
    ],
    successCriteria: [
      "Emergency declared within 2 minutes",
      "Appropriate medical care initiated immediately",
      "Diversion decision made within 5 minutes",
      "Effective coordination between crew and ground",
      "Passenger safety maintained throughout"
    ]
  },
  {
    id: "medical-stroke-02",
    title: "Suspected Stroke During Oceanic Flight",
    description: "During a trans-Pacific flight, a passenger shows signs of stroke. Limited diversion options available over ocean.",
    type: "medical",
    severity: "high",
    estimatedDuration: "35 minutes",
    learningObjectives: [
      "Recognize stroke symptoms using FAST protocol",
      "Evaluate diversion options over oceanic routes",
      "Balance medical urgency with operational constraints",
      "Coordinate with international medical services",
      "Manage extended care during long diversion"
    ],
    emergencyDetails: medicalEmergencies[1], // Stroke
    decisionPoints: [
      {
        id: "symptom-recognition",
        time: 90,
        description: "Passenger family reports sudden weakness and speech problems.",
        options: [
          {
            id: "fast-assessment",
            text: "Conduct FAST assessment immediately",
            consequences: ["Quick stroke identification", "Appropriate medical response", "Time saved"],
            scoreImpact: 15,
            followUpActions: ["Train crew on FAST protocol", "Document symptoms", "Monitor progression"]
          },
          {
            id: "general-assessment",
            text: "Perform general medical assessment",
            consequences: ["Comprehensive evaluation", "Potential delay in stroke recognition", "Broader view"],
            scoreImpact: 5,
            followUpActions: ["Check vital signs", "Review medical history", "Assess consciousness"]
          }
        ],
        timeLimit: 90,
        criticalFactor: true
      },
      {
        id: "oceanic-diversion",
        time: 600,
        description: "FAST assessment positive for stroke. Over Pacific Ocean with limited airports.",
        options: [
          {
            id: "anchorage-divert",
            text: "Divert to Anchorage (3 hours, excellent stroke center)",
            consequences: ["Long flight time", "World-class medical care", "Cold weather operations"],
            scoreImpact: 12,
            followUpActions: ["Plan polar route", "Coordinate stroke protocol", "Prepare for weather"]
          },
          {
            id: "hawaii-divert",
            text: "Divert to Honolulu (2.5 hours, good medical facilities)",
            consequences: ["Moderate flight time", "Good medical care", "Better weather conditions"],
            scoreImpact: 15,
            followUpActions: ["Calculate fuel requirements", "Coordinate emergency services", "Plan approach"]
          },
          {
            id: "continue-destination",
            text: "Continue to original destination (4 hours, monitor condition)",
            consequences: ["No route deviation", "Extended care required", "Risk of condition deterioration"],
            scoreImpact: -5,
            followUpActions: ["Continuous monitoring", "Prepare for deterioration", "Medical consultation"]
          }
        ],
        timeLimit: 300,
        criticalFactor: true
      }
    ],
    successCriteria: [
      "Stroke symptoms recognized within 90 seconds",
      "FAST protocol correctly applied",
      "Diversion decision based on medical urgency",
      "Appropriate airport selected for stroke care",
      "Continuous monitoring maintained"
    ]
  },
  {
    id: "medical-allergic-03",
    title: "Severe Allergic Reaction at Altitude",
    description: "Passenger experiences severe allergic reaction to in-flight meal. Anaphylaxis suspected with breathing difficulties.",
    type: "medical",
    severity: "high",
    estimatedDuration: "25 minutes",
    learningObjectives: [
      "Recognize and treat anaphylaxis",
      "Use emergency medication effectively",
      "Make rapid diversion decisions",
      "Coordinate emergency descent if needed",
      "Manage airway emergencies at altitude"
    ],
    emergencyDetails: medicalEmergencies[2], // Severe Allergic Reaction
    decisionPoints: [
      {
        id: "allergic-recognition",
        time: 30,
        description: "Passenger complains of difficulty breathing after eating. Visible facial swelling.",
        options: [
          {
            id: "epinephrine-immediate",
            text: "Administer epinephrine immediately",
            consequences: ["Rapid treatment", "Potential side effects", "Life-saving action"],
            scoreImpact: 20,
            followUpActions: ["Monitor vital signs", "Prepare second dose", "Oxygen administration"]
          },
          {
            id: "assess-first",
            text: "Assess severity before medication",
            consequences: ["Comprehensive evaluation", "Potential delay in treatment", "Risk assessment"],
            scoreImpact: 5,
            followUpActions: ["Check breathing", "Assess circulation", "Look for other symptoms"]
          },
          {
            id: "antihistamine-only",
            text: "Give antihistamine and monitor",
            consequences: ["Conservative approach", "May be insufficient", "Delayed intervention"],
            scoreImpact: -10,
            followUpActions: ["Close monitoring", "Prepare for escalation", "Document response"]
          }
        ],
        timeLimit: 60,
        criticalFactor: true
      },
      {
        id: "descent-decision",
        time: 180,
        description: "Patient condition stabilizing but still having breathing difficulties.",
        options: [
          {
            id: "emergency-descent",
            text: "Initiate emergency descent to lower altitude",
            consequences: ["Improved oxygen availability", "Passenger alarm", "ATC coordination required"],
            scoreImpact: 10,
            followUpActions: ["Coordinate with ATC", "Oxygen masks deployment", "Passenger announcement"]
          },
          {
            id: "maintain-altitude",
            text: "Maintain altitude, continue oxygen therapy",
            consequences: ["No passenger alarm", "Continued altitude stress", "Simpler operations"],
            scoreImpact: 5,
            followUpActions: ["Continuous oxygen", "Monitor breathing", "Prepare for descent if needed"]
          }
        ],
        timeLimit: 120,
        criticalFactor: false
      }
    ],
    successCriteria: [
      "Anaphylaxis recognized within 30 seconds",
      "Epinephrine administered promptly",
      "Oxygen therapy initiated",
      "Appropriate altitude management",
      "Patient condition stabilized"
    ]
  },
  {
    id: "medical-multiple-04",
    title: "Multiple Medical Emergencies",
    description: "Food poisoning outbreak affects multiple passengers. Crew must prioritize care and consider diversion with limited medical supplies.",
    type: "medical",
    severity: "medium",
    estimatedDuration: "50 minutes",
    learningObjectives: [
      "Manage multiple simultaneous emergencies",
      "Prioritize care with limited resources",
      "Coordinate crew assignments effectively",
      "Make group vs individual care decisions",
      "Handle passenger anxiety during outbreak"
    ],
    emergencyDetails: {
      type: "Food Poisoning Outbreak",
      severity: "medium",
      symptoms: ["Nausea", "Vomiting", "Diarrhea", "Dehydration", "Weakness"],
      immediateActions: [
        "Isolate affected food items",
        "Assess number of affected passengers",
        "Provide hydration support",
        "Monitor for severe complications",
        "Consider diversion based on severity"
      ],
      diversionRequired: false,
      timeToTreatment: 240,
      oxygenRequired: false,
      aedRequired: false,
      doctorRequired: false
    },
    decisionPoints: [
      {
        id: "outbreak-assessment",
        time: 120,
        description: "15 passengers reporting illness. Symptoms include severe nausea and vomiting.",
        options: [
          {
            id: "quarantine-protocol",
            text: "Implement quarantine protocols, isolate affected passengers",
            consequences: ["Prevent spread", "Passenger anxiety", "Crew resource allocation"],
            scoreImpact: 15,
            followUpActions: ["Designate quarantine area", "Assign dedicated crew", "Sanitize areas"]
          },
          {
            id: "general-care",
            text: "Provide general care without quarantine",
            consequences: ["Less passenger alarm", "Risk of spread", "Easier crew management"],
            scoreImpact: 5,
            followUpActions: ["Distribute care supplies", "Monitor all passengers", "General announcements"]
          }
        ],
        timeLimit: 180,
        criticalFactor: true
      },
      {
        id: "resource-allocation",
        time: 480,
        description: "Medical supplies running low. 3 passengers showing severe dehydration.",
        options: [
          {
            id: "prioritize-severe",
            text: "Focus resources on most severe cases",
            consequences: ["Better outcomes for critical cases", "Other passengers receive less care", "Ethical dilemma"],
            scoreImpact: 10,
            followUpActions: ["Triage protocols", "Continuous assessment", "Family communication"]
          },
          {
            id: "equal-distribution",
            text: "Distribute remaining supplies equally",
            consequences: ["Fair treatment", "May not help severe cases", "Resource dilution"],
            scoreImpact: 5,
            followUpActions: ["Monitor all patients", "Prepare for complications", "Consider diversion"]
          },
          {
            id: "request-diversion",
            text: "Request immediate diversion for medical assistance",
            consequences: ["Access to medical facilities", "Operational disruption", "Cost implications"],
            scoreImpact: 12,
            followUpActions: ["Contact nearest airport", "Arrange ground medical", "Prepare for landing"]
          }
        ],
        timeLimit: 240,
        criticalFactor: true
      }
    ],
    successCriteria: [
      "Outbreak recognized and contained",
      "Appropriate triage protocols implemented",
      "Resources managed effectively",
      "Passenger safety and comfort maintained",
      "Crew health protected"
    ]
  }
];

export const medicalProtocols = {
  assessmentProcedures: {
    primary: [
      "Check responsiveness",
      "Assess breathing",
      "Check pulse",
      "Look for obvious injuries",
      "Determine consciousness level"
    ],
    secondary: [
      "Take vital signs",
      "Perform FAST assessment if stroke suspected",
      "Check medical history",
      "Assess pain levels",
      "Document findings"
    ]
  },
  communicationProtocols: {
    crewNotification: [
      "Immediately notify flight deck",
      "Request medical assistance announcement",
      "Brief crew on situation",
      "Assign crew roles",
      "Establish communication schedule"
    ],
    groundCommunication: [
      "Contact medical advisory service",
      "Report patient condition",
      "Request diversion if needed",
      "Coordinate with destination medical",
      "Update operations center"
    ]
  },
  diversionCriteria: {
    immediate: [
      "Cardiac arrest",
      "Severe breathing difficulties",
      "Uncontrolled bleeding",
      "Loss of consciousness",
      "Severe allergic reaction"
    ],
    consider: [
      "Chest pain",
      "Stroke symptoms",
      "Severe pain",
      "Psychiatric emergency",
      "Multiple affected passengers"
    ]
  }
};

