// Mentron – Complete Subject Data
// Mirrors app/lib/data/subjects.ts

class SubjectData {
  // ── First Year Groups ─────────────────────────────────────────────
  static const Map<String, Map<String, String>> firstYearGroups = {
    'A': {'label': 'Group A', 'streams': 'CS / IT streams', 'emoji': '💻'},
    'B': {'label': 'Group B', 'streams': 'EEE / ECE streams', 'emoji': '⚡'},
    'C': {'label': 'Group C', 'streams': 'Mechanical / Civil streams', 'emoji': '⚙️'},
    'D': {'label': 'Group D', 'streams': 'Biotech / Food Tech streams', 'emoji': '🧬'},
  };

  static const Map<String, Map<String, List<String>>> firstYearSubjects = {
    'A': {
      'S1': [
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
      'S2': [
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
    'B': {
      'S1': [
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
      'S2': [
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
    'C': {
      'S1': [
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
      'S2': [
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
    'D': {
      'S1': [
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
      'S2': [
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
  };

  // ── Departments ───────────────────────────────────────────────────
  static const Map<String, Map<String, String>> departments = {
    'CSE': {'name': 'Computer Science & Engineering', 'emoji': '💻'},
    'ECE': {'name': 'Electronics & Communication Engineering', 'emoji': '📡'},
    'ME':  {'name': 'Mechanical Engineering', 'emoji': '⚙️'},
    'MEA': {'name': 'Mechanical Engineering (Automobile)', 'emoji': '🚗'},
    'BT':  {'name': 'Biotechnology', 'emoji': '🧬'},
  };

  // Semesters per year
  static List<String> semsForYear(int year) {
    switch (year) {
      case 1: return ['S1', 'S2'];
      case 2: return ['S3', 'S4'];
      case 3: return ['S5', 'S6'];
      case 4: return ['S7', 'S8'];
      default: return [];
    }
  }

  // ── CSE ──────────────────────────────────────────────────────────
  static const Map<String, List<String>> cseSubjects = {
    'S3': ['Mathematics for Computer & Information Science – 3', 'Theory of Computation', 'Data Structures and Algorithms', 'Object Oriented Programming', 'Digital Electronics and Logic Design', 'Economics for Engineers', 'Engineering Ethics and Sustainable Development', 'Data Structures Lab', 'Digital Lab'],
    'S4': ['Database Management Systems', 'Operating Systems', 'Computer Organization and Architecture', 'Advanced Data Structures', 'Operating Systems Lab', 'DBMS Lab', 'Electives: Software Engineering, Pattern Recognition, Functional Programming, Coding Theory, Signals and Systems, Soft Computing, Computational Geometry, Cyber Ethics, VLSI Design'],
    'S5': ['Computer Networks', 'Design and Analysis of Algorithms', 'Machine Learning', 'Microcontrollers', 'Networks Lab', 'Machine Learning Lab', 'Electives: Software Project Management, Artificial Intelligence, Data Analytics, Data Compression, Digital Signal Processing, Computer Graphics & Multimedia, Advanced Computer Architecture, Data Mining'],
    'S6': ['Compiler Design', 'Advanced Computing Systems', 'Deep Learning', 'Systems Lab', 'Electives: Software Testing, Wireless & Mobile Computing, Advanced Database Systems, Digital Image Processing, Fundamentals of Cryptography, Quantum Computing, Cloud Computing, Mobile Application Development'],
    'S7': ['Formal Methods in Software Engineering', 'Electives: Web Programming, Bioinformatics, Information Security, Embedded Systems, Blockchain, Real Time Systems, Computer Vision, Advanced Computer Networks, Responsible Artificial Intelligence, Cyber Security, Internet of Things, Data Science'],
    'S8': ['Electives: Software Architectures, Natural Language Processing, Topics in Security, Computational Complexity, Speech and Audio Processing, Storage Systems, Prompt Engineering, Web Programming, Software Testing, Internet of Things'],
  };

  // ── ECE ──────────────────────────────────────────────────────────
  static const Map<String, List<String>> eceSubjects = {
    'S3': ['Mathematics for Electrical Science – 3', 'Solid State Devices', 'Analog Circuits', 'Logic Circuit Design', 'Introduction to Artificial Intelligence and Data Science', 'Engineering Economics', 'Engineering Ethics', 'Analog Circuits Lab', 'Logic Circuit Design Lab'],
    'S4': ['Signals and Systems', 'Linear Integrated Circuits', 'Microcontrollers', 'Linear Integrated Circuits Lab', 'Microcontroller Lab', 'Electives: Instrumentation, Power Electronics, Machine Learning, Object Oriented Programming, Digital System Design, VLSI Design'],
    'S5': ['Electromagnetics', 'Analog and Digital Communication', 'Control Systems', 'Digital Signal Processing', 'DSP Lab', 'Communication Lab I', 'Electives: Biomedical Engineering, Data Structures, Sensors and Actuators, ARM Architecture, High Speed Digital Design'],
    'S6': ['Advanced Communication Theory', 'Microwaves & Antennas', 'Computer Networks', 'Communication Lab II', 'Electives: Digital Image Processing, Optical Communication, VLSI Circuit Design, Biomedical Engineering'],
    'S7': ['Advanced Mobile Communication', 'Deep Learning', 'Electives: Robotics, Coding Theory, Advanced DSP, Cryptography, Satellite Communication, Internet of Things, Real Time OS, Speech Processing, Optical Communication'],
    'S8': ['Electives: Wireless Sensor Networks, RF Engineering, Renewable Energy, Cyber Security, Low Power VLSI, Blockchain, Antenna Theory, IoT, Satellite Communication'],
  };

  // ── ME ───────────────────────────────────────────────────────────
  static const Map<String, List<String>> meSubjects = {
    'S3': ['Mathematics for Physical Science – 3', 'Mechanics of Solids', 'Fluid Mechanics and Machinery', 'Manufacturing Processes', 'Introduction to AI and Data Science', 'Economics for Engineers', 'Engineering Ethics', 'Computer Aided Machine Drawing', 'Materials Testing Lab'],
    'S4': ['Machine Tools and Metrology', 'Engineering Thermodynamics', 'Mechanics of Machinery', 'Fluid Mechanics Lab', 'Manufacturing Technology Lab', 'Electives: Turbo Machinery, Nuclear Energy, Composite Materials, Advanced Mechanics of Solids'],
    'S5': ['Dynamics of Machinery', 'Advanced Manufacturing Engineering', 'Heat and Mass Transfer', 'Management for Engineers', 'Mechanical Engineering Lab', 'Electives: CFD, Design for Manufacture, Computer Aided Design, Additive Manufacturing, Operations Research'],
    'S6': ['Industrial and Systems Engineering', 'Machine Design', 'Power Plant Engineering', 'CAD/CAE Lab', 'Electives: Compressible Fluid Flow, Finite Element Methods, Industrial Safety, Additive Manufacturing, Renewable Energy'],
    'S7': ['Gas Turbine and Jet Propulsion', 'Design of Machine Elements', 'Electives: Automobile Engineering, Failure Analysis, Lean Manufacturing, Reliability Engineering, Robotics, Mechatronics, Acoustics, Aerospace Engineering'],
    'S8': ['Electives: Cryogenic Engineering, Pressure Vessel Design, Hybrid Vehicles, Micro and Nano Manufacturing, Nanotechnology, Aircraft Design, Industrial Hydraulics, Product Design and Innovation'],
  };

  // ── MEA ──────────────────────────────────────────────────────────
  static const Map<String, List<String>> meaSubjects = {
    'S3': ['Mathematics for Physical Science – 3', 'Automotive Systems', 'Fluid Mechanics and Machinery', 'Manufacturing Processes', 'Introduction to AI and Data Science', 'Engineering Economics', 'Engineering Ethics', 'Fluid Mechanics Lab', 'Automotive Systems Lab'],
    'S4': ['Mechanics of Solids', 'Thermodynamics and Thermal Systems', 'Automotive Engines and Transmission', 'Materials Testing Lab', 'Manufacturing Technology Lab', 'Electives: Alternative Fuels, Composite Materials, Vehicle Body Engineering, Computer Aided Design'],
    'S5': ['Automotive Electrical & Electronics', 'Heat and Mass Transfer', 'Electric Vehicles Drives and Control', 'Mechanics of Machinery', 'CAD/CAE Lab', 'Thermal Engines Lab', 'Electives: CFD, Automotive Pollution Control, Additive Manufacturing, Instrumentation'],
    'S6': ['Design of Automotive Components', 'Mechatronics', 'Electric and Hybrid Vehicles', 'Electrical Machines Lab', 'Electives: Automotive Embedded Systems, Vehicle Performance, Vehicle Dynamics, Autonomous Vehicles, Alternate Fuels'],
    'S7': ['Hydrogen Engines and Fuel Cell Vehicles', 'Heating Ventilation Air Conditioning', 'Vehicle Safety and Security Systems', 'Electives: Modern Automotive Technologies, Finite Element Analysis, IC Engines, Automotive Aerodynamics, Autonomous Vehicles'],
    'S8': ['Electives: Automotive Navigation, Noise Vibration Harshness, Renewable Energy, Advanced Driver Assistance Systems, Hydrogen Vehicles, Advanced Manufacturing, Automotive Mechatronics'],
  };

  // ── BT ───────────────────────────────────────────────────────────
  static const Map<String, List<String>> btSubjects = {
    'S3': ['Mathematics for Life Science – 3', 'Biochemistry', 'Microbiology', 'Industrial Bioprocess Technology', 'Introduction to AI and Data Science', 'Economics for Engineers', 'Engineering Ethics', 'Biochemistry Lab', 'Microbiology Lab'],
    'S4': ['Molecular Biology', 'Fluid Flow and Particle Technology', 'Elements of Biological Reaction Engineering', 'Plant and Animal Cell Technology', 'Molecular Biology Lab', 'Fluid Flow Lab', 'Electives: Food Process Technology, Bioenergy, Biochemical Thermodynamics, Biomaterials'],
    'S5': ['Heat Transfer Operations', 'Bioprocess Engineering', 'Mass Transfer Operations', 'Enzyme Kinetics & Technology', 'Heat & Mass Transfer Lab', 'Bioprocess Lab', 'Electives: Cancer Biology, Biophysics, Genetic Engineering, Biological Wastewater Treatment'],
    'S6': ['Downstream Processing', 'Process Plant Design', 'Immunology', 'Downstream Processing Lab', 'Electives: Nano Bioengineering, Clinical Research, Biopharmaceutical Technology, Bioinformatics, Food Processing, Quality Control'],
    'S7': ['Synthetic Biology', 'Cell Signaling', 'Computational Biology', 'Patents and IPR', 'Electives: Metabolic Engineering, Developmental Biology, Neurobiology, Cell Culture Techniques, Bioremediation, Proteomics, Next Generation Sequencing'],
    'S8': ['Electives: Cytogenetics, Drug Delivery, Marine Biotechnology, Environmental Biotechnology, Advanced Bio Separation, Nanomaterials, Food Product Design, Waste to Energy Technology'],
  };

  static List<String> getSubjects(String dept, String sem) {
    final map = {
      'CSE': cseSubjects,
      'ECE': eceSubjects,
      'ME': meSubjects,
      'MEA': meaSubjects,
      'BT': btSubjects,
    };
    return map[dept]?[sem] ?? [];
  }

  static List<String> getFirstYearSubjects(String group, String sem) {
    return firstYearSubjects[group]?[sem] ?? [];
  }
}
