export interface ParsedQuestion {
  id?: number;
  question_order: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation?: string | null;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  errors: string[];
  warnings: string[];
}

/**
 * Robust parser for bulk questions input.
 * Supports English, Hindi Unicode, varied question numbering (Q1., 1., Question 1),
 * flexible option markers (A., (A), A)), answers (Answer: A, Ans: A, उत्तर: A),
 * and explanations (Explanation: ..., Exp: ..., व्याख्या: ...).
 */
export function parseBulkQuestions(rawText: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const questions: ParsedQuestion[] = [];

  if (!rawText || !rawText.trim()) {
    return {
      questions: [],
      errors: ['Question input is empty. Please paste your questions formatted with Q1., options A/B/C/D, and Answer.'],
      warnings: []
    };
  }

  // Normalize line breaks
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  // Regex patterns
  // Matches explicit question markers: "Q1.", "Q 1.", "Q1)", "Q.1", "Question 1:", "प्रश्न 1:"
  const qExplicitRegex = /^\s*(?:Q|Question|प्रश्न)[\s\.\:\-]*(\d+)[\.\)\:\-\s]\s*(.*)$/i;

  // Matches bare number question markers: "1.", "1)", "1:", "1-", "(1)"
  // Requires explicit delimiter punctuation and prevents false boundaries on decimals (0.8) or unit numbers (80, 300)
  const qBareRegex = /^\s*(?:(?:\((\d+)\)|(\d+)[\)\:\-])|(\d+)\.(?!\d))\s+(.*)$/;

  // Matches option markers: "A.", "A)", "(A)", "[A]", "a.", "a)", "(a)", "A:"
  const optRegex = /^\s*(?:\(?([A-Da-d])\)|\(?([A-Da-d])[\.\:\]\-])\s*(.*)$/;

  // Matches answer markers: "Answer: A", "Ans: A", "Answer: (A)", "उत्तर: A", "Correct Answer: B"
  const ansRegex = /^\s*(?:Answer|Ans|Correct\s*Answer|Correct\s*Option|उत्तर)\s*[\:\-\=]\s*(?:Option\s*)?\(?([A-Da-d])\)?/i;

  // Matches explanation markers: "Explanation: ...", "Exp: ...", "Solution: ...", "व्याख्या: ...", "हल: ..."
  const expRegex = /^\s*(?:Explanation|Exp|Solution|व्याख्या|हल)\s*[\:\-\=]\s*(.*)$/i;

  interface TempQuestion {
    parsedNumber?: number;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    explanation: string;
    startLine: number;
    hasExplicitPrefix?: boolean;
  }

  let currentQ: TempQuestion | null = null;
  let currentField: 'question' | 'A' | 'B' | 'C' | 'D' | 'explanation' | 'none' = 'none';

  function finalizeQuestion(q: TempQuestion, index: number) {
    const qNum = q.parsedNumber !== undefined ? q.parsedNumber : index + 1;
    const missing: string[] = [];

    const text = q.question_text.trim();
    const optA = q.option_a.trim();
    const optB = q.option_b.trim();
    const optC = q.option_c.trim();
    const optD = q.option_d.trim();
    const ans = (q.correct_option || '').trim().toUpperCase();

    if (!text) missing.push('question text');
    if (!optA) missing.push('Option A');
    if (!optB) missing.push('Option B');
    if (!optC) missing.push('Option C');
    if (!optD) missing.push('Option D');
    if (!ans || !['A', 'B', 'C', 'D'].includes(ans)) missing.push('valid Answer (A, B, C, or D)');

    if (missing.length > 0) {
      errors.push(`Question ${qNum} is incomplete: ${missing.join(', ')} is missing.`);
      return;
    }

    // Check duplicate options
    const options = [optA, optB, optC, optD];
    const uniqueOptions = new Set(options);
    if (uniqueOptions.size < 4) {
      warnings.push(`Question ${qNum} contains identical/duplicate option texts.`);
    }

    questions.push({
      question_order: questions.length + 1,
      question_text: text,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_option: ans as 'A' | 'B' | 'C' | 'D',
      explanation: q.explanation.trim() ? q.explanation.trim() : null
    });
  }

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const trimmed = line.trim();

    if (!trimmed) {
      // Empty line can reset field continuation
      if (currentField !== 'none' && currentField !== 'question') {
        // continue
      }
      continue;
    }

    // Check if new question starts
    const isOptionLine = line.match(optRegex);
    const isAnswerLine = line.match(ansRegex);
    const isExpLine = line.match(expRegex);

    if (!isOptionLine && !isAnswerLine && !isExpLine) {
      const explicitMatch = line.match(qExplicitRegex);
      const bareMatch = line.match(qBareRegex);

      let isNewQ = false;
      let qNum = NaN;
      let qText = '';
      let isExplicit = false;

      if (explicitMatch) {
        isNewQ = true;
        qNum = parseInt(explicitMatch[1], 10);
        qText = explicitMatch[2] ? explicitMatch[2].trim() : '';
        isExplicit = true;
      } else if (bareMatch) {
        const num = parseInt(bareMatch[1] || bareMatch[2] || bareMatch[3], 10);
        const text = bareMatch[4] ? bareMatch[4].trim() : '';

        if (!currentQ) {
          isNewQ = true;
          qNum = num;
          qText = text;
        } else if (currentField !== 'question') {
          // If options/answer already seen, bare number signifies next question
          isNewQ = true;
          qNum = num;
          qText = text;
        } else {
          // Still in question body before options:
          // If current question uses explicit prefix (Q14), bare numbers (1., 2.) are matching list items, not questions.
          // If current question uses bare numbers, numbers <= current question number or list items before options are not new questions.
          if (currentQ.hasExplicitPrefix) {
            isNewQ = false;
          } else if (num <= (currentQ.parsedNumber ?? 0)) {
            isNewQ = false;
          } else {
            // Check lookahead: if options appear ahead before another question, this is a numbered sub-list
            let hasOptionsAhead = false;
            for (let j = lineIdx + 1; j < lines.length; j++) {
              if (lines[j].match(optRegex)) {
                hasOptionsAhead = true;
                break;
              }
              if (lines[j].match(qExplicitRegex)) break;
            }
            if (hasOptionsAhead) {
              isNewQ = false;
            } else {
              isNewQ = true;
              qNum = num;
              qText = text;
            }
          }
        }
      }

      if (isNewQ) {
        if (currentQ) {
          finalizeQuestion(currentQ, questions.length);
        }
        currentQ = {
          parsedNumber: isNaN(qNum) ? questions.length + 1 : qNum,
          question_text: qText,
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_option: '',
          explanation: '',
          startLine: lineIdx + 1,
          hasExplicitPrefix: isExplicit
        };
        currentField = 'question';
        continue;
      }
    }

    if (!currentQ) {
      // If we see an option without question start, create an implicit question
      if (isOptionLine) {
        currentQ = {
          parsedNumber: questions.length + 1,
          question_text: 'Question ' + (questions.length + 1),
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_option: '',
          explanation: '',
          startLine: lineIdx + 1
        };
      } else {
        // Stray introductory text before first question - ignore or collect
        continue;
      }
    }

    // Check explanation line
    if (isExpLine) {
      currentQ.explanation = isExpLine[1] ? isExpLine[1].trim() : '';
      currentField = 'explanation';
      continue;
    }

    // Check answer line
    if (isAnswerLine) {
      currentQ.correct_option = isAnswerLine[1].toUpperCase();
      currentField = 'none';
      continue;
    }

    // Check option line
    if (isOptionLine) {
      const letter = (isOptionLine[1] || isOptionLine[2]).toUpperCase();
      const content = isOptionLine[3] ? isOptionLine[3].trim() : '';

      if (letter === 'A') {
        currentQ.option_a = content;
        currentField = 'A';
      } else if (letter === 'B') {
        currentQ.option_b = content;
        currentField = 'B';
      } else if (letter === 'C') {
        currentQ.option_c = content;
        currentField = 'C';
      } else if (letter === 'D') {
        currentQ.option_d = content;
        currentField = 'D';
      }
      continue;
    }

    // Multi-line continuation of current field
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

  if (currentQ) {
    finalizeQuestion(currentQ, questions.length);
  }

  if (questions.length === 0 && errors.length === 0) {
    errors.push('No valid questions could be detected. Please check the numbering and option formatting.');
  }

  return { questions, errors, warnings };
}

export const SAMPLE_QUESTIONS_TEMPLATE = `Q1. भारत का संविधान किस तिथि को पूर्ण रूप से लागू हुआ था?
A. 15 अगस्त 1947
B. 26 जनवरी 1950
C. 26 नवंबर 1949
D. 30 जनवरी 1948
Answer: B
Explanation: भारतीय संविधान 26 नवंबर 1949 को अंगीकृत किया गया था और 26 जनवरी 1950 को पूर्ण रूप से लागू हुआ।

Q2. Which planet in our solar system is known as the "Red Planet"?
A. Venus
B. Jupiter
C. Mars
D. Mercury
Answer: C
Explanation: Mars is called the Red Planet because iron minerals in its soil oxidize (rust), giving the surface a reddish appearance.

Q3. यदि किसी वस्तु का क्रय मूल्य ₹500 है और उसे ₹600 में बेचा जाता है, तो लाभ प्रतिशत क्या होगा?
A. 15%
B. 20%
C. 25%
D. 10%
Answer: B
Explanation: लाभ = 600 - 500 = ₹100। लाभ % = (100 / 500) × 100 = 20%।`;
