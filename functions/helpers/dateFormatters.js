const moment = require('moment');

// Timestamps
function dateToShortTime(date) {
	return moment(date).format('h:mm A');
}

function dateToLongDate(date) {
	return moment(date).format('MMMM Do YYYY, h:mm A');
}

function dateToShortDate(date) {
	return moment(date).format('MMMM Do YYYY');
}

function dateToRelative(date) {
	return `<t:${Math.floor(date / 1000)}:R>`;
}

module.exports = {
	dateToShortTime,
	dateToLongDate,
	dateToShortDate,
	dateToRelative,
};
