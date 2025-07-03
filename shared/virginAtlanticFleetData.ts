/**
 * Authentic Virgin Atlantic Fleet Data
 * Updated fleet registry with complete aircraft specifications
 */

export interface VirginAtlanticAircraft {
  registration: string;
  aircraftType: string;
  configuration: string;
  delivered: string;
  remark: string;
  aircraftName: string;
  age: string;
  ageYears: number;
}

export const VIRGIN_ATLANTIC_FLEET: VirginAtlanticAircraft[] = [
  // Airbus A330-300 Fleet (6 aircraft)
  {
    registration: "G-VGEM",
    aircraftType: "Airbus A330-300",
    configuration: "C31W48Y185",
    delivered: "Oct 2012",
    remark: "lsd",
    aircraftName: "Diamond Girl",
    age: "14.3 Years",
    ageYears: 14.3
  },
  {
    registration: "G-VLUV",
    aircraftType: "Airbus A330-300",
    configuration: "C31W48Y185",
    delivered: "Nov 2012",
    remark: "lsd",
    aircraftName: "Lady Love",
    age: "14.4 Years",
    ageYears: 14.4
  },
  {
    registration: "G-VRAY",
    aircraftType: "Airbus A330-300",
    configuration: "C31W48Y185",
    delivered: "Mar 2012",
    remark: "lsd",
    aircraftName: "Miss Sunshine",
    age: "13.3 Years",
    ageYears: 13.3
  },
  {
    registration: "G-VSXY",
    aircraftType: "Airbus A330-300",
    configuration: "C31W48Y185",
    delivered: "Feb 2011",
    remark: "lsd",
    aircraftName: "Beauty Queen",
    age: "14.5 Years",
    ageYears: 14.5
  },
  {
    registration: "G-VUFO",
    aircraftType: "Airbus A330-300",
    configuration: "C31W48Y185",
    delivered: "Nov 2012",
    remark: "lsd",
    aircraftName: "Lady Stardust",
    age: "12.8 Years",
    ageYears: 12.8
  },
  {
    registration: "G-VWAG",
    aircraftType: "Airbus A330-300",
    configuration: "C31W48Y185",
    delivered: "Oct 2012",
    remark: "lsd",
    aircraftName: "Miss England",
    age: "12.8 Years",
    ageYears: 12.8
  },

  // Airbus A330-900 Fleet (8 aircraft)
  {
    registration: "G-VEII",
    aircraftType: "Airbus A330-900",
    configuration: "C32W46Y184",
    delivered: "Mar 2023",
    remark: "lsd",
    aircraftName: "Queen of the Skies",
    age: "2.3 Years",
    ageYears: 2.3
  },
  {
    registration: "G-VEYR",
    aircraftType: "Airbus A330-900",
    configuration: "C32W46Y184",
    delivered: "Oct 2024",
    remark: "",
    aircraftName: "Jane Air",
    age: "0.8 Years",
    ageYears: 0.8
  },
  {
    registration: "G-VJAZ",
    aircraftType: "Airbus A330-900",
    configuration: "C32W46Y184",
    delivered: "Oct 2022",
    remark: "lsd",
    aircraftName: "Billie Holiday",
    age: "2.9 Years",
    ageYears: 2.9
  },
  {
    registration: "G-VLDY",
    aircraftType: "Airbus A330-900",
    configuration: "C32W46Y184",
    delivered: "Jan 2023",
    remark: "lsd",
    aircraftName: "Eliza Doolittle",
    age: "2.5 Years",
    ageYears: 2.5
  },
  {
    registration: "G-VPIE",
    aircraftType: "Airbus A330-900",
    configuration: "C32W46Y184",
    delivered: "Dec 2024",
    remark: "lsd",
    aircraftName: "Cherry Bakewell",
    age: "0.6 Years",
    ageYears: 0.6
  },
  {
    registration: "G-VRIF",
    aircraftType: "Airbus A330-900",
    configuration: "C32W46Y184",
    delivered: "Aug 2024",
    remark: "lsd",
    aircraftName: "Joan Jet",
    age: "0.9 Years",
    ageYears: 0.9
  },
  {
    registration: "G-VSRB",
    aircraftType: "Airbus A330-900",
    configuration: "C32W46Y184",
    delivered: "Jun 2024",
    remark: "lsd",
    aircraftName: "Ruby Rebel",
    age: "1.1 Years",
    ageYears: 1.1
  },
  {
    registration: "G-VTOM",
    aircraftType: "Airbus A330-900",
    configuration: "C32W46Y184",
    delivered: "Nov 2022",
    remark: "lsd",
    aircraftName: "Space Oddity",
    age: "2.8 Years",
    ageYears: 2.8
  },

  // Airbus A350-1000 Fleet (12 aircraft)
  {
    registration: "G-VBOB",
    aircraftType: "Airbus A350-1000",
    configuration: "C16W56Y325",
    delivered: "May 2023",
    remark: "lsd",
    aircraftName: "Soul Rebel",
    age: "2.2 Years",
    ageYears: 2.2
  },
  {
    registration: "G-VDOT",
    aircraftType: "Airbus A350-1000",
    configuration: "C44W56Y235",
    delivered: "Sep 2020",
    remark: "",
    aircraftName: "Ruby Slipper",
    age: "8.5 Years",
    ageYears: 8.5
  },
  {
    registration: "G-VELJ",
    aircraftType: "Airbus A350-1000",
    configuration: "C16W56Y325",
    delivered: "May 2024",
    remark: "",
    aircraftName: "Bennie Jet",
    age: "1.2 Years",
    ageYears: 1.2
  },
  {
    registration: "G-VEVE",
    aircraftType: "Airbus A350-1000",
    configuration: "C16W56Y325",
    delivered: "Dec 2021",
    remark: "lsd",
    aircraftName: "Fearless Lady",
    age: "3.8 Years",
    ageYears: 3.8
  },
  {
    registration: "G-VJAM",
    aircraftType: "Airbus A350-1000",
    configuration: "C44W56Y235",
    delivered: "Sep 2019",
    remark: "",
    aircraftName: "Queen Of Hearts",
    age: "5.9 Years",
    ageYears: 5.9
  },
  {
    registration: "G-VLIB",
    aircraftType: "Airbus A350-1000",
    configuration: "C16W56Y325",
    delivered: "Apr 2022",
    remark: "lsd",
    aircraftName: "Lady Emmeline",
    age: "3.4 Years",
    ageYears: 3.4
  },
  {
    registration: "G-VLUX",
    aircraftType: "Airbus A350-1000",
    configuration: "C44W56Y235",
    delivered: "Aug 2019",
    remark: "",
    aircraftName: "Red Velvet",
    age: "6 Years",
    ageYears: 6.0
  },
  {
    registration: "G-VNVR",
    aircraftType: "Airbus A350-1000",
    configuration: "C16W56Y325",
    delivered: "Mar 2024",
    remark: "lsd",
    aircraftName: "Wendy Darling",
    age: "1.4 Years",
    ageYears: 1.4
  },
  {
    registration: "G-VPOP",
    aircraftType: "Airbus A350-1000",
    configuration: "C44W56Y235",
    delivered: "Aug 2019",
    remark: "",
    aircraftName: "Mamma Mia",
    age: "6.1 Years",
    ageYears: 6.1
  },
  {
    registration: "G-VPRD",
    aircraftType: "Airbus A350-1000",
    configuration: "C44W56Y235",
    delivered: "Sep 2019",
    remark: "",
    aircraftName: "Rain Bow",
    age: "6 Years",
    ageYears: 6.0
  },
  {
    registration: "G-VRNB",
    aircraftType: "Airbus A350-1000",
    configuration: "C44W56Y235",
    delivered: "Sep 2020",
    remark: "lsd",
    aircraftName: "Purple Rain",
    age: "5.1 Years",
    ageYears: 5.1
  },
  {
    registration: "G-VTEA",
    aircraftType: "Airbus A350-1000",
    configuration: "C44W56Y235",
    delivered: "Nov 2020",
    remark: "lsd",
    aircraftName: "Rosie Lee",
    age: "5 Years",
    ageYears: 5.0
  },

  // Boeing 787-9 Dreamliner Fleet (17 aircraft)
  {
    registration: "G-VAHH",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Dec 2014",
    remark: "lsd",
    aircraftName: "Dream Girl",
    age: "10.5 Years",
    ageYears: 10.5
  },
  {
    registration: "G-VBEL",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Mar 2018",
    remark: "lsd",
    aircraftName: "Lady Freedom",
    age: "7.3 Years",
    ageYears: 7.3
  },
  {
    registration: "G-VBOW",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Mar 2017",
    remark: "lsd",
    aircraftName: "Amazing Grace",
    age: "8.3 Years",
    ageYears: 8.3
  },
  {
    registration: "G-VBZZ",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Mar 2016",
    remark: "lsd",
    aircraftName: "Queen Bee",
    age: "9.3 Years",
    ageYears: 9.3
  },
  {
    registration: "G-VCRU",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Sep 2015",
    remark: "Parked at TEV, lsd",
    aircraftName: "Olivia Rae",
    age: "9.8 Years",
    ageYears: 9.8
  },
  {
    registration: "G-VDIA",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Mar 2016",
    remark: "lsd",
    aircraftName: "Lucy in the Sky",
    age: "9.6 Years",
    ageYears: 9.6
  },
  {
    registration: "G-VFAN",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Jun 2016",
    remark: "lsd",
    aircraftName: "Pin Up Girl",
    age: "9.1 Years",
    ageYears: 9.1
  },
  {
    registration: "G-VMAP",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "May 2016",
    remark: "",
    aircraftName: "West End Girl",
    age: "9.2 Years",
    ageYears: 9.2
  },
  {
    registration: "G-VNEW",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Oct 2014",
    remark: "lsd",
    aircraftName: "Birthday Girl",
    age: "10.8 Years",
    ageYears: 10.8
  },
  {
    registration: "G-VNYL",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Apr 2018",
    remark: "lsd",
    aircraftName: "Penny Lane",
    age: "7.3 Years",
    ageYears: 7.3
  },
  {
    registration: "G-VOOH",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Feb 2015",
    remark: "lsd",
    aircraftName: "Miss Chief",
    age: "10.4 Years",
    ageYears: 10.4
  },
  {
    registration: "G-VOWS",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Dec 2015",
    remark: "",
    aircraftName: "Maid Marian",
    age: "9.6 Years",
    ageYears: 9.6
  },
  {
    registration: "G-VSPY",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Dec 2015",
    remark: "lsd",
    aircraftName: "Miss Moneypenny",
    age: "9.6 Years",
    ageYears: 9.6
  },
  {
    registration: "G-VWHO",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Jun 2015",
    remark: "lsd",
    aircraftName: "Mystery Girl",
    age: "10.1 Years",
    ageYears: 10.1
  },
  {
    registration: "G-VWOO",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Jan 2018",
    remark: "lsd",
    aircraftName: "Leading Lady",
    age: "7.5 Years",
    ageYears: 7.5
  },
  {
    registration: "G-VYUM",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "May 2015",
    remark: "lsd",
    aircraftName: "Ruby Murray",
    age: "10.2 Years",
    ageYears: 10.2
  },
  {
    registration: "G-VZIG",
    aircraftType: "Boeing 787-9 Dreamliner",
    configuration: "C31W35Y198",
    delivered: "Mar 2015",
    remark: "lsd",
    aircraftName: "Dream Jeannie",
    age: "10.4 Years",
    ageYears: 10.4
  }
];

/**
 * Fleet summary statistics
 */
export const FLEET_SUMMARY = {
  totalAircraft: 43,
  aircraftTypes: {
    "Airbus A330-300": 6,
    "Airbus A330-900": 8,
    "Airbus A350-1000": 12,
    "Boeing 787-9 Dreamliner": 17
  },
  averageAge: {
    "Airbus A330-300": 13.6,
    "Airbus A330-900": 1.8,
    "Airbus A350-1000": 4.6,
    "Boeing 787-9 Dreamliner": 9.2
  },
  newestAircraft: "G-VPIE", // Cherry Bakewell, 0.6 years
  oldestAircraft: "G-VSXY", // Beauty Queen, 14.5 years
  configurations: {
    "C31W48Y185": 6,  // A330-300
    "C32W46Y184": 8,  // A330-900
    "C16W56Y325": 6,  // A350-1000 (newer config)
    "C44W56Y235": 6,  // A350-1000 (older config)
    "C31W35Y198": 17  // Boeing 787-9
  }
};

/**
 * Utility functions for fleet data
 */
export class VirginAtlanticFleetUtils {
  /**
   * Get aircraft by registration
   */
  static getAircraftByRegistration(registration: string): VirginAtlanticAircraft | undefined {
    return VIRGIN_ATLANTIC_FLEET.find(aircraft => aircraft.registration === registration);
  }

  /**
   * Get aircraft by name
   */
  static getAircraftByName(name: string): VirginAtlanticAircraft | undefined {
    return VIRGIN_ATLANTIC_FLEET.find(aircraft => 
      aircraft.aircraftName.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Get aircraft by type
   */
  static getAircraftByType(type: string): VirginAtlanticAircraft[] {
    return VIRGIN_ATLANTIC_FLEET.filter(aircraft => aircraft.aircraftType === type);
  }

  /**
   * Get aircraft in age range
   */
  static getAircraftByAgeRange(minYears: number, maxYears: number): VirginAtlanticAircraft[] {
    return VIRGIN_ATLANTIC_FLEET.filter(aircraft => 
      aircraft.ageYears >= minYears && aircraft.ageYears <= maxYears
    );
  }

  /**
   * Get newest aircraft (by delivery date)
   */
  static getNewestAircraft(): VirginAtlanticAircraft[] {
    return VIRGIN_ATLANTIC_FLEET
      .filter(aircraft => aircraft.ageYears < 2)
      .sort((a, b) => a.ageYears - b.ageYears);
  }

  /**
   * Get aircraft by configuration
   */
  static getAircraftByConfiguration(config: string): VirginAtlanticAircraft[] {
    return VIRGIN_ATLANTIC_FLEET.filter(aircraft => aircraft.configuration === config);
  }

  /**
   * Calculate total passenger capacity by type
   */
  static getTotalCapacityByType(): Record<string, number> {
    const capacities: Record<string, number> = {};
    
    Object.entries(FLEET_SUMMARY.aircraftTypes).forEach(([type, count]) => {
      let seatCount = 0;
      switch (type) {
        case "Airbus A330-300":
          seatCount = 264; // C31 + W48 + Y185
          break;
        case "Airbus A330-900":
          seatCount = 262; // C32 + W46 + Y184
          break;
        case "Airbus A350-1000":
          // Mixed configurations: some 397 (C16+W56+Y325), some 335 (C44+W56+Y235)
          const a350NewConfig = VIRGIN_ATLANTIC_FLEET.filter(a => 
            a.aircraftType === type && a.configuration === "C16W56Y325"
          ).length;
          const a350OldConfig = VIRGIN_ATLANTIC_FLEET.filter(a => 
            a.aircraftType === type && a.configuration === "C44W56Y235"
          ).length;
          seatCount = (a350NewConfig * 397 + a350OldConfig * 335) / count;
          break;
        case "Boeing 787-9 Dreamliner":
          seatCount = 264; // C31 + W35 + Y198
          break;
      }
      capacities[type] = Math.round(seatCount * count);
    });
    
    return capacities;
  }

  /**
   * Get fleet age distribution
   */
  static getAgeDistribution(): Record<string, number> {
    const distribution = {
      "0-2 years": 0,
      "2-5 years": 0,
      "5-8 years": 0,
      "8-12 years": 0,
      "12+ years": 0
    };

    VIRGIN_ATLANTIC_FLEET.forEach(aircraft => {
      if (aircraft.ageYears < 2) distribution["0-2 years"]++;
      else if (aircraft.ageYears < 5) distribution["2-5 years"]++;
      else if (aircraft.ageYears < 8) distribution["5-8 years"]++;
      else if (aircraft.ageYears < 12) distribution["8-12 years"]++;
      else distribution["12+ years"]++;
    });

    return distribution;
  }

  /**
   * Check if aircraft is currently parked/out of service
   */
  static isAircraftParked(registration: string): boolean {
    const aircraft = this.getAircraftByRegistration(registration);
    return aircraft?.remark.includes("Parked") || false;
  }
}