export enum TokenType
{
    T_VAR,// = "TokenType.T_VAR",
    G_LPAR,// = "TokenType.G_LPAR",
    G_RPAR,// = "TokenType.G_RPAR",
    L_NEG,// = "TokenType.L_NEG",
    L_CON,// = "TokenType.L_CON",
    L_DIS,// = "TokenType.L_DIS",
    L_XOR,// = "TokenType.L_XOR",
    L_IMP,// = "TokenType.L_IMP",
    L_BIC,// = "TokenType.L_BIC"
}

export class Token
{
    type: TokenType;
    literal: string;

    constructor(type: TokenType, literal: string)
    {
        this.type = type;
        this.literal = literal;
    }

    getPrecedence(): number
    {
        return getPrecedence(this.type);
    }

    isRightAssociative(): boolean
    {
        return false;
    }

    isBinaryOp(): boolean
    {
        switch (this.type)
        {
            case TokenType.L_NEG:
            case TokenType.L_CON:
            case TokenType.L_DIS:
            case TokenType.L_XOR:
            case TokenType.L_IMP:
            case TokenType.L_BIC:
            {
                return true;
            }
        }
        return false;
    }
}

export function getPrecedence(type: TokenType): number
{
    switch (type)
    {
        case TokenType.L_BIC: return 1;
        case TokenType.L_IMP: return 2;
        case TokenType.L_XOR: return 3;
        case TokenType.L_DIS: return 3;
        case TokenType.L_CON: return 4;
        case TokenType.L_NEG: return 5;
    }
    return 0;
}

export function toLatexString(type: TokenType): string | null
{
    switch (type)
    {
        case TokenType.L_NEG: return "\\neg";
        case TokenType.L_CON: return "\\land";
        case TokenType.L_DIS: return "\\lor";
        case TokenType.L_XOR: return "\\oplus";
        case TokenType.L_IMP: return "\\to";
        case TokenType.L_BIC: return "\\leftrightarrow";
    }
    return null;
}

export const LatexOperatorLookup = {
    // L_NEG
    "\\neg": TokenType.L_NEG,
    "\\lnot": TokenType.L_NEG,
    // L_CON
    "\\land": TokenType.L_CON,
    "\\wedge": TokenType.L_CON,
    // L_DIS
    "\\lor": TokenType.L_DIS,
    "\\vee": TokenType.L_DIS,
    // L_XOR
    "\\oplus": TokenType.L_XOR,
    // L_IMP
    "\\implies": TokenType.L_IMP,
    "\\to": TokenType.L_IMP,
    "\\rightarrow": TokenType.L_IMP,
    // L_BIC
    "\\leftrightarrow": TokenType.L_BIC
};