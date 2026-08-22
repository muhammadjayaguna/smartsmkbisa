import fs from 'fs';
import readline from 'readline';

async function recover() {
  const fileStream = fs.createReadStream('C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\c1d4efe5-4e46-469c-acd5-764f520ad8a2\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lines = {};
  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'TOOL_RESPONSE' && data.content) {
        if (data.content.includes('Showing lines') && data.content.includes('manage-siswa')) {
          const contentLines = data.content.split('\n');
          for (const cLine of contentLines) {
            const match = cLine.match(/^(\d+):\s(.*)/);
            if (match) {
              lines[parseInt(match[1])] = match[2];
            }
          }
        }
      }
    } catch (e) {}
  }
  
  const sortedKeys = Object.keys(lines).map(Number).sort((a, b) => a - b);
  let result = '';
  for (const k of sortedKeys) {
    result += lines[k] + '\n';
  }
  
  fs.writeFileSync('C:\\Users\\User\\OneDrive\\Documents\\GitHub\\synapsesmk-dashboard\\app\\manage-siswa\\page.tsx.recovered', result);
  console.log("Recovered", sortedKeys.length, "lines.");
}

recover();
