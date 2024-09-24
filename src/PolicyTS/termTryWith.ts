// Copyright (c) Mobile Ownership, mobileownership.org.  All Rights Reserved.  See LICENSE.txt in the project root for license information.

/*
# Try...With Term

Reduce term and catch exceptions

## Syntax
    
    {
        "$policy": "TryWith",
        "term": _term_,
        "rules": _rules_
    }

    {
        "$policy": "Exception",
        "term": _term_
    }

## Example
    
    {
        $policy": "TryWith",
        "term": { "$policy": "Exception", "term": "error"},
        "rules": [
            {
                "$policy": "Rule",
                "pattern": { "$policy": "Lookup", "name": "x" },
                "term": { "$policy": "Lookup", "name": "x" }
            }
        ]
    }

    try 
        throw "error"
    with
    | x -> x

## Schema

    "TryWithTerm": {
        "type": "object",
        "properties": {
            "$policy": {
                "type": "string",
                "const": "TryWith"
            },
            "term": { "$ref": "#/$defs/Term" },
            "rules": {
                "type": "array",
                "items": { "$ref": "#/$defs/Rule" }
            }
        },
        "required": [ "$policy", "term", "rules" ]
    }

*/

import { Machine, MatchResult } from "./machine"
import { matchTerm, rewriteTerm } from "./term";
import { isRule, RuleTerm } from "./termMatch";

export type TryWithTerm = {
    $policy: "TryWith",
    term: any,
    rules: RuleTerm[]
}

export type ExceptionTerm = {
    $policy: "Exception",
    term: any
}

export function isTryWith(term: any): term is TryWithTerm {
    if ((term !== null) &&
        (typeof term === "object") &&
        ("$policy" in term) && (term.$policy === "TryWith") &&
        ("term" in term) &&
        ("rules" in term) && (Array.isArray(term.rules))
    ) {
        for (let i = 0; i < term.rules.length; i++) {
            if (!(isRule(term.rules[i]))) {
                return false;
            }
        }
    }
    return true;
}

export function isException(term: any): term is ExceptionTerm {
    return (term !== null) &&
        (typeof term === "object") &&
        ("$policy" in term) && (term.$policy === "Exception") &&
        ("term" in term) &&
        (Object.keys(term).length === 2);
}

/*
## Rewrite Rules
Evaluate term.
if blocked, return blocked TryWith
If result of term is Exception, 
    lookup for matching rule in term.Rules
    If no rules match, return with Exception
else
    return result of term
*/
export function rewriteTryWith(m: Machine): Machine {
    if (!(isTryWith(m.term))) { throw "expected TryWithTerm"; };
    const resultOfTerm = rewriteTerm(m.copyWith({ term: m.term.term }));
    if (resultOfTerm.blocked) {
        throw "blocked";
    } else {
        if (isException(resultOfTerm.term)) {
            for (let i = 0; i < m.term.rules.length; i++) {
                const rule = m.term.rules[i];
                const matchResult = matchTerm(m, rule.pattern, resultOfTerm.term);
                if (matchResult !== false) {
                    const bindings = Object.assign({}, m.bindings, matchResult);
                    let guardPassed = true;
                    if ("guard" in rule) {
                        const resultOfGuard = rewriteTerm(m.copyWith({ term: rule.guard, bindings: bindings }));
                        if (resultOfGuard.blocked) {
                            // to do, return a blocked match term
                            throw "guard blocked"
                        } else if (typeof resultOfGuard.term !== "boolean") {
                            throw "guard not boolean"
                        } else {
                            guardPassed = resultOfGuard.term;
                        }
                    }
                    if (guardPassed) {
                        const resultOfRule = rewriteTerm(m.copyWith({ term: rule.term, bindings: bindings }));
                        return m.copyWith({ term: resultOfRule.term });
                    }
                }
            }
        }
        return resultOfTerm;
    }
}

export function rewriteException(m: Machine): Machine {
    if (!(isException(m.term))) { throw "expected ExceptionTerm"; };
    return m;
}

/*
## Match Rules


*/
export function matchTryWith(pattern: any, value: any): MatchResult {
    if (!(isTryWith(pattern))) { throw "expected TryWith"; };
    // to do
    return false;
}

export function matchException(pattern: any, value: any): MatchResult {
    if (!(isException(pattern))) { throw "expected Exception"; };
    // to do
    return false;
}