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
