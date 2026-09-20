function parseBulkQuestions(rawText) {
  const errors = [];
  const questions = [];

  if (!rawText || !rawText.trim()) {
    return { questions: [], errors: ['Question text is empty.'] };
  }

  // Normalize line breaks
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  // Regexes
  // Question start: Q1., Q1), Q.1, 1., 1), Question 1:, etc.
  const qStartRegex = /^(?:Q(?:uestion)?[\s\.\:]*(\d+)[\.\)\:\s]|(\d+)[\.\)\:\s])\s*(.*)$/i;
  
  // Option start: A., A), (A), [A], a., etc.
  const optRegex = /^\s*(?:\(?([A-Da-d])\)|\(?([A-Da-d])[\.\:\]])\s*(.*)$/;
  
  // Answer: Answer: A, Ans: A, उत्तर: A, etc.
  const ansRegex = /^\s*(?:Answer|Ans|Correct\s*Answer|उत्तर)\s*[\:\-]\s*\(?([A-Da-d])\)?/i;
  
  // Explanation: Explanation: ..., Exp: ..., व्याख्या: ...
  const expRegex = /^\s*(?:Explanation|Exp|Solution|व्याख्या|हल)\s*[\:\-]\s*(.*)$/i;

  let currentQ = null;
  let currentField = null; // 'question', 'A', 'B', 'C', 'D', 'explanation'

  function finalizeQuestion(q, index) {
    if (!q) return;
    const qNum = q.parsedNumber || index + 1;
    const missing = [];
    if (!q.question_text || !q.question_text.trim()) missing.push('question text is missing');
    if (!q.option_a || !q.option_a.trim()) missing.push('option A is missing');
    if (!q.option_b || !q.option_b.trim()) missing.push('option B is missing');
    if (!q.option_c || !q.option_c.trim()) missing.push('option C is missing');
    if (!q.option_d || !q.option_d.trim()) missing.push('option D is missing');
    if (!q.correct_option) missing.push('correct answer (A/B/C/D) is missing');

    if (missing.length > 0) {
      errors.push(`Question ${qNum} is incomplete: ${missing.join(', ')}.`);
    } else {
      questions.push({
        question_order: questions.length + 1,
        question_text: q.question_text.trim(),
        option_a: q.option_a.trim(),
        option_b: q.option_b.trim(),
        option_c: q.option_c.trim(),
        option_d: q.option_d.trim(),
        correct_option: q.correct_option.toUpperCase(),
        explanation: (q.explanation || '').trim() || null
      });
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if new question start
    const qMatch = line.match(qStartRegex);
    // Also guard: don't match if it's an option like "A. ..." or answer
    if (qMatch && !line.match(optRegex) && !line.match(ansRegex) && !line.match(expRegex)) {
      if (currentQ) {
        finalizeQuestion(currentQ, questions.length);
      }
      const num = parseInt(qMatch[1] || qMatch[2], 10);
      currentQ = {
        parsedNumber: num,
        question_text: qMatch[3] ? qMatch[3].trim() : '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: '',
        explanation: ''
      };
      currentField = 'question';
      continue;
    }

    if (!currentQ) {
      // If lines before first question start, ignore empty or report error
      if (trimmed) {
        // Maybe the first question doesn't have Q1. prefix?
        // Let's check if it has A. on subsequent lines
      }
      continue;
    }

    // Check explanation
    const expMatch = line.match(expRegex);
    if (expMatch) {
      currentQ.explanation = expMatch[1] ? expMatch[1].trim() : '';
      currentField = 'explanation';
      continue;
    }

    // Check answer
    const ansMatch = line.match(ansRegex);
    if (ansMatch) {
      currentQ.correct_option = ansMatch[1].toUpperCase();
      currentField = 'answer';
      continue;
    }

    // Check option
    const optMatch = line.match(optRegex);
    if (optMatch) {
      const optLetter = (optMatch[1] || optMatch[2]).toUpperCase();
      const optText = optMatch[3] ? optMatch[3].trim() : '';
      if (optLetter === 'A') { currentQ.option_a = optText; currentField = 'A'; }
      else if (optLetter === 'B') { currentQ.option_b = optText; currentField = 'B'; }
      else if (optLetter === 'C') { currentQ.option_c = optText; currentField = 'C'; }
      else if (optLetter === 'D') { currentQ.option_d = optText; currentField = 'D'; }
      continue;
    }

    // Multiline continuation
    if (trimmed) {
      if (currentField === 'question') {
        currentQ.question_text += (currentQ.question_text ? '\n' : '') + trimmed;
      } else if (currentField === 'A') {
        currentQ.option_a += ' ' + trimmed;
      } else if (currentField === 'B') {
        currentQ.option_b += ' ' + trimmed;
      } else if (currentField === 'C') {
        currentQ.option_c += ' ' + trimmed;
      } else if (currentField === 'D') {
        currentQ.option_d += ' ' + trimmed;
      } else if (currentField === 'explanation') {
        currentQ.explanation += (currentQ.explanation ? '\n' : '') + trimmed;
      }
    }
  }

  if (currentQ) {
    finalizeQuestion(currentQ, questions.length);
  }

  return { questions, errors };
}

// Test with sample input
const sample = `
Q1. भारत का संविधान कब लागू हुआ?
A. 15 अगस्त 1947
B. 26 जनवरी 1950
C. 26 नवंबर 1949
D. 2 अक्टूबर 1950
Answer: B

Q2. भारत की राजधानी क्या है?
A. मुंबई
B. कोलकाता
C. नई दिल्ली
D. चेन्नई
Answer: C
Explanation: नई दिल्ली 1911 में भारत की राजधानी बनी।

Q3. Incomplete question
A. Opt 1
B. Opt 2
Answer: A
`;

const res = parseBulkQuestions(sample);
console.log("Parsed count:", res.questions.length);
console.log("Errors:", res.errors);
console.log("Q1:", res.questions[0]);
console.log("Q2:", res.questions[1]);
