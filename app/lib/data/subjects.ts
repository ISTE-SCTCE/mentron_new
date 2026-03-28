// ─────────────────────────────────────────────────────────────────────────────
// MENTRON — Complete Subject List
// ─────────────────────────────────────────────────────────────────────────────

export type GroupKey = 'A' | 'B' | 'C' | 'D'
export type DeptKey = 'CSE' | 'ECE' | 'ME' | 'MEA' | 'BT'
export type SemKey = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8'

// ── First Year Groups ─────────────────────────────────────────────────────────

export const FIRST_YEAR_GROUPS: Record<GroupKey, { label: string; streams: string; emoji: string; color: string }> = {
    A: { label: 'Group A', streams: 'CS / IT streams', emoji: '💻', color: 'blue' },
    B: { label: 'Group B', streams: 'EEE / ECE streams', emoji: '⚡', color: 'yellow' },
    C: { label: 'Group C', streams: 'Mechanical / Civil streams', emoji: '⚙️', color: 'orange' },
    D: { label: 'Group D', streams: 'Biotech / Food Tech streams', emoji: '🧬', color: 'green' },
}

export const FIRST_YEAR_SUBJECTS: Record<GroupKey, Record<'S1' | 'S2', string[]>> = {
    A: {
        S1: [
            'Mathematics for Information Science – 1',
            'Physics for Information Science',
            'Chemistry for Information Science & Electrical Science',
            'Engineering Graphics & Computer Aided Drawing',
            'Introduction to Electrical & Electronics Engineering',
            'Algorithmic Thinking with Python',
            'Computational Approaches to Problem Solving',
            'Basic Electrical & Electronics Engineering Workshop',
            'Health and Wellness',
            'Life Skills & Professional Communication',
        ],
        S2: [
            'Mathematics for Information Science – 2',
            'Physics for Information Science',
            'Chemistry for Information Science & Electrical Science',
            'Essentials to Web Design',
            'Programming in C',
            'Engineering Entrepreneurship & IPR',
            'Health and Wellness',
            'Life Skills & Professional Communication',
            'IT Workshop',
        ],
    },
    B: {
        S1: [
            'Mathematics for Electrical Science & Physical Science – 1',
            'Physics for Electrical Science',
            'Chemistry for Information Science & Electrical Science',
            'Engineering Graphics & Computer Aided Drawing',
            'Introduction to Electrical & Electronics Engineering',
            'Algorithmic Thinking with Python',
            'Computational Approaches to Problem Solving',
            'Basic Electrical & Electronics Engineering Workshop',
            'Health and Wellness',
            'Life Skills & Professional Communication',
        ],
        S2: [
            'Mathematics for Electrical Science & Physical Science – 2',
            'Physics for Electrical Science',
            'Chemistry for Information Science & Electrical Science',
            'Web Design',
            'Engineering Mechanics',
            'Programming in C',
            'Engineering Entrepreneurship & IPR',
            'Health and Wellness',
            'Life Skills & Professional Communication',
        ],
    },
    C: {
        S1: [
            'Mathematics for Electrical Science & Physical Science – 1',
            'Physics for Physical Science & Life Science',
            'Chemistry for Physical Science',
            'Engineering Mechanics',
            'Introduction to Mechanical Engineering & Civil Engineering',
            'Algorithmic Thinking with Python',
            'Computational Approaches to Problem Solving',
            'Engineering Workshop',
            'Health and Wellness',
            'Life Skills & Professional Communication',
        ],
        S2: [
            'Mathematics for Electrical Science & Physical Science – 2',
            'Physics for Physical Science & Life Science',
            'Chemistry for Physical Science',
            'Engineering Graphics & Computer Aided Drawing',
            'Basic Electrical & Electronics Engineering',
            'Engineering Entrepreneurship & IPR',
            'Health and Wellness',
            'Life Skills & Professional Communication',
            'Basic Electrical & Electronics Engineering Workshop',
        ],
    },
    D: {
        S1: [
            'Mathematics for Life Science – 1',
            'Physics for Physical Science & Life Science',
            'Chemistry for Life Science',
            'Engineering Graphics & Computer Aided Drawing',
            'Basic Concepts of Biotechnology & Biochemical Engineering',
            'Introduction to Food Technology',
            'Algorithmic Thinking with Python',
            'Fundamentals in Biotechnology Lab',
            'Foundations of Food Technology Lab',
            'Health and Wellness',
            'Life Skills & Professional Communication',
        ],
        S2: [
            'Mathematics for Life Science – 2',
            'Physics for Physical Science & Life Science',
            'Chemistry for Life Science',
            'Basic Mechanical & Civil Engineering',
            'Basic Electrical & Electronics Engineering',
            'Engineering Entrepreneurship & IPR',
            'Health and Wellness',
            'Life Skills & Professional Communication',
        ],
    },
}

// ── Departments (Year 2–4) ────────────────────────────────────────────────────

export const DEPARTMENTS: Record<DeptKey, { name: string; emoji: string; color: string }> = {
    CSE: { name: 'Computer Science & Engineering', emoji: '💻', color: 'blue' },
    ECE: { name: 'Electronics & Communication Engineering', emoji: '📡', color: 'cyan' },
    ME:  { name: 'Mechanical Engineering', emoji: '⚙️', color: 'orange' },
    MEA: { name: 'Mechanical Engineering (Automobile)', emoji: '🚗', color: 'red' },
    BT:  { name: 'Biotechnology', emoji: '🧬', color: 'green' },
}

// Semesters per year
export const YEAR_SEMS: Record<number, [SemKey, SemKey]> = {
    1: ['S1', 'S2'],
    2: ['S3', 'S4'],
    3: ['S5', 'S6'],
    4: ['S7', 'S8'],
}

// ── CSE ───────────────────────────────────────────────────────────────────────
export const CSE_SUBJECTS: Record<'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8', string[]> = {
    S3: [
        'Mathematics for Computer & Information Science – 3',
        'Theory of Computation',
        'Data Structures and Algorithms',
        'Object Oriented Programming',
        'Digital Electronics and Logic Design',
        'Economics for Engineers',
        'Engineering Ethics and Sustainable Development',
        'Data Structures Lab',
        'Digital Lab',
    ],
    S4: [
        'Database Management Systems',
        'Operating Systems',
        'Computer Organization and Architecture',
        'Advanced Data Structures',
        'Economics for Engineers',
        'Engineering Ethics and Sustainable Development',
        'Operating Systems Lab',
        'DBMS Lab',
        '— Electives: Software Engineering, Pattern Recognition, Functional Programming, Coding Theory, Signals and Systems, Soft Computing, Computational Geometry, Cyber Ethics Privacy and Legal Issues, VLSI Design',
    ],
    S5: [
        'Computer Networks',
        'Design and Analysis of Algorithms',
        'Machine Learning',
        'Microcontrollers',
        'Networks Lab',
        'Machine Learning Lab',
        '— Electives: Software Project Management, Artificial Intelligence, Data Analytics, Data Compression, Digital Signal Processing, Computer Graphics & Multimedia, Advanced Computer Architecture, Data Mining, Advanced Graph Algorithms',
    ],
    S6: [
        'Compiler Design',
        'Advanced Computing Systems',
        'Deep Learning',
        'Systems Lab',
        '— Electives: Software Testing, Wireless & Mobile Computing, Advanced Database Systems, Digital Image Processing, Fundamentals of Cryptography, Quantum Computing, Randomized Algorithms, Cloud Computing, Mobile Application Development, Fundamentals of Cyber Security, Data Communication, Machine Learning for Engineers, Object Oriented Programming',
    ],
    S7: [
        'Formal Methods in Software Engineering',
        '— Electives: Web Programming, Bioinformatics, Information Security, Embedded Systems, Blockchain and Cryptocurrencies, Real Time Systems, Approximation Algorithms, Computer Vision, Topics in Theoretical Computer Science, Advanced Computer Networks, Responsible Artificial Intelligence, Fuzzy Systems, Digital Forensics, Game Theory and Mechanism Design, High Performance Computing, Programming Languages, Parallel Algorithms, Internet of Things, Algorithms for Data Science, Cyber Security, Cloud Computing, Software Engineering, Computer Networks, Mobile Application Development',
    ],
    S8: [
        '— Electives: Software Architectures, Natural Language Processing, Topics in Security, Computational Complexity, Speech and Audio Processing, Storage Systems, Prompt Engineering, Computational Number Theory, Next Generation Interaction Design, Introduction to Algorithm, Web Programming, Software Testing, Internet of Things, Computer Graphics',
    ],
}

// ── ECE ───────────────────────────────────────────────────────────────────────
export const ECE_SUBJECTS: Record<'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8', string[]> = {
    S3: [
        'Mathematics for Electrical Science & Physical Science – 3',
        'Solid State Devices',
        'Analog Circuits',
        'Logic Circuit Design',
        'Introduction to Artificial Intelligence and Data Science',
        'Engineering Economics',
        'Engineering Ethics and Sustainable Development',
        'Analog Circuits Lab',
        'Logic Circuit Design Laboratory',
    ],
    S4: [
        'Signals and Systems',
        'Linear Integrated Circuits',
        'Microcontrollers',
        'Economics for Engineers',
        'Engineering Ethics and Sustainable Development',
        'Linear Integrated Circuits Lab',
        'Microcontroller Lab',
        '— Electives: Instrumentation, Power Electronics, Machine Learning, Object Oriented Programming, Digital System Design, Digital Systems and VLSI Design',
    ],
    S5: [
        'Electromagnetics',
        'Analog and Digital Communication',
        'Control Systems',
        'Digital Signal Processing',
        'Digital Signal Processing Lab',
        'Communication Lab I',
        '— Electives: Biomedical Engineering, Data Structures, Sensors and Actuators, ARM Architecture and Programming, High Speed Digital Design, Estimation and Detection',
    ],
    S6: [
        'Advanced Communication Theory',
        'Microwaves & Antennas',
        'Computer Networks',
        'Communication Lab II',
        '— Electives: Digital Image Processing, Secure Communication, Nanoelectronics, Optical Communication, Optimization Techniques, VLSI Circuit Design, Entertainment Electronics, Biomedical Engineering',
    ],
    S7: [
        'Advanced Mobile Communication',
        'Deep Learning',
        '— Electives: Robotics and Automation, Coding Theory, Advanced Digital Signal Processing, Cryptography, Satellite and Radar Communication, Internet of Things, Real Time Operating System, Mixed Signal Circuits, Speech and Audio Processing, Microwave Devices & Circuits, Optical Communication, Digital Image Processing, Optimization Techniques',
    ],
    S8: [
        '— Electives: Wireless Sensor Networks, RF Engineering, Renewable Energy Systems, Cyber Security, Low Power VLSI, Blockchain, Antenna Theory and Wave Propagation, Internet of Things, Satellite and Radar Communication',
    ],
}

// ── ME ────────────────────────────────────────────────────────────────────────
export const ME_SUBJECTS: Record<'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8', string[]> = {
    S3: [
        'Mathematics for Electrical Science & Physical Science – 3',
        'Mechanics of Solids',
        'Fluid Mechanics and Machinery',
        'Manufacturing Processes',
        'Introduction to Artificial Intelligence and Data Science',
        'Economics for Engineers',
        'Engineering Ethics and Sustainable Development',
        'Computer Aided Machine Drawing & Modelling',
        'Materials Testing Lab',
    ],
    S4: [
        'Machine Tools and Metrology',
        'Engineering Thermodynamics',
        'Mechanics of Machinery',
        'Economics for Engineers',
        'Engineering Ethics and Sustainable Development',
        'Fluid Mechanics and Hydraulic Machines Lab',
        'Manufacturing Technology Lab',
        '— Electives: Turbo Machinery, Nuclear Energy, Composite Materials, Components of Intelligent Systems, Advanced Metal Joining Techniques, Technology Management, Supply Chain and Logistics Management, Advanced Mechanics of Solids',
    ],
    S5: [
        'Dynamics of Machinery',
        'Advanced Manufacturing Engineering',
        'Heat and Mass Transfer',
        'Management for Engineers',
        'Mechanical Engineering Lab',
        '— Electives: Computational Fluid Dynamics, Design for Manufacture and Assembly, Computer Aided Design and Analysis, Additive Manufacturing, Energy Economics and Policy, Human Resources Management, Operations Research, Instrumentation and Control Systems',
    ],
    S6: [
        'Industrial and Systems Engineering',
        'Machine Design',
        'Power Plant Engineering',
        'Computer Aided Design and Analysis Lab',
        '— Electives: Compressible Fluid Flow, Industrial Tribology, Finite Element Methods, Industrial Safety Engineering, Marketing Management, Advanced Materials, Thermal Engineering, Introduction to Business Analytics, Quantitative Techniques for Engineers, Automotive Technology, Renewable Energy Engineering, Quality Engineering and Management, Additive Manufacturing, Solar Energy Conservation Systems',
    ],
    S7: [
        'Gas Turbine and Jet Propulsion',
        'Design of Machine Elements',
        '— Electives: Automobile Engineering, Failure Analysis and Design, Lean Manufacturing, Reliability Engineering, Robotics, Mechatronics, Acoustics and Noise Control, Aerospace Engineering, Renewable Energy Engineering, Mobile Robotics, Flexible Manufacturing Systems, Quality Engineering and Management, Optimization Techniques, Engineering Materials, Finite Element Methods, Engineering Instruments and Measurements, Computational Heat Transfer, Power Plant Engineering',
    ],
    S8: [
        '— Electives: Cryogenic Engineering, Pressure Vessel and Piping Design, Hybrid and Electric Vehicles, Micro and Nano Manufacturing, Advanced Numerical Control in Manufacturing, Metal Additive Manufacturing, Nanotechnology, Aircraft Design, Industrial Hydraulics and Automation, Numerical Techniques in Engineering, Business Organization and Development, World Class Manufacturing, Micro Electro Mechanical Systems, Product Design and Innovation',
    ],
}

// ── MEA ───────────────────────────────────────────────────────────────────────
export const MEA_SUBJECTS: Record<'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8', string[]> = {
    S3: [
        'Mathematics for Electrical Science & Physical Science – 3',
        'Automotive Systems',
        'Fluid Mechanics and Machinery',
        'Manufacturing Processes',
        'Introduction to Artificial Intelligence and Data Science',
        'Economics for Engineers',
        'Engineering Ethics and Sustainable Development',
        'Fluid Mechanics and Hydraulic Machines Lab',
        'Automotive Systems Lab',
    ],
    S4: [
        'Mechanics of Solids',
        'Thermodynamics and Thermal Systems',
        'Automotive Engines and Transmission',
        'Economics for Engineers',
        'Engineering Ethics and Sustainable Development',
        'Materials Testing Lab',
        'Manufacturing Technology Lab',
        '— Electives: Alternative Fuels and Energy Systems, Composite Materials and Ceramics, Vehicle Body Engineering, Advanced Metal Joining Techniques, Supply Chain and Logistics Management, Computer Aided Design and Manufacturing',
    ],
    S5: [
        'Automotive Electrical and Electronics Systems',
        'Heat and Mass Transfer',
        'Electric Vehicles – Drives and Control',
        'Mechanics of Machinery',
        'Computer Aided Design and Analysis Lab',
        'Thermal and Internal Combustion Engines Lab',
        '— Electives: Computational Fluid Dynamics, Automotive Pollution and Control, Tractors Farm Equipments and Special Types of Vehicles, Additive Manufacturing, Automotive Standards and Regulations, Instrumentation and Control Systems',
    ],
    S6: [
        'Design of Automotive Components',
        'Mechatronics',
        'Electric and Hybrid Vehicles',
        'Electrical Machines and Mechatronics Lab',
        '— Electives: Automotive Embedded Systems, Vehicle Performance and Testing, Marketing Management, Vehicle Maintenance and Troubleshooting, Vehicle Dynamics, Design Thinking and Product Development, Automated Guided and Autonomous Vehicles, Modern Automotive Technologies, Tractors and Farm Equipments, Special Types of Vehicles, Alternate Fuels and Energy Systems',
    ],
    S7: [
        'Hydrogen Engines and Fuel Cell Vehicles',
        'Heating Ventilation and Air Conditioning Systems',
        'Vehicle Safety and Security Systems',
        '— Electives: Modern Automotive Technologies, Microprocessors and Controllers in Automotives, Finite Element Analysis, Data Analytics, Advanced IC Engines and Combustion, Automotive Aerodynamics, Tribology and Lubrication, Artificial Intelligence and Machine Learning, Electric and Hybrid Vehicle, Automotive Ergonomics and Safety, Automotive Navigation and Control, Vehicle Performance and Testing, Embedded Systems in Automobiles',
    ],
    S8: [
        '— Electives: Automotive Navigation and Control, Operational Research and Industrial Management, Automotive Noise Vibration and Harshness, Renewable Energy Sources, Vehicle Transport Management, Advanced Driver Assistance Systems and Autonomous Vehicles, Advanced Tribology and Nano Lubricants in Automotives, Hydrogen and Fuel Cell Vehicles, Advanced Manufacturing Techniques, Automotive Mechatronics, Vehicle Transport and Fleet Management',
    ],
}

// ── BT ────────────────────────────────────────────────────────────────────────
export const BT_SUBJECTS: Record<'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8', string[]> = {
    S3: [
        'Mathematics for Life Science – 3',
        'Biochemistry',
        'Microbiology',
        'Industrial Bioprocess Technology',
        'Introduction to Artificial Intelligence and Data Science',
        'Economics for Engineers',
        'Engineering Ethics and Sustainable Development',
        'Biochemistry Lab',
        'Microbiology Lab',
    ],
    S4: [
        'Molecular Biology',
        'Fluid Flow and Particle Technology',
        'Elements of Chemical and Biological Reaction Engineering',
        'Plant and Animal Cell Technology',
        'Economics for Engineers',
        'Engineering Ethics and Sustainable Development',
        'Molecular Biology Lab',
        'Fluid Flow & Particle Technology Lab',
        '— Electives: Food Process Technology, Bioenergy and Biofuels, Biochemical Thermodynamics, Biomaterials & Tissue Engineering, Analytical Techniques in Biotechnology',
    ],
    S5: [
        'Heat Transfer Operations',
        'Bioprocess Engineering',
        'Mass Transfer Operations',
        'Enzyme Kinetics & Technology',
        'Heat & Mass Transfer Operations Lab',
        'Bioprocess Engineering Lab',
        '— Electives: Cancer Biology, Bioethics and Safety, Biophysics, Genetic Engineering, Biological Wastewater Treatment, Bioseparation Technology',
    ],
    S6: [
        'Downstream Processing',
        'Process Plant Design',
        'Immunology',
        'Downstream Processing Lab',
        '— Electives: Nano Bioengineering, Innovation & Entrepreneurship, Clinical Research and Drug Design, Biopharmaceutical Technology, Transport Processes in Biological Systems, Bioinformatics, Fundamentals of Food Processing, Quality Control in Pharmaceutical Industry, Process Design for Pollution Control, Energy Engineering and Management, Bioinformatics Techniques and Applications, Environmental Impact Assessment',
    ],
    S7: [
        'Synthetic Biology',
        'Cell Signaling',
        'Computational Biology',
        'Patents and IPR',
        '— Electives: Metabolic Engineering, High Resolution Separations, Developmental Biology, Neurobiology, Cell Culture Techniques, Bioremediation, Proteomics & Protein Engineering, Next Generation Sequencing, Microbial Fuel Cell, Advanced Materials, Process Safety Engineering, Industrial Instrumentation, Advanced Wastewater Treatment, Air Pollution Control, Design of Experiments',
    ],
    S8: [
        '— Electives: Cytogenetics, Drug Delivery Principle & Application, Marine Biotechnology, Environmental Biotechnology, Bioconjugate Technology & Applications, Advanced Bio Separation Engineering, Environment Management Systems, Fuel Engineering, Nanomaterials and Nanotechnology, Food Product Design and Development, Waste to Energy Technology, Non-Conventional Energy Systems',
    ],
}

// ── Unified lookup helper ─────────────────────────────────────────────────────

export function getSubjects(dept: DeptKey, sem: SemKey): string[] {
    const map: Record<DeptKey, Record<string, string[]>> = {
        CSE: CSE_SUBJECTS,
        ECE: ECE_SUBJECTS,
        ME:  ME_SUBJECTS,
        MEA: MEA_SUBJECTS,
        BT:  BT_SUBJECTS,
    }
    return map[dept]?.[sem] ?? []
}

export function getFirstYearSubjects(group: GroupKey, sem: 'S1' | 'S2'): string[] {
    return FIRST_YEAR_SUBJECTS[group]?.[sem] ?? []
}
