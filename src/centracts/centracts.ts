import safeEvalExpression from "./ifeval";

type Scope = {
    code: string,
    event: CentractEvent
}

const CentractEventTypes = ["timeout", "clctx", "ethtx"] as const;
const CentractEventArgsLength = {
    timeout: 1,
    clctx: 1,
    ethtx: 1
}
type CentractEventType = (typeof CentractEventTypes)[number];

type CentractEvent = {
    type: CentractEventType,
    args: Array<string>
}

const CentractCallTypes = ["resolve", "abort", "abortif", "resolveif", "exitif"] as const;
const CentractCallTypesArgsLength = {
    resolve: 0,
    abort: 0,
    abortif: 1,
    resolveif: 1,
    exitif: 1
}
type CentractCallType = (typeof CentractCallTypes)[number];

function executeScope(scope: Scope, scopeGlobals: Record<string, string>) {
    let code = scope.code;
    for (const key in scopeGlobals) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedKey, 'g');
        code = code.replace(regex, scopeGlobals[key]);
    }

    for (const line of code.split("\n")) {
        if (line.split(" ")[0] === "resolve") return "resolve";
        else if (line.split(" ")[0] === "abort") return "abort";
        else if (line.split(" ")[0] === "abortif") {
            const exp = line.split(" ")[1];
            if (safeEvalExpression(exp)) return "abort";
        } else if (line.split(" ")[0] === "resolveif") {
            const exp = line.split(" ")[1];
            if (safeEvalExpression(exp)) return "resolve";
        } else if (line.split(" ")[0] === "exitif") {
            const exp = line.split(" ")[1];
            if (safeEvalExpression(exp)) return "exit";
        }
    }
    return "exit"
}

function verify(centract: string) {
    const scopes = scopeCode(centract);
    let foundTimeoutScope = false;
    for (const scope of scopes) {
        if (scope.event.type === "timeout") {
            if (parseInt(scope.event.args[0]) > Date.now() + 259200000) throw new Error("All timeouts must finish in 3 days");
            const code = scope.code;
            if (!code.includes("exitif")) foundTimeoutScope = true;
        }
    }

    if (!foundTimeoutScope) throw new Error("Centract must contain at least 1 timeout scope that does not contain an exitif call");

    return scopes;
}

function scopeCode(centract: string) {
    const scopes: Array<Scope> = [];
    let currentScope: Scope | null = null;

    let i = 1;
    for (const line of centract.trim().split("\n")) {
        if (line.split(".").length > 1 && isCentractEventType(line.split(".")[1].split(" ")[0])) {
            if (currentScope !== null) {
                currentScope.code = currentScope.code.trim();
                scopes.push(currentScope);
                currentScope = null;
            }
            const eventType = line.split(".")[1].split(" ")[0] as CentractEventType;
            if (CentractEventArgsLength[eventType] === 0) currentScope = { code: "", event: { type: eventType, args: [] } };
            else {
                const args = line.split(" ").slice(1);
                if (args.length !== CentractEventArgsLength[eventType]) throw new Error("Event at line " + i + " has an invalid number of arguments (got " + args.length + ", expected " + CentractEventArgsLength[eventType] + ")");
                currentScope = { code: "", event: { type: eventType, args } };
            }
        } else if (line.startsWith(" ") && currentScope !== null) {
            const call = line.replace(" ", "");
            if (!CentractCallTypes.includes(call.split(" ")[0] as CentractCallType)) throw new Error("Call at line " + i + " is invalid.");
            if (CentractCallTypesArgsLength[call.split(" ")[0] as CentractCallType] !== call.split(" ").slice(1).length) throw new Error("Call at line " + i + " has an invalid amount of arguments (got " + call.split(" ").slice(1).length + ", expected " + CentractCallTypesArgsLength[call.split(" ")[0] as CentractCallType] + ")");
            currentScope.code += call + "\n";
        } else {
            throw new Error("Code at line " + i + " is out of any event-scope");
        }
        i++;
    }

    if (currentScope !== null) {
        currentScope.code = currentScope.code.trim();
        scopes.push(currentScope);
    }

    return scopes;
}

function isCentractEventType(value: string): value is CentractEventType {
    return CentractEventTypes.includes(value as CentractEventType);
}

export { verify, scopeCode, executeScope, CentractEvent };