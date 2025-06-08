// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]
const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;
const jeopardyBoard = $("#jeopardy");
let categories = [];


/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

function getCategoryIds(catIds) {
    let randomIds = _.sampleSize(catIds.data, NUM_CATEGORIES);
    let categoryIds = [];
    for (cat of randomIds) {
        categoryIds.push(cat.id)
    }
    return categoryIds;
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

 function getCategory(catId) {
	let cat = catId.data;
	// gets the amount of questions needed from the category
	let clues = _.sampleSize(cat, NUM_QUESTIONS_PER_CAT);
	// gets titles from categories
	let catData = {
		title: cat[0].category.title,
		clues: []
	};
	// gets questions and answers from categories
	clues.map((arr) => {
		let cluesArr = {
			question: arr.question,
			answer: arr.answer,
			showing: null
		};
		catData.clues.push(cluesArr);
	});
	// pushes data into categories array
	categories.push(catData);
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

 function fillTable() {
	let titles = categories.map((title) => title.title);
	const thead = $("#jeopardy thead");
	thead.empty();
	const headerRow = $("<tr></tr>");
	for (let x = 0; x < NUM_CATEGORIES; x++) {
		headerRow.append(`<th>${titles[x]}</th>`);
	}
	thead.append(headerRow);

	const tbody = $("#jeopardy tbody");
	tbody.empty();
	for (let y = 0; y < NUM_QUESTIONS_PER_CAT; y++) {
		const row = $("<tr></tr>");
		for (let x = 0; x < NUM_CATEGORIES; x++) {
			row.append(`<td><div id='${x}-${y}' class='clue-cell'>?</div></td>`);
		}
		tbody.append(row);
	}
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

 function handleClick(e) {
	let [x, y] = e.target.id.split("-");
	let clue = categories[x].clues[y];
	if (e.target.classList.contains("answer")) return;
	if (e.target.classList.contains("question")) {
		e.target.innerText = clue.answer;
		e.target.classList.remove("question");
		e.target.classList.add("answer");
		e.target.style.background = '#f7d51d';
		e.target.style.color = '#060ce9';
		return;
	}
	e.target.innerText = clue.question;
	e.target.classList.add("question");
	e.target.style.transition = 'background 0.3s, color 0.3s';
	e.target.style.background = '#ffe066';
	e.target.style.color = '#060ce9';
}


/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
	$("#loader").show();
	$("#jeopardy").hide();
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
	$("#loader").hide();
	$("#jeopardy").show();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

 async function setupAndStart() {
	categories = [];
	showLoadingView();
	const resCategories = await axios.get("http://jservice.io/api/categories", {
		params: { count: 100 }
	});
	let catIds = getCategoryIds(resCategories);
	for (id of catIds) {
		const resTitles = await axios.get("http://jservice.io/api/clues", {
			params: { category: id }
		});
		getCategory(resTitles);
	}
	fillTable();
	hideLoadingView();
}

/** On click of start / restart button, set up game. */
$("#restart").on("click", function() {
	setupAndStart();
});

/** On page load, add event handler for clicking clues */
$(document).ready(function() {
	setupAndStart();
	$("#jeopardy").on("click", ".clue-cell", handleClick);
});