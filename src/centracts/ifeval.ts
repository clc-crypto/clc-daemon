import jsep, { Expression } from 'jsep';

const operators: Record<string, (a: any, b: any) => any> = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '%': (a, b) => a % b,
    '>': (a, b) => a > b,
    '<': (a, b) => a < b,
    '>=': (a, b) => a >= b,
    '<=': (a, b) => a <= b,
    '==': (a, b) => a == b,
    '!=': (a, b) => a != b,
    '===': (a, b) => a === b,
    '!==': (a, b) => a !== b,
    '&&': (a, b) => a && b,
    '||': (a, b) => a || b,
};

function evaluate(node: any): any {
    switch (node.type) {
        case 'Literal':
            return node.value;

        case 'BinaryExpression': {
            const left = evaluate(node.left);
            const right = evaluate(node.right);
            const op = node.operator;
            if (!(op in operators)) {
                throw new Error(`Operator ${op} is not supported`);
            }
            return operators[op](left, right);
        }

        case 'LogicalExpression': {
            const left = evaluate(node.left);
            const right = evaluate(node.right);
            const op = node.operator;
            if (!(op in operators)) {
                throw new Error(`Operator ${op} is not supported`);
            }
            return operators[op](left, right);
        }

        case 'UnaryExpression': {
            const arg = evaluate(node.argument);
            switch (node.operator) {
                case '-': return -arg;
                case '+': return +arg;
                case '!': return !arg;
                default: throw new Error(`Unary operator ${node.operator} not supported`);
            }
        }

        case 'Identifier':
            throw new Error(`Variables are not supported`);

        default:
            throw new Error(`Expression type ${node.type} is not supported`);
    }
}

export default function safeEvalExpression(expr: string): boolean {
    const ast = jsep(expr);
    const result = evaluate(ast);
    return !!result;  // force boolean
}
