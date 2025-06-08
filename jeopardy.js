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

// Use Open Trivia DB API endpoints
const TRIVIA_API_CATEGORIES = "https://opentdb.com/api_category.php";
const TRIVIA_API_QUESTIONS = "https://opentdb.com/api.php";

/** Get NUM_CATEGORIES random categories from Open Trivia DB API. */
async function getCategoryIds() {
    const res = await axios.get(TRIVIA_API_CATEGORIES);
    const allCategories = res.data.trivia_categories;
    // Randomly select NUM_CATEGORIES
    return _.sampleSize(allCategories, NUM_CATEGORIES);
}

/** Return object with data about a category from Open Trivia DB API. */
async function getCategory(cat) {
    // Fetch NUM_QUESTIONS_PER_CAT questions for this category
    const res = await axios.get(TRIVIA_API_QUESTIONS, {
        params: {
            amount: NUM_QUESTIONS_PER_CAT * 2, // Request more to avoid duplicates and ensure enough unique questions
            category: cat.id,
            type: "multiple"
        }
    });
    if (!res.data.results || res.data.results.length < NUM_QUESTIONS_PER_CAT) return null;
    // Remove duplicates by question text
    const unique = [];
    const seen = new Set();
    for (const q of res.data.results) {
        const text = decodeHtml(q.question);
        if (!seen.has(text)) {
            unique.push({
                question: text,
                answer: decodeHtml(q.correct_answer),
                showing: null
            });
            seen.add(text);
        }
        if (unique.length === NUM_QUESTIONS_PER_CAT) break;
    }
    if (unique.length < NUM_QUESTIONS_PER_CAT) return null;
    return {
        title: cat.name,
        clues: unique
    };
}

// Helper to decode HTML entities from API
function decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
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

// Utility: sleep for ms milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */
async function setupAndStart(retryCount = 0) {
    const MAX_RETRIES = 5;
    categories = [];
    showLoadingView();
    let catObjs = await getCategoryIds();
    for (let cat of catObjs) {
        let catData = await getCategory(cat);
        if (catData) categories.push(catData);
    }
    // If not enough valid categories, try again with delay
    if (categories.length < NUM_CATEGORIES) {
        if (retryCount < MAX_RETRIES) {
            await sleep(1000); // Wait 1 second before retrying
            await setupAndStart(retryCount + 1);
        } else {
            hideLoadingView();
            alert("Failed to load enough categories. Please try again later.");
        }
        return;
    }
    fillTable();
    hideLoadingView();
}