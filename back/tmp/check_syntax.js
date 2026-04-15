
const fs = require('fs');
const content = fs.readFileSync('front/app/admin/roles/page.tsx', 'utf8');

function checkBrackets(str) {
    const stack = [];
    const open = ['(', '{', '[', '<'];
    const close = [')', '}', ']', '>'];
    
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (open.includes(char)) {
            stack.push({ char, line: str.substring(0, i).split('\n').length });
        } else if (close.includes(char)) {
            const last = stack.pop();
            const expected = open[close.indexOf(char)];
            if (!last || last.char !== expected) {
                console.log(`Mismatch: found ${char} on line ${str.substring(0, i).split('\n').length}, expected matching ${expected} for ${last?.char} from line ${last?.line}`);
                return false;
            }
        }
    }
    if (stack.length > 0) {
        console.log(`Unclosed: ${stack.map(s => `${s.char} (line ${s.line})`).join(', ')}`);
        return false;
    }
    return true;
}

// Simple check only for (), {}, []
function checkPairs(str) {
    const stack = [];
    const map = { '(': ')', '{': '}', '[': ']' };
    const lines = str.split('\n');
    for (let l = 0; l < lines.length; l++) {
        const line = lines[l];
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (map[char]) stack.push({ char, line: l + 1 });
            else if (Object.values(map).includes(char)) {
                const last = stack.pop();
                if (!last || map[last.char] !== char) {
                    console.log(`Mismatch: ${char} on line ${l + 1}, expected matching for ${last?.char} from line ${last?.line}`);
                    // return false;
                }
            }
        }
    }
    if (stack.length > 0) {
         console.log(`Unclosed: ${stack.map(s => `${s.char} (line ${s.line})`).join(', ')}`);
    }
}

checkPairs(content);
