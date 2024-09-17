export enum TokenType
{
    /*// Variables
    T_VAR,
    // Grammar
    G_LPAR,
    G_RPAR,
    // Logical Operators
    L_NEG = "\\neg",
    L_CON = "\\land",
    L_DIS = "\\lor",
    L_XOR = "\\oplus",
    L_IMP = "\\to",
    L_BIC = "\\leftrightarrow",*/

    T_VAR = "TokenType.T_VAR",
    G_LPAR = "TokenType.G_LPAR",
    G_RPAR = "TokenType.G_RPAR",
    L_NEG = "TokenType.L_NEG",
    L_CON = "TokenType.L_CON",
    L_DIS = "TokenType.L_DIS",
    L_XOR = "TokenType.L_XOR",
    L_IMP = "TokenType.L_IMP",
    L_BIC = "TokenType.L_BIC"
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

const LatexOperatorLookup = {
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

const LatexOperatorPrecedenceLookup = {
    [TokenType.L_BIC]: 1,
    [TokenType.L_IMP]: 2,
    [TokenType.L_XOR]: 3,
    [TokenType.L_DIS]: 3,
    [TokenType.L_CON]: 4,
    [TokenType.L_NEG]: 5
};

export function tokenize(input: string): Token[] | null
{
    let tokens: Token[] = [];
    let pos = 0;

    while (pos < input.length)
    {
        switch (input[pos])
        {
            case "\\":
            {
                for (const [operator, type] of Object.entries(LatexOperatorLookup))
                {
                    if (input.startsWith(operator, pos))
                    {
                        tokens.push(new Token(type, operator));
                        pos += operator.length;
                        break;
                    }
                }
                break;
            }

            case "(":
            {
                tokens.push(new Token(TokenType.G_LPAR, "("));
                pos++;
                break;
            }
            case ")":
            {
                tokens.push(new Token(TokenType.G_RPAR, ")"));
                pos++;
                break;
            }
            case " ":
            {
                pos++;
                break;
            }

            default:
            {
                let regex = new RegExp("[a-zA-Z]+", "y");
                regex.lastIndex = pos;

                const match = regex.exec(input);
                if (match)
                {
                    tokens.push(new Token(TokenType.T_VAR, match[0]));
                    pos += match[0].length;
                    break;
                }

                console.log(`ILLEGAL CHAR: ${input[pos]}`);
                return null;
            }
        }
    }
    return tokens;
}

export function getPrecedence(type: TokenType): number
{
    // @ts-ignore
    return LatexOperatorPrecedenceLookup[type];
}