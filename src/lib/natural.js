import natural from "natural";

const tokenizer = new natural.WordTokenizer();

export const tokenize = tokenizer.tokenize.bind(tokenizer);
export const stem = natural.PorterStemmer.tokenizeAndStem;
