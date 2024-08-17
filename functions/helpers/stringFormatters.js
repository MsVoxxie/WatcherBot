function trimString(str, max) {
	return str.length > max ? `${str.slice(0, max - 3)}...` : str;
}

function upperFirst(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function urlToMarkdown(string) {
	const urlRegex = new RegExp(/(https?:\/\/[^\s]+)/g);
	if (!urlRegex.test(string)) return string;
	return string.replace(urlRegex, `[LINK]($1)`);
}

function removeUrl(string) {
	const urlRegex = new RegExp(/(https?:\/\/[^\s]+)/g);
	if (!urlRegex.test(string)) return string;
	return string.replace(urlRegex, '');
}

function cleanDiscordMarkdown(string) {
	return string.replace(/([`~*_|])/g, '');
}

module.exports = {
	upperFirst,
	trimString,
	urlToMarkdown,
	removeUrl,
	cleanDiscordMarkdown,
};
