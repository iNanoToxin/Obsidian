import {generateTruthTable} from "./truth_table";


const my_expression = "    (\\neg p \\land (q \\to r)) \\to \\neg z    ";


console.log(generateTruthTable(my_expression));