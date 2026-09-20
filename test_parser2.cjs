const fs = require('fs');
let code = fs.readFileSync('test_parser.cjs', 'utf8');

const sample2 = `
1. What is 2 + 2?
(A) 3
(B) 4
(C) 5
(D) 6
ans: B

2) What is the chemical formula for water?
a. H2
b. O2
c. H2O
d. CO2
answer: c
Exp: Water is composed of hydrogen and oxygen in a 2:1 ratio.

Q10. Who discovered gravity?
A) Isaac Newton
B) Albert Einstein
C) Galileo Galilei
D) Nikola Tesla
Answer : A
`;

// Let's run it with sample2
eval(code.replace('const sample = `', 'const sample = sample2; const unused = `'));
