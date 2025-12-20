// Quick test of the pattern matching
const text = `
Ørsted, Copenhagen | 2020 - Present | Security Specialist
G4S Security | 2018 - 2020 | Security Officer
Securitas | 2015 - 2018 | Security Guard
`;

const pattern1 = /^([^|]+)\s*\|\s*(\d{4}\s*[-–]\s*(?:\d{4}|Present|Nu|Current))\s*\|\s*(.+)$/im;

const lines = text.split('\n');
lines.forEach((line, idx) => {
  const match = line.match(pattern1);
  if (match) {
    console.log(`Line ${idx}: MATCH`);
    console.log(`  Company: ${match[1].trim()}`);
    console.log(`  Dates: ${match[2].trim()}`);
    console.log(`  Role: ${match[3].trim()}`);
  }
});
