export function tokenize(text: string): string[] {
	const tokens: string[] = []
	let token = ''
	if (typeof text !== 'string') {
		return tokens
	}

	for (let i = 0; i < text.length; i++) {
		const char = text[i]
		if (!/[a-zA-Z\u0080-\uFFFF'-\.,0-9]/.test(char)) {
			if (token !== '') {
				tokens.push(token)
				token = ''
			}
			tokens.push(char)
		} else {
			token += char
		}
	}

	if (token !== '') {
		tokens.push(token)
	}

	return tokens
}
