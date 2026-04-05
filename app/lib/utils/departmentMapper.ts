export function getDepartmentFromRollNumber(rollNumber: string | null | undefined): string {
    if (!rollNumber) return 'Other';
    const upperRoll = rollNumber.toUpperCase().trim();

    if (upperRoll.includes('CS') || upperRoll.includes('COMPUTER')) return 'CSE';
    if (upperRoll.includes('ECE') || upperRoll.includes('ELECTRONICS') || upperRoll.includes('EC')) return 'ECE';
    if (upperRoll.includes('BT') || upperRoll.includes('BIO')) return 'BT';

    if (upperRoll.includes('AU') || upperRoll.includes('AUTO') || upperRoll.includes('MEA')) return 'MEA';
    if (upperRoll.includes('ME') || upperRoll.includes('MECHANICAL')) return 'ME';

    return 'Other';
}

/** Maps detected department to First Year group (A/B/C/D). */
export function getGroupFromDepartment(dept: string): string {
    switch (dept.toUpperCase()) {
        case 'CSE':
        case 'IT':  return 'A';
        case 'ECE':
        case 'EEE': return 'B';
        case 'ME':
        case 'MEA':
        case 'CIVIL': return 'C';
        case 'BT':
        case 'FT':  return 'D';
        default:    return 'A'; // fallback
    }
}

