let rows = [];
let columns = [];
let preparedRows = [];

self.onmessage = (event) => {
  const { type, payload } = event.data;
  switch (type) {
    case 'init':
      initialize(payload.rows, payload.columns);
      break;
    case 'search':
      runSearch(payload.query, payload.options);
      break;
    default:
      break;
  }
};

function initialize(dataRows, headerColumns) {
  rows = dataRows || [];
  columns = headerColumns || [];
  preparedRows = rows.map((row) =>
    columns.map((column) => formatCell(row[column]))
  );
  self.postMessage({ type: 'ready' });
}

function runSearch(query, options = {}) {
  if (!query) {
    self.postMessage({
      type: 'searchResult',
      payload: { rows, duration: 0 },
    });
    return;
  }

  const start = performance.now();
  const tokens = tokenize(query);
  if (!tokens.length) {
    self.postMessage({ type: 'error', payload: { message: 'Requête vide ou invalide.' } });
    return;
  }

  try {
    const expression = insertImplicitOperators(tokens);
    const postfix = toPostfix(expression);
    const matches = [];

    for (let i = 0; i < preparedRows.length; i += 1) {
      const values = preparedRows[i];
      if (evaluatePostfix(postfix, values, options)) {
        matches.push(rows[i]);
      }
    }

    const duration = performance.now() - start;
    self.postMessage({
      type: 'searchResult',
      payload: { rows: matches, duration },
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: { message: `Erreur dans la requête : ${error.message}` },
    });
  }
}

function formatCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function tokenize(query) {
  const sanitized = query.replace(/,/g, ' ');
  const regex = /"([^"]+)"|\(|\)|AND|OR|NOT|[^\s()]+/gi;
  const tokens = [];
  let match;
  while ((match = regex.exec(sanitized)) !== null) {
    const [token, quoted] = match;
    if (quoted !== undefined) {
      tokens.push({ type: 'operand', value: quoted });
    } else if (/^\($/.test(token)) {
      tokens.push({ type: 'lparen', value: '(' });
    } else if (/^\)$/.test(token)) {
      tokens.push({ type: 'rparen', value: ')' });
    } else if (/^AND$/i.test(token)) {
      tokens.push({ type: 'operator', value: 'AND' });
    } else if (/^OR$/i.test(token)) {
      tokens.push({ type: 'operator', value: 'OR' });
    } else if (/^NOT$/i.test(token)) {
      tokens.push({ type: 'operator', value: 'NOT' });
    } else {
      tokens.push({ type: 'operand', value: token });
    }
  }
  return tokens;
}

function insertImplicitOperators(tokens) {
  if (!tokens.length) return [];
  const result = [tokens[0]];
  for (let i = 1; i < tokens.length; i += 1) {
    const prev = result[result.length - 1];
    const current = tokens[i];
    const needsAnd =
      (isOperand(prev) || prev.type === 'rparen') &&
      (isOperand(current) || current.type === 'lparen');
    if (needsAnd) {
      result.push({ type: 'operator', value: 'AND' });
    }
    result.push(current);
  }
  return result;
}

function toPostfix(tokens) {
  const output = [];
  const operators = [];
  const precedence = { NOT: 3, AND: 2, OR: 1 };

  for (const token of tokens) {
    if (isOperand(token)) {
      output.push(token);
    } else if (token.type === 'operator') {
      if (token.value === 'NOT') {
        while (operators.length && operators[operators.length - 1].value === 'NOT') {
          output.push(operators.pop());
        }
      } else {
        while (
          operators.length &&
          operators[operators.length - 1].type === 'operator' &&
          precedence[operators[operators.length - 1].value] >= precedence[token.value]
        ) {
          output.push(operators.pop());
        }
      }
      operators.push(token);
    } else if (token.type === 'lparen') {
      operators.push(token);
    } else if (token.type === 'rparen') {
      let found = false;
      while (operators.length) {
        const op = operators.pop();
        if (op.type === 'lparen') {
          found = true;
          break;
        }
        output.push(op);
      }
      if (!found) {
        throw new Error('Parenthèses déséquilibrées.');
      }
    }
  }

  while (operators.length) {
    const op = operators.pop();
    if (op.type === 'lparen' || op.type === 'rparen') {
      throw new Error('Parenthèses déséquilibrées.');
    }
    output.push(op);
  }

  return output;
}

function evaluatePostfix(postfix, values, options) {
  const stack = [];
  for (const token of postfix) {
    if (isOperand(token)) {
      stack.push(matches(values, token.value, options));
    } else if (token.type === 'operator') {
      if (token.value === 'NOT') {
        if (!stack.length) throw new Error('Opérateur NOT invalide.');
        stack.push(!stack.pop());
      } else {
        if (stack.length < 2) throw new Error(`Opérateur ${token.value} invalide.`);
        const right = stack.pop();
        const left = stack.pop();
        if (token.value === 'AND') {
          stack.push(left && right);
        } else if (token.value === 'OR') {
          stack.push(left || right);
        }
      }
    }
  }
  if (stack.length !== 1) {
    throw new Error('Expression booléenne invalide.');
  }
  return stack.pop();
}

function matches(values, keyword, { caseSensitive = false, exactMatch = false } = {}) {
  keyword = (keyword ?? '').trim();
  if (!keyword) {
    return false;
  }
  if (!caseSensitive) {
    keyword = keyword.toLocaleLowerCase();
  }
  for (const value of values) {
    const candidate = caseSensitive ? value : value.toLocaleLowerCase();
    if (exactMatch) {
      if (candidate === keyword) {
        return true;
      }
    } else if (candidate.includes(keyword)) {
      return true;
    }
  }
  return false;
}

function isOperand(token) {
  return token && token.type === 'operand';
}
